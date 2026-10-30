"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { runReconcile } = require("../scripts/r2Reconcile");
const now = Date.UTC(2026, 9, 30), age = 86400000;
const buckets = { originals: "fake-originals", display: "fake-display" };
const key = "events/test/media/orphan/original.png";
function fixture() {
  const rows = { media: [], event: [], video_processing_jobs: [], upload_quota_reservations: [], upload_admission_leases: [], video_worker_attempts: [] };
  const deleted = [];
  let calls = 0;
  const options = { now, minAgeMs: age, buckets,
    supabase: { from(table) {
      const query = { select() { return query; }, order() { return query; }, limit() { return query; },
        then(resolve, reject) { calls++; return Promise.resolve({ data: rows[table], error: null }).then(resolve, reject); } };
      return query;
    } },
    async listObjects({ bucket }) { return bucket === buckets.originals ? [{ key, size: 1, lastModified: new Date(now - 3 * age) }] : []; },
    async deleteObject(item) { deleted.push(item); },
  };
  return { rows, options, deleted, get calls() { return calls; } };
}
async function audited(f) { return (await runReconcile({ ...f.options, now: now - age })).audit; }
const apply = (f, previousAudit) => runReconcile({ ...f.options, apply: true, writersStopped: true, previousAudit });

test("PATCH 5 dry run never deletes and importing script has no service side effects", async () => {
  const f = fixture(); const result = await runReconcile(f.options);
  assert.equal(result.audit.candidates.length, 1); assert.deepEqual(f.deleted, []);
});
test("PATCH 5 apply requires stopped writers before any service access", async () => {
  const f = fixture(); await assert.rejects(runReconcile({ ...f.options, apply: true }), /writers-stopped/);
  assert.equal(f.calls, 0);
});
test("PATCH 5 aged matching audit is mandatory", async () => {
  const f = fixture(); const previous = await audited(f);
  for (const audit of [null, { ...previous, observedAt: now }, { ...previous, buckets: { originals: "other", display: "other2" } }]) {
    await assert.rejects(apply(f, audit), /audit/);
  }
  assert.equal(f.deleted.length, 0);
});
test("PATCH 5 unknown or malformed R2 age and size are protected", async () => {
  for (const item of [{ key, size: 1, lastModified: null }, { key, size: 1, lastModified: "bad" },
    { key, size: -1, lastModified: new Date(0) }, { key, size: 1, lastModified: new Date(now + 1) }]) {
    const f = fixture(); f.options.listObjects = async () => [item];
    assert.equal((await runReconcile(f.options)).audit.candidates.length, 0);
  }
});
test("PATCH 5 DB null data, error, rejection and malformed reference fail closed", async () => {
  for (const result of [{ data: null }, { error: { message: "outage" }, data: [] }, { data: [{}] }]) {
    const f = fixture(); f.options.supabase = { from() { const q = { select() { return q; }, order() { return q; }, limit() { return q; }, then(resolve) { return Promise.resolve(result).then(resolve); } }; return q; } };
    await assert.rejects(runReconcile(f.options)); assert.equal(f.deleted.length, 0);
  }
  const f = fixture(); f.options.supabase.from = () => { throw new Error("network"); };
  await assert.rejects(runReconcile(f.options), /network/);
});
test("PATCH 5 malformed reservation or unknown job state prevents deletion", async () => {
  for (const row of [{ reservation_id: "1", state: "reserved", assets: null },
    { reservation_id: "1", state: "reserved", assets: [{ kind: "video", original_key: key }] }]) {
    const f = fixture(); f.rows.upload_quota_reservations.push(row);
    await assert.rejects(runReconcile(f.options));
  }
  const f = fixture(); f.rows.video_processing_jobs.push({ job_id: "1", status: "unknown", original_key: key, display_key: null, poster_key: null });
  await assert.rejects(runReconcile(f.options));
});
test("PATCH 5 changed object between observation and apply is skipped", async () => {
  const f = fixture(); const previous = await audited(f);
  f.options.listObjects = async ({ bucket }) => bucket === buckets.originals ? [{ key, size: 2, lastModified: new Date(now - 2 * age) }] : [];
  assert.equal((await apply(f, previous)).deleted, 0);
});
test("PATCH 5 new object identity immediately before delete is skipped", async () => {
  const f = fixture(); const previous = await audited(f); const list = f.options.listObjects;
  f.options.listObjects = async (args) => { const result = await list(args); return args.prefix === key ? result.map((item) => ({ ...item, size: 99 })) : result; };
  assert.equal((await apply(f, previous)).deleted, 0);
});
test("PATCH 5 DB outage during final recheck aborts deletion", async () => {
  const f = fixture(); const previous = await audited(f); const list = f.options.listObjects;
  f.options.listObjects = async (args) => { if (args.prefix === key) f.options.supabase.from = () => { throw new Error("recheck outage"); }; return list(args); };
  await assert.rejects(apply(f, previous), /recheck outage/); assert.equal(f.deleted.length, 0);
});
test("PATCH 5 delete failure stops apply and is never counted as success", async () => {
  const f = fixture(); const previous = await audited(f);
  f.options.deleteObject = async () => { throw new Error("fake R2 deletion failed"); };
  await assert.rejects(apply(f, previous), /deletion failed/);
});
test("PATCH 5 new reference at final check skips deletion", async () => {
  const f = fixture(); const previous = await audited(f); const list = f.options.listObjects;
  f.options.listObjects = async (args) => { if (args.prefix === key) f.rows.event.push({ event_id: "1", event_cover_r2_original_key: key, event_cover_r2_display_key: null }); return list(args); };
  assert.equal((await apply(f, previous)).deleted, 0);
});
test("PATCH 5 unreferenced stable orphan is deleted after quarantine", async () => {
  const f = fixture(); assert.equal((await apply(f, await audited(f))).deleted, 1); assert.equal(f.deleted.length, 1);
});

test("PATCH 5 published missing object remains an integrity error and blocks apply", async () => {
  const f = fixture(); const previous = await audited(f);
  f.rows.media.push({ media_id: "1", r2_original_key: "events/missing", r2_display_key: null, r2_poster_key: null });
  assert.equal((await runReconcile(f.options)).missing.length, 1);
  await assert.rejects(apply(f, previous), /missing/); assert.equal(f.deleted.length, 0);
});
test("PATCH 5 reference in unexpected key column still protects object", async () => {
  const f = fixture(); f.rows.media.push({ media_id: "1", r2_original_key: null, r2_display_key: key, r2_poster_key: null });
  assert.equal((await runReconcile(f.options)).audit.candidates.length, 0);
});
test("PATCH 5 live lease appearing during final recheck stops deletion", async () => {
  const f = fixture(); const previous = await audited(f); const list = f.options.listObjects;
  f.options.listObjects = async (args) => { if (args.prefix === key) f.rows.upload_admission_leases.push({ lease_id: "1", expires_at: "2099-01-01" }); return list(args); };
  await assert.rejects(apply(f, previous), /Writer activity/); assert.equal(f.deleted.length, 0);
});
test("PATCH 5 malformed lease timestamp fails closed", async () => {
  const f = fixture(); f.rows.upload_admission_leases.push({ lease_id: "1", expires_at: "invalid" });
  await assert.rejects(runReconcile(f.options)); assert.equal(f.deleted.length, 0);
});

test("PATCH 5 R2 list adapter preserves unknown metadata and rejects incomplete pagination", async () => {
  const Module = require("node:module");
  const originalLoad = Module._load;
  let response = { Contents: [{ Key: key }], IsTruncated: false };
  const modulePath = require.resolve("../services/r2MediaService");
  delete require.cache[modulePath];
  let service;
  try {
    Module._load = function (name, parent, isMain) {
      if (parent?.filename === modulePath && name === "../config/r2") return {
        getR2Client: () => ({ send: async () => response }), getR2Buckets: () => buckets,
      };
      return originalLoad.call(this, name, parent, isMain);
    };
    service = require(modulePath);
  } finally { Module._load = originalLoad; delete require.cache[modulePath]; }
  const result = await service.listBucketObjects({ bucket: buckets.originals });
  assert.equal(result[0].size, null); assert.equal(result[0].lastModified, null);
  response = { Contents: [], IsTruncated: true };
  await assert.rejects(service.listBucketObjects({ bucket: buckets.originals }), /pagination/);
  response = { Contents: [], IsTruncated: true, NextContinuationToken: "repeated" };
  await assert.rejects(service.listBucketObjects({ bucket: buckets.originals }), /pagination/);
});

test("PATCH 5 R2 provider with incomplete key metadata blocks cleanup", async () => {
  const f = fixture(); f.rows.media.push({ media_id: "1", storage_provider: "r2", r2_original_key: key, r2_display_key: null, r2_poster_key: null });
  await assert.rejects(runReconcile(f.options)); assert.equal(f.deleted.length, 0);
});
