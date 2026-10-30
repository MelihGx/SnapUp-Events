"use strict";
const assert = require("node:assert/strict");
const { runReconcile } = require("../../scripts/r2Reconcile");

module.exports = async function reconcileScenarios({ t, sql }) {
  await sql("alter table public.event add column if not exists event_cover_r2_original_key text, add column if not exists event_cover_r2_display_key text, add column if not exists event_cover_storage_provider text");
  const event = "50000000-0000-0000-0000-000000000001";
  const guest = "60000000-0000-0000-0000-000000000001";
  const id = "70000000-0000-0000-0000-000000000001";
  const now = Date.UTC(2026, 9, 30), age = 86400000;
  const buckets = { originals: "fake-originals", display: "fake-display" };
  const key = `events/${event}/media/${id}/original.mp4`;
  const display = key.replace("original.mp4", "display.mp4");
  const poster = key.replace("original.mp4", "poster.webp");
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const db = { from(table) {
    assert.ok(["media", "event", "video_processing_jobs", "upload_quota_reservations", "upload_admission_leases"].includes(table));
    let columns, order, limit, after;
    const query = { select(value) { columns = value; return query; }, order(value) { order = value; return query; },
      limit(value) { limit = value; return query; }, gt(column, value) { assert.equal(column, order); after = value; return query; },
      then(resolve, reject) {
        return sql(`select coalesce(json_agg(x),'[]')::text from (select ${columns} from public.${table}${after ? ` where ${order}>${quote(after)}` : ""} order by ${order} limit ${limit}) x`)
          .then((value) => ({ data: JSON.parse(value), error: null })).then(resolve, reject);
      } };
    return query;
  } };
  let objects, deleted, onList;
  async function reset() {
    await sql("truncate public.event,public.event_guests,public.event_settings,public.media,public.video_processing_jobs,public.upload_quota_reservations,public.upload_admission_leases cascade");
    await sql(`insert into public.event(event_id) values('${event}'); insert into public.event_guests values('${guest}','${event}')`);
    objects = [{ key, size: 10, lastModified: new Date(now - 3 * age) }]; deleted = []; onList = null;
  }
  const options = () => ({ supabase: db, buckets, now, minAgeMs: age,
    async listObjects({ bucket, prefix }) {
      if (onList) await onList(prefix);
      return objects.filter((item) => item.key.startsWith(prefix) &&
        (item.key.endsWith("original.mp4") ? bucket === buckets.originals : bucket === buckets.display));
    },
    async deleteObject(item) { deleted.push(item); } });
  async function audit() { return (await runReconcile({ ...options(), now: now - age })).audit; }
  async function apply(previousAudit) { return runReconcile({ ...options(), apply: true, writersStopped: true, previousAudit }); }
  async function job(status) {
    await sql(`insert into public.video_processing_jobs(job_id,event_id,guest_id,target_media_status,status,original_key,display_key,poster_key,original_bytes)
      values('${id}','${event}','${guest}','pending','${status}',${quote(key)},${quote(display)},${quote(poster)},10)`);
  }
  for (const status of ["queued", "processing", "failed", "ready"]) {
    await t.test(`PATCH 5 real PG protects ${status} video original/display/poster`, async () => {
      await reset(); await job(status);
      objects.push(...[display, poster].map((key) => ({ key, size: 5, lastModified: new Date(now - 3 * age) })));
      const result = await runReconcile(options()); assert.equal(result.audit.candidates.length, 0); assert.equal(deleted.length, 0);
      if (status === "processing") await assert.rejects(apply({ version: 1, observedAt: now - age, buckets, candidates: [] }), /processing/);
    });
  }
  for (const state of ["reserved", "committed", "cancelled"]) {
    await t.test(`PATCH 5 real PG protects ${state} reservation including expired owner`, async () => {
      await reset();
      await sql(`insert into public.upload_quota_reservations(reservation_id,event_id,guest_id,lease_id,owner_hash,idempotency_key,fingerprint,bytes,file_count,assets,state)
        values('${id}','${event}','${guest}','${id}','${"a".repeat(64)}','isolated-key','${"b".repeat(64)}',10,1,
        ${quote(JSON.stringify([{ kind: "video", original_key: key, display_key: display, poster_key: poster }]))}::jsonb,'${state}')`);
      assert.equal((await runReconcile(options())).audit.candidates.length, 0);
    });
  }
  await t.test("PATCH 5 real PG deletes only aged twice-observed unreferenced fake objects", async () => {
    await reset(); const previous = await audit();
    assert.equal(deleted.length, 0);
    assert.equal((await apply(previous)).deleted, 1);
    assert.equal(deleted.length, 1);
  });
  await t.test("PATCH 5 real PG late reference before DELETE protects object", async () => {
    await reset(); const previous = await audit(); let added = false;
    onList = async (prefix) => { if (prefix !== "events/" && !added) { added = true;
      await sql(`update public.event set event_cover_r2_display_key=${quote(key)} where event_id='${event}'`); } };
    assert.equal((await apply(previous)).deleted, 0); assert.equal(deleted.length, 0);
  });
  await t.test("PATCH 5 real PG media references protect all columns without provider filtering", async () => {
    await reset();
    await sql(`insert into public.media(event_id,guest_id,bytes,r2_poster_key) values('${event}','${guest}',0,${quote(key)})`);
    assert.equal((await runReconcile(options())).audit.candidates.length, 0);
  });
  await t.test("PATCH 5 real PG active admission blocks apply", async () => {
    await reset(); const previous = await audit();
    await sql(`insert into public.upload_admission_leases values('${id}','${"a".repeat(64)}','${event}','${guest}','2099-01-01')`);
    await assert.rejects(apply(previous), /Live admission/); assert.equal(deleted.length, 0);
  });
  await t.test("PATCH 5 real PG missing table fails closed before deletion", async () => {
    await reset(); const previous = await audit();
    await sql("alter table public.upload_quota_reservations rename to patch5_hidden_reservations");
    try { await assert.rejects(apply(previous)); assert.equal(deleted.length, 0); }
    finally { await sql("alter table public.patch5_hidden_reservations rename to upload_quota_reservations"); }
  });
  await t.test("PATCH 5 real PG keyset pagination protects references beyond page one", async () => {
    await reset();
    await sql(`insert into public.event(event_id) select ('80000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,501) n;
      update public.event set event_cover_r2_original_key=${quote(key)} where event_id='80000000-0000-0000-0000-000000000501'`);
    assert.equal((await runReconcile(options())).audit.candidates.length, 0);
  });
};
