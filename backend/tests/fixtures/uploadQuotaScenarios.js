"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createUploadQuotaService } = require("../../services/uploadQuotaService");

module.exports = async function quotaScenarios({ t, sql, root, connect }) {
  const event = "30000000-0000-0000-0000-000000000001";
  const guest = (n) => `40000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
  const q = (value) => value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
  async function call(name, args) {
    return JSON.parse(await sql(`select public.${name}(${Object.values(args).map((value) => q(value !== null && typeof value === "object" ? JSON.stringify(value) : value)).join(",")})::text`));
  }
  // Representative application schema, never the user's existing database.
  await sql(`create table public.event(event_id uuid primary key,is_event_active boolean default true,package_key text default 'free',storage_consumed_bytes bigint not null default 0,storage_limit_override_bytes bigint);
    create table public.event_guests(guest_id uuid primary key,event_id uuid references public.event);
    create table public.event_settings(event_id uuid primary key references public.event,allow_upload boolean default true,max_storage_per_guest integer default 250,max_upload_per_guest integer);
    create table public.media(media_id uuid primary key default gen_random_uuid(),event_id uuid references public.event,guest_id uuid references public.event_guests,
      media_type_id integer,media_url text,message text,media_status text,bytes bigint,storage_provider text,r2_original_key text,r2_display_key text,r2_poster_key text,
      original_bytes bigint,display_bytes bigint,original_mime_type text,display_mime_type text,video_duration_seconds numeric,video_width integer,video_height integer,
      cloudinary_public_id text,resource_type text,delivery_type text,format text,created_at timestamptz not null default now());`);
  // psql's Windows argv uses the ANSI codepage; strip non-ASCII comment text.
  await sql((await fs.readFile(path.join(__dirname, "../../database/2026-10-05-video-background-processing.sql"), "utf8")).replace(/^--.*$/gm, ""));
  const migration = await fs.readFile(path.join(__dirname, "../../database/2026-10-21-atomic-upload-quota.sql"), "utf8");
  await sql(migration);
  await sql("create trigger media_guest_quota_guard before insert on public.media for each row execute function public.enforce_guest_media_quota()");
  async function reset({ limit = 100 * 1048576, consumed = 0, guestMb = 250, count = null } = {}) {
    await sql(`truncate public.media,public.video_processing_jobs,public.event_settings,public.event_guests,public.event,public.upload_quota_reservations,public.upload_admission_leases cascade;
      update public.upload_admission_policy set global_limit=50,event_limit=50,guest_limit=50,lease_seconds=90;
      insert into public.event values('${event}',true,'free',${consumed},${limit});
      insert into public.event_settings values('${event}',true,${guestMb},${count === null ? "null" : count});
      insert into public.event_guests values ${Array.from({ length: 25 }, (_, i) => `('${guest(i + 1)}','${event}')`).join(",")};`);
  }
  function asset(bytes, kind = "image") {
    const id = crypto.randomUUID(), prefix = `events/${event}/media/${id}`;
    return { kind, bytes, asset_id: id, original_key: `${prefix}/original.${kind === "image" ? "png" : "mp4"}`,
      display_key: `${prefix}/display.${kind === "image" ? "webp" : "mp4"}`, poster_key: kind === "image" ? null : `${prefix}/poster.webp` };
  }
  async function prepareReservation({ bytes = 10, kind = "image", g = 1, key = crypto.randomUUID(), assets } = {}) {
    assets ||= [asset(bytes, kind)];
    const owner = "a".repeat(64), lease = crypto.randomUUID(), id = crypto.randomUUID();
    await call("acquire_upload_admission", { lease, owner, event, guest: guest(g) });
    const args = { id, lease, owner, event, guest: guest(g), key, fingerprint: "b".repeat(64), bytes, count: assets.length, assets };
    return { args, assets, id, owner, lease, g };
  }
  async function reservation(options) {
    const r = await prepareReservation(options);
    return { ...r, result: await call("reserve_upload_quota", r.args) };
  }
  function rows(r) {
    return {
      media: r.assets.filter((a) => a.kind === "image").map((a) => ({ event_id: event, guest_id: guest(r.g), media_type_id: 1,
        media_url: "https://example.invalid/display.webp", media_status: "pending", bytes: a.bytes, storage_provider: "r2",
        original_bytes: a.bytes, r2_original_key: a.original_key, r2_display_key: a.display_key, resource_type: "image", delivery_type: "authenticated", format: "webp" })),
      jobs: r.assets.filter((a) => a.kind === "video").map((a) => ({ event_id: event, guest_id: guest(r.g), target_media_status: "pending",
        original_key: a.original_key, display_key: a.display_key, poster_key: a.poster_key, original_bytes: a.bytes })),
    };
  }
  async function finalize(r, override) { const data = override || rows(r); return call("finalize_upload_quota", { id: r.id, owner: r.owner, media: data.media, jobs: data.jobs }); }
  async function consumed() { return Number(await sql(`select storage_consumed_bytes from public.event where event_id='${event}'`)); }
  async function usage() { return JSON.parse(await sql(`select row_to_json(u)::text from public.upload_quota_guest_usage('${event}','${guest(1)}') u`)); }
  const deadlock = await require("./quotaDeadlockScenarios")({ t, sql, connect, reset,
    prepareReservation, reservation, finalize, rows, consumed, usage, event, guest, q });
  await reset();
  await t.test("PATCH 3 migration replay fails transactionally and preserves existing data", async () => {
    await sql(`update public.event set storage_consumed_bytes=1234 where event_id='${event}'`);
    await assert.rejects(sql(migration));
    assert.equal(await consumed(), 1234);
  });
  await t.test("PATCH 3 photo accepts pending, finalize twice and delete never refunds event consumption", async () => {
    await reset(); const r = await reservation({ bytes: 100 });
    assert.equal(await consumed(), 0);
    const result = await finalize(r);
    assert.equal(result.media[0].media_status, "pending");
    assert.equal(await consumed(), 100);
    assert.deepEqual(await finalize(r), result);
    assert.equal(await consumed(), 100);
    await sql("delete from public.media");
    assert.equal(await consumed(), 100);
    assert.equal((await call("cancel_upload_quota", { id: r.id, owner: r.owner })).state, "committed");
  });
  await t.test("PATCH 3 two 80 MiB attempts compete over 100 MiB remaining", async () => {
    await reset();
    const results = await Promise.allSettled([reservation({ bytes: 80 * 1048576, g: 1 }), reservation({ bytes: 80 * 1048576, g: 2 })]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.match(results.find((r) => r.status === "rejected").reason.message, /EVENT_STORAGE_QUOTA_EXCEEDED/);
    await finalize(results.find((r) => r.status === "fulfilled").value);
    assert.equal(await consumed(), 80 * 1048576);
  });
  await t.test("PATCH 3 twenty concurrent uploads serialize without deadlock or quota overshoot", async () => {
    await reset({ limit: 10 * 1048576 });
    const start = performance.now();
    const attempts = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => reservation({ bytes: 1048576, g: i + 1 })));
    const accepted = attempts.filter((r) => r.status === "fulfilled").map((r) => r.value);
    assert.equal(accepted.length, 10);
    for (const r of attempts.filter((r) => r.status === "rejected")) assert.match(r.reason.message, /EVENT_STORAGE_QUOTA_EXCEEDED/);
    await Promise.all(accepted.map((r) => finalize(r)));
    assert.equal(await consumed(), 10 * 1048576);
    t.diagnostic(`20-way quota contention + 10 finalizations: ${(performance.now() - start).toFixed(1)} ms, includes psql process startup.`);
  });
  await t.test("PATCH 3 exact event/guest/count boundaries and NULL unlimited count", async () => {
    await reset({ limit: 1048576, guestMb: 1, count: 1 });
    await finalize(await reservation({ bytes: 1048576 }));
    assert.equal(await consumed(), 1048576);
    await assert.rejects(reservation({ bytes: 1 }), /EVENT_STORAGE_QUOTA_EXCEEDED/);
    await reset({ guestMb: 1 });
    await finalize(await reservation({ bytes: 1048576 }));
    await assert.rejects(reservation({ bytes: 1 }), /GUEST_STORAGE_QUOTA_EXCEEDED/);
    await reset({ count: 1 });
    await reservation();
    await assert.rejects(reservation(), /GUEST_UPLOAD_LIMIT_EXCEEDED/);
    await reset({ count: null });
    await finalize(await reservation({ bytes: 2, assets: [asset(1), asset(1)] }));
    assert.equal((await usage()).items, 2);
  });
  await t.test("PATCH 3 concurrent guest reservations include each other's bytes", async () => {
    await reset({ limit: 500 * 1048576, guestMb: 100 });
    const attempts = await Promise.allSettled([reservation({ bytes: 80 * 1048576 }), reservation({ bytes: 80 * 1048576 })]);
    assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
    assert.match(attempts.find((r) => r.status === "rejected").reason.message, /GUEST_STORAGE_QUOTA_EXCEEDED/);
  });
  await t.test("PATCH 3 video queue, worker publication gap, completion and failure keep cumulative bytes", async () => {
    await reset({ count: 1 });
    const r = await reservation({ bytes: 100, kind: "video" });
    const output = await finalize(r), jobId = output.video_jobs[0].job_id;
    assert.equal(await consumed(), 100);
    assert.deepEqual(await usage(), { bytes: 100, items: 1 });
    // Execute the worker's actual upsert shape (not FFmpeg) and delayed status publication.
    await sql(`insert into public.media(media_id,event_id,guest_id,media_type_id,bytes,storage_provider,r2_original_key,r2_display_key)
      select job_id,event_id,guest_id,2,original_bytes,'r2',original_key,display_key from public.video_processing_jobs
      on conflict(media_id) do update set bytes=excluded.bytes`);
    assert.deepEqual(await usage(), { bytes: 100, items: 1 });
    await sql(`update public.video_processing_jobs set status='ready',media_id='${jobId}'`);
    assert.equal(await consumed(), 100);
    await reset(); const failed = await reservation({ bytes: 100, kind: "video" }); await finalize(failed);
    await sql("update public.video_processing_jobs set status='failed'");
    assert.equal(await consumed(), 100);
    assert.deepEqual(await usage(), { bytes: 0, items: 0 });
  });
  await t.test("PATCH 3 cancel twice, expiry/restart and queued lease expiry", async () => {
    await reset(); const r = await reservation({ bytes: 100 });
    assert.equal((await call("cancel_upload_quota", { id: r.id, owner: r.owner })).state, "cancelled");
    assert.equal((await call("cancel_upload_quota", { id: r.id, owner: r.owner })).state, "cancelled");
    assert.equal(await consumed(), 0);
    await assert.rejects(finalize(r), /QUOTA_RESERVATION_CANCELLED/);
    const crash = await reservation();
    await sql(`update public.upload_admission_leases set expires_at=clock_timestamp()-interval '1 second' where lease_id='${crash.lease}'`);
    await assert.rejects(finalize(crash), /UPLOAD_ADMISSION_LOST/);
    const preview = await call("list_upload_quota_cleanup", { apply: false });
    assert.ok(preview.some((row) => row.reservation_id === crash.id));
    assert.equal(await sql(`select state from public.upload_quota_reservations where reservation_id='${crash.id}'`), "reserved");
    await call("list_upload_quota_cleanup", { apply: true });
    assert.equal(await sql(`select state from public.upload_quota_reservations where reservation_id='${crash.id}'`), "cancelled");
    const queued = await reservation({ kind: "video" }); await finalize(queued);
    await sql("update public.upload_admission_leases set expires_at=clock_timestamp()-interval '1 second'");
    await call("list_upload_quota_cleanup", { apply: true });
    assert.equal(await consumed(), 10);
    assert.equal(await sql(`select state from public.upload_quota_reservations where reservation_id='${queued.id}'`), "committed");
  });
  await t.test("PATCH 3 worker holding guest lock and quota reservation do not deadlock", async () => {
    await deadlock.race({ mode: "reserve" });
  });
  await t.test("PATCH 3 an external long lock times out without changing quota", async () => {
    await reset(); const r = await reservation();
    const holder = sql(`begin; select 1 from public.event where event_id='${event}' for update; select pg_sleep(6); commit;`);
    let locked = false;
    for (let i = 0; i < 20; i++) {
      locked = await sql("select exists(select 1 from pg_locks where relation='public.event'::regclass and mode='RowShareLock' and granted)") === "t";
      if (locked) break;
    }
    assert.equal(locked, true);
    await assert.rejects(finalize(r), /lock timeout/);
    await holder;
    assert.equal(await consumed(), 0);
    assert.equal(await sql(`select state from public.upload_quota_reservations where reservation_id='${r.id}'`), "reserved");
    await finalize(r); assert.equal(await consumed(), 10);
  });
  await t.test("PATCH 3 failed image/job DB inserts roll back media, queue, counter and state together", async () => {
    await reset(); const r = await reservation({ bytes: 2, assets: [asset(1), asset(1, "video")] });
    const data = rows(r); data.jobs[0].target_media_status = "invalid";
    await assert.rejects(finalize(r, data));
    assert.equal(await sql("select count(*) from public.media"), "0");
    assert.equal(await sql("select count(*) from public.video_processing_jobs"), "0");
    assert.equal(await consumed(), 0);
    assert.equal(await sql(`select state from public.upload_quota_reservations where reservation_id='${r.id}'`), "reserved");
    await call("cancel_upload_quota", { id: r.id, owner: r.owner });
  });
  await t.test("PATCH 3 admin override and reductions while uploading", async () => {
    await reset({ limit: 200 * 1048576 });
    await finalize(await reservation({ bytes: 150 * 1048576 }));
    assert.equal(await consumed(), 150 * 1048576);
    await reset(); const r = await reservation({ bytes: 80 * 1048576 });
    await sql("update public.event set storage_limit_override_bytes=50*1048576");
    await assert.rejects(finalize(r), /EVENT_STORAGE_QUOTA_EXCEEDED/);
    assert.equal(await consumed(), 0);
  });
  await t.test("PATCH 3 legacy consumption and pending videos are not charged twice", async () => {
    await reset({ consumed: 1234 });
    await sql(`insert into public.video_processing_jobs(event_id,guest_id,target_media_status,original_key,display_key,poster_key,original_bytes)
      values('${event}','${guest(1)}','pending','legacy-original','legacy-display','legacy-poster',100)`);
    await finalize(await reservation({ bytes: 10 }));
    assert.equal(await consumed(), 1244);
    assert.equal((await usage()).bytes, 110);
  });
  await t.test("PATCH 3 same logical key replays committed data, conflicts while active, retries cancelled attempts", async () => {
    await reset(); const key = crypto.randomUUID();
    const first = await reservation({ key });
    await assert.rejects(reservation({ key }), /UPLOAD_IN_PROGRESS/);
    await assert.rejects(call("reserve_upload_quota", { ...first.args, fingerprint: "c".repeat(64) }), /UPLOAD_IDEMPOTENCY_CONFLICT/);
    await assert.rejects(call("finalize_upload_quota", { id: first.id, owner: "c".repeat(64), ...rows(first) }), /QUOTA_RESERVATION_NOT_FOUND/);
    assert.equal((await call("cancel_upload_quota", { id: first.id, owner: "c".repeat(64) })).state, "missing");
    const output = await finalize(first);
    const replay = await reservation({ key });
    assert.equal(replay.result.state, "committed"); assert.deepEqual(replay.result.result, output);
    assert.equal(await consumed(), 10);
    const failed = await reservation({ key: "failed-operation-key" });
    await call("cancel_upload_quota", { id: failed.id, owner: failed.owner });
    await finalize(await reservation({ key: "failed-operation-key" }));
    assert.equal(await consumed(), 20);
  });
  await t.test("PATCH 3 real quota service + fake R2 failure and ambiguous committed reply", async () => {
    await reset();
    const filePath = path.join(root, "tiny-upload.png"); await fs.writeFile(filePath, "test-bytes");
    const file = { path: filePath, size: 10, mimetype: "image/png", detectedFormat: "png" };
    const owner = "c".repeat(64), lease = crypto.randomUUID();
    await call("acquire_upload_admission", { lease, owner, event, guest: guest(1) });
    let dropFinalizeReply = false;
    const service = createUploadQuotaService({ supabase: { rpc(name, args) {
      return { async abortSignal() {
        try {
          const result = await call(name, args);
          if (name === "finalize_upload_quota" && dropFinalizeReply) throw new Error("simulated lost response");
          return { data: result };
        } catch (error) { return { error: { message: error.message } }; }
      } };
    } } });
    const req = { get: () => "logical-upload-key-123", uploadIdentity: { eventId: event, guestId: guest(1) },
      uploadLease: { ownership: { p_lease_id: lease, p_owner_hash: owner }, assertValid() {} } };
    const failed = await service.reserve({ req, files: [file], message: null });
    const fakeR2 = { async put() { throw new Error("R2 failure"); } };
    await assert.rejects(fakeR2.put());
    await failed.cancel(); assert.equal(await consumed(), 0);
    const ready = await service.reserve({ req, files: [file], message: null });
    const r = { assets: ready.assets, g: 1 }; const data = rows(r);
    dropFinalizeReply = true;
    await assert.rejects(ready.finalize(data.media, data.jobs));
    const resolved = await ready.cancel();
    assert.equal(resolved.state, "committed"); assert.equal(await consumed(), 10);
    const replay = await service.reserve({ req, files: [file], message: null });
    assert.equal(replay.state, "committed"); assert.equal(await consumed(), 10);
  });
  await t.test("PATCH 3 direct reservation functions reject anon/authenticated callers", async () => {
    await assert.rejects(sql("set role anon; select public.list_upload_quota_cleanup(true)"));
    await assert.rejects(sql("set role authenticated; select * from public.upload_quota_reservations"));
  });
  await require("./uploadQuotaRouteScenarios")({ t, sql, call, reset, root, event, guest: guest(1) });
};
