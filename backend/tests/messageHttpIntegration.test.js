"use strict";

// Real router, JWT verification, optionalAuth, validation and rate limiter.
// Only loopback HTTP is used. External clients are replaced before module load.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const express = require("express");
const jwt = require("jsonwebtoken");

test("message real Express HTTP integration with isolated dependencies", { timeout: 30000 }, async (t) => {
  const savedEnv = Object.fromEntries(["JWT_SECRET", "GUEST_JWT_SECRET", "NODE_ENV"].map(k => [k, process.env[k]]));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "snapup-message-http-"));
  const secret = "synthetic-message-http-secret-only";
  process.env.JWT_SECRET = secret;
  process.env.GUEST_JWT_SECRET = secret;
  process.env.NODE_ENV = "test";
  const claims = { type: "guest", event_id: "synthetic-event", guest_id: "synthetic-guest", user_id: "synthetic-user" };
  const sign = (payload, options = {}) => jwt.sign(payload, secret, {
    algorithm: "HS256", issuer: "snapup-events", audience: "snapup-guest", expiresIn: "1h", ...options,
  });
  const token = sign(claims);
  const userToken = sign({ user_id: claims.user_id, token_version: 0 }, { audience: "snapup-web" });
  const hash = value => require("node:crypto").createHash("sha256").update(value).digest("hex");
  let state, writes, calls, server, security;
  function reset() {
    state = { limit: 2, count: 0, pending: 0, active: true, allow: true, onlyUsers: false,
      approved: false, revoked: false, userActive: true, userId: claims.user_id };
    writes = []; calls = [];
    security?.uploadLimiter.resetKey("127.0.0.1");
  }
  reset();
  const db = {
    rpc() { throw new Error("Message must not call an upload RPC"); },
    from(table) {
      const filters = {};
      let inserted;
      const query = {
        select() { return query; }, eq(key, value) { filters[key] = value; return query; }, in() { return query; },
        insert(row) { inserted = row; writes.push({ table, row }); return query; },
        async single() { return result(); }, async maybeSingle() { return result(); },
        then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); },
      };
      function result() {
        calls.push({ table, filters: { ...filters }, inserted: Boolean(inserted) });
        if (inserted) {
          if (state.rejectInsert) throw new Error("PRIVATE_INSERT_REJECTION");
          return state.dbError ? { error: state.dbError } : { data: { ...inserted, media_id: "synthetic-message" } };
        }
        if (table === "event_guests") return { data: state.missingGuest ? null : {
          ...claims, user_id: state.userId, guest_access_token_hash: state.revoked ? "revoked" : hash(state.acceptedToken || token),
        } };
        if (table === "event") return { data: { event_id: claims.event_id, is_event_active: state.active, package_key: "free", storage_consumed_bytes: 0 } };
        if (table === "event_settings") return { data: { allow_upload: state.allow, require_approval: !state.approved,
          max_upload_per_guest: state.limit, max_storage_per_guest: 250, only_users: state.onlyUsers } };
        if (table === "media_type") { assert.equal(filters.media_type, "message"); return { data: { media_type_id: "synthetic-message-type" } }; }
        if (table === "media") return state.countError ? { error: { message: "PRIVATE_COUNT_FAILURE" } } : { count: state.count };
        if (table === "video_processing_jobs") return { data: [], count: state.pending };
        if (table === "users") return { data: { user_id: claims.user_id, is_user_active: state.userActive, token_version: 0 } };
        throw new Error("Unexpected mock table: " + table);
      }
      return query;
    },
  };
  const forbidden = () => { throw new Error("External media operation forbidden in message tests"); };
  const mocks = {
    "../config/supabaseClient": db,
    "../config/cloudinary": {},
    "../services/cloudinaryDelivery": { signAssetUrls: body => body },
    "../services/r2MediaService": { deleteMediaAssets: forbidden, uploadImagePair: forbidden, uploadVideoOriginal: forbidden },
    "../services/videoProcessingService": { probeVideoFile: forbidden, validateVideoMetadata: forbidden },
    "../services/videoProcessingQueueService": { wakeVideoProcessingWorker: forbidden },
  };
  const originalLoad = Module._load;
  const originalCache = new Map(Object.entries(require.cache));
  try {
    let router;
    try {
      Module._load = function (name, parent, isMain) {
        if (parent?.filename.startsWith(path.resolve(__dirname, "..") + path.sep)) {
          if (Object.hasOwn(mocks, name)) return mocks[name];
          if (name === "os") return { ...os, tmpdir: () => root };
        }
        return originalLoad.call(this, name, parent, isMain);
      };
      router = require("../routes/mediaRoutes");
      security = require("../middlewares/security");
    } finally { Module._load = originalLoad; }
    const app = express();
    app.use(express.json({ limit: "256kb", strict: true }));
    // The actual application wrapper also removes error/details in production.
    app.use(security.requestContext);
    app.use("/api/media", router);
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    async function send({ body, guestToken = token, headers = {} } = {}) {
      const bytes = JSON.stringify(body || { event_id: claims.event_id, guest_id: claims.guest_id, message: " hello " });
      return new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port: server.address().port, path: "/api/media/message", method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(bytes), "x-guest-token": guestToken, ...headers } }, res => {
          let text = ""; res.setEncoding("utf8"); res.on("data", chunk => { text += chunk; });
          res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(text), headers: res.headers }); } catch (error) { reject(error); } });
          res.on("error", reject);
        });
        req.setTimeout(3000, () => req.destroy(new Error("Loopback HTTP timeout")));
        req.on("error", reject); req.end(bytes);
      });
    }
    const scenario = (name, fn) => t.test(name, async () => { reset(); await fn(); });
    function failure(res, status, code) {
      assert.equal(res.status, status); assert.equal(res.body.success, false); assert.equal(res.body.code, code);
      assert.deepEqual(Object.keys(res.body).sort(), ["code", "error", "message", "success"]);
      assert.equal(typeof res.body.message, "string"); assert.equal(res.body.error, res.body.message);
      assert.doesNotMatch(JSON.stringify(res.body), /PRIVATE_|P0001|23505/);
    }
    await scenario("201 success and exact message INSERT fields", async () => {
      const res = await send();
      const row = { event_id: claims.event_id, guest_id: claims.guest_id, media_type_id: "synthetic-message-type",
        media_url: null, message: "hello", media_status: "pending", storage_provider: "database" };
      assert.equal(res.status, 201);
      assert.deepEqual(res.body, { success: true, message: "Message saved successfully.", media: { ...row, media_id: "synthetic-message" } });
      assert.deepEqual(writes, [{ table: "media", row }]);
      assert.ok(calls.some(c => c.table === "event_guests" && c.filters.event_id === claims.event_id && c.filters.guest_id === claims.guest_id));
    });
    for (const [code, status] of [["GUEST_UPLOAD_LIMIT_EXCEEDED", 400], ["GUEST_STORAGE_QUOTA_EXCEEDED", 413]]) {
      await scenario("INSERT quota " + code, async () => {
        state.dbError = { message: code, code: "P0001", details: "PRIVATE_DB_DETAILS" };
        const res = await send(); failure(res, status, code); assert.equal(res.body.message, "Upload failed."); assert.equal(writes.length, 1);
      });
    }
    await scenario("unexpected INSERT database error is sanitized 500", async () => {
      state.dbError = { message: "PRIVATE_DATABASE_ERROR", code: "23505", details: "PRIVATE_DETAILS" };
      failure(await send(), 500, "MESSAGE_SAVE_FAILED");
    });
    await scenario("INSERT promise rejection is sanitized 500", async () => {
      state.rejectInsert = true; failure(await send(), 500, "MESSAGE_SAVE_FAILED"); assert.equal(writes.length, 1);
    });
    await scenario("precheck rejects existing media and pending-video count without INSERT", async () => {
      state.count = 1; state.pending = 1;
      failure(await send(), 400, "GUEST_UPLOAD_LIMIT_EXCEEDED"); assert.equal(writes.length, 0);
    });
    await scenario("precheck database failure is sanitized 500", async () => {
      state.countError = true; failure(await send(), 500, "MESSAGE_SAVE_FAILED"); assert.equal(writes.length, 0);
    });
    for (const [name, guestToken] of [["missing", ""], ["invalid", "invalid"], ["expired", sign(claims, { expiresIn: -1 })],
      ["wrong audience", sign(claims, { audience: "snapup-web" })]]) {
      await scenario(name + " guest JWT rejected", async () => {
        const res = await send({ guestToken }); assert.equal(res.status, 401); assert.equal(res.body.code, "INVALID_GUEST_SESSION"); assert.equal(writes.length, 0);
      });
    }
    await scenario("guest event mismatch rejected", async () => {
      const res = await send({ body: { event_id: "other-synthetic-event", guest_id: claims.guest_id, message: "hello" } });
      assert.equal(res.status, 403); assert.equal(res.body.message, "Guest session mismatch."); assert.equal(writes.length, 0);
    });
    await scenario("revoked guest rejected", async () => {
      state.revoked = true; const res = await send(); assert.equal(res.status, 401); assert.equal(res.body.code, "GUEST_SESSION_REVOKED"); assert.equal(writes.length, 0);
    });
    await scenario("registered-only event rejects anonymous guest", async () => {
      state.onlyUsers = true; failure(await send(), 401, "REGISTERED_USERS_ONLY"); assert.equal(writes.length, 0);
    });
    await scenario("real optionalAuth accepts matching bearer session", async () => {
      state.onlyUsers = true; assert.equal((await send({ headers: { Authorization: "Bearer " + userToken } })).status, 201);
      assert.ok(calls.some(c => c.table === "users" && c.filters.user_id === claims.user_id));
    });
    await scenario("real optionalAuth accepts matching cookie session", async () => {
      state.onlyUsers = true; assert.equal((await send({ headers: { Cookie: "snapup_session=" + userToken } })).status, 201);
    });
    await scenario("registered user guest ownership mismatch rejected", async () => {
      state.onlyUsers = true; state.userId = "other-synthetic-user";
      failure(await send({ headers: { Authorization: "Bearer " + userToken } }), 403, "REGISTERED_USER_SESSION_MISMATCH"); assert.equal(writes.length, 0);
    });
    for (const field of ["event_id", "guest_id", "message"]) {
      await scenario("required " + field + " validation", async () => {
        const body = { event_id: claims.event_id, guest_id: claims.guest_id, message: "hello" }; delete body[field];
        const res = await send({ body }); assert.equal(res.status, 400);
        assert.deepEqual(res.body, { success: false, message: field + " is required." }); assert.equal(writes.length, 0);
      });
    }
    await scenario("real cleanText rejects oversized message", async () => {
      failure(await send({ body: { event_id: claims.event_id, guest_id: claims.guest_id, message: "x".repeat(2001) } }), 400, "INVALID_INPUT"); assert.equal(writes.length, 0);
    });
    await scenario("closed event rejects message", async () => {
      state.active = false; const res = await send(); assert.equal(res.status, 403); assert.equal(writes.length, 0);
    });
    await scenario("disabled uploads reject message", async () => {
      state.allow = false; const res = await send(); assert.equal(res.status, 403); assert.equal(writes.length, 0);
    });
    await scenario("production response wrapper removes error and adds request_id to 500", async () => {
      process.env.NODE_ENV = "production";
      try {
        state.dbError = { message: "PRIVATE_DATABASE_ERROR" };
        const res = await send(); assert.equal(res.status, 500);
        assert.deepEqual(Object.keys(res.body).sort(), ["code", "message", "request_id", "success"]);
        assert.equal(res.body.request_id, res.headers["x-request-id"]); assert.doesNotMatch(JSON.stringify(res.body), /PRIVATE_/);
      } finally { process.env.NODE_ENV = "test"; }
    });
    await scenario("real uploadLimiter blocks request 13 before INSERT", async () => {
      for (let i = 0; i < 12; i++) assert.equal((await send()).status, 201);
      const res = await send(); assert.equal(res.status, 429); assert.equal(res.body.code, "RATE_LIMITED");
      assert.ok(Number(res.headers["retry-after"]) > 0); assert.equal(writes.length, 12);
    });
  } finally {
    Module._load = originalLoad;
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    for (const key of Object.keys(require.cache)) if (!originalCache.has(key)) delete require.cache[key];
    for (const [key, value] of Object.entries(savedEnv)) value === undefined ? delete process.env[key] : process.env[key] = value;
    await fs.rm(root, { recursive: true, force: true });
  }
});
