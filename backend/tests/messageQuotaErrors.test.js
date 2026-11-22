"use strict";
// Execute the actual message handler and precheck in isolation: no app startup,
// Supabase client, database, R2, worker or network connection is loaded.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { mapUploadQuotaError, createUploadQuotaService } = require("../services/uploadQuotaService");
const source = fs.readFileSync(require.resolve("../routes/mediaRoutes"), "utf8");
function fixture({ dbError, count = 0, pending = 0, thrown, invalidToken = false } = {}) {
  let handler, inserted, reads = 0;
  const row = { media_id: "message-1" };
  const context = {
    router: { post(_path, ...stages) { handler = stages.at(-1); } },
    uploadLimiter() {}, optionalAuth() {}, mapUploadQuotaError,
    createHttpError(message, statusCode, code) { return Object.assign(new Error(message), { statusCode, code }); },
    verifyGuestToken() { if (invalidToken) throw new Error("invalid"); return { event_id: "event-1", guest_id: "guest-1" }; },
    hashGuestToken() { return "hash"; },
    async getGuestSecurity() { if (thrown) throw thrown; return { guest_access_token_hash: "hash" }; },
    async getUploadStatusForEvent() { return { mediaStatus: "pending", onlyUsers: false, maxUploadPerGuest: 2 }; },
    assertRegisteredUserAccess() {},
    async getPendingVideoUsage() { return { count: pending }; },
    async getMediaTypeId() { return "message-type"; },
    cleanText(value) { return value.trim(); }, getMediaStorageProvider() { return "database"; },
    supabase: { from(table) {
      assert.equal(table, "media");
      const query = { select() { return query; }, eq() { return query; },
        insert(value) { inserted = value; return query; },
        async single() { return { data: row, error: dbError }; },
        then(resolve, reject) { reads++; return Promise.resolve({ count }).then(resolve, reject); } };
      return query;
    } },
  };
  vm.createContext(context);
  const precheck = source.slice(source.indexOf("async function checkGuestUploadLimit("), source.indexOf("function uploadToCloudinary("));
  const route = source.slice(source.indexOf('router.post("/message"'), source.indexOf('router.post("/:mediaId/like"'));
  vm.runInContext(precheck + route, context);
  return { async send() {
    const req = { body: { event_id: "event-1", guest_id: "guest-1", message: " hello " }, get() { return "token"; } };
    const res = { status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
    await handler(req, res);
    return { status: res.statusCode, body: JSON.parse(JSON.stringify(res.body)), inserted: inserted && JSON.parse(JSON.stringify(inserted)), reads };
  } };
}
for (const [code, status] of [["GUEST_UPLOAD_LIMIT_EXCEEDED", 400], ["GUEST_STORAGE_QUOTA_EXCEEDED", 413]]) {
  test("message INSERT maps " + code, async () => {
    const result = await fixture({ dbError: { code: "P0001", message: code, details: "PRIVATE_DB_DETAIL" } }).send();
    assert.equal(result.status, status);
    assert.deepEqual(result.body, { success: false, code, message: "Upload failed.", error: "Upload failed." });
  });
}
test("message precheck returns canonical count code before INSERT, including pending videos", async () => {
  for (const usage of [{ count: 2 }, { count: 1, pending: 1 }]) {
    const result = await fixture(usage).send();
    assert.equal(result.status, 400); assert.equal(result.body.code, "GUEST_UPLOAD_LIMIT_EXCEEDED");
    assert.equal(result.body.success, false); assert.match(result.body.message, /Upload limit exceeded/);
    assert.equal(result.body.error, result.body.message); assert.equal(result.inserted, undefined);
  }
});
test("unknown DB failures stay 500 and redact database messages/codes", async () => {
  for (const message of ["PRIVATE_DB_DETAIL", "GUEST_UPLOAD_LIMIT_EXCEEDED extra details", "guest storage quota exceeded"]) {
    const result = await fixture({ dbError: { code: "23505", message } }).send();
    assert.equal(result.status, 500);
    assert.deepEqual(result.body, { success: false, code: "MESSAGE_SAVE_FAILED", message: "Message save failed.", error: "Message save failed." });
  }
});
test("unexpected thrown failures redact raw details", async () => {
  const result = await fixture({ thrown: Object.assign(new Error("PRIVATE_DB_DETAIL"), { code: "PRIVATE_DB_CODE" }) }).send();
  assert.equal(result.status, 500); assert.equal(result.body.code, "MESSAGE_SAVE_FAILED");
  assert.doesNotMatch(JSON.stringify(result.body), /PRIVATE_DB/);
});
test("successful message keeps 201 and the existing database payload", async () => {
  const result = await fixture({ count: 1 }).send();
  assert.equal(result.status, 201);
  assert.deepEqual(result.body, { success: true, message: "Message saved successfully.", media: { media_id: "message-1" } });
  assert.deepEqual(result.inserted, { event_id: "event-1", guest_id: "guest-1", media_type_id: "message-type", media_url: null, message: "hello", media_status: "pending", storage_provider: "database" });
});
test("invalid guest session still returns 401 without INSERT", async () => {
  const result = await fixture({ invalidToken: true }).send();
  assert.equal(result.status, 401); assert.equal(result.body.code, "INVALID_GUEST_SESSION"); assert.equal(result.inserted, undefined);
});
test("shared RPC mapping retains existing upload statuses and safe messages", async () => {
  for (const [message, status, code = message] of [
    ["GUEST_UPLOAD_LIMIT_EXCEEDED",400], ["GUEST_STORAGE_QUOTA_EXCEEDED",413], ["EVENT_STORAGE_QUOTA_EXCEEDED",413],
    ["UPLOAD_IDEMPOTENCY_CONFLICT",409], ["UPLOAD_IN_PROGRESS",409], ["UPLOAD_DISABLED",403], ["UPLOAD_ADMISSION_LOST",503],
    ["PRIVATE_DB_DETAIL",503,"UPLOAD_QUOTA_UNAVAILABLE"],
  ]) {
    const service = createUploadQuotaService({ supabase: { rpc() { return { async abortSignal() { return { error: { message } }; } }; } } });
    const req = { get() {}, uploadLease: { ownership: { p_owner_hash: "hash", p_lease_id: "lease" } }, uploadIdentity: { eventId: "event", guestId: "guest" } };
    await assert.rejects(service.reserve({ req, files: [], message: null }), e => e.statusCode === status && e.code === code && e.message === "Upload failed.");
  }
});
