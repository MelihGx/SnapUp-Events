"use strict";

// No dotenv, live database, R2 client or application startup is loaded here.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const jwt = require("jsonwebtoken");
const express = require("express");
const sharp = require("sharp");
const { runBoundedMultipart, createUploadAuthorization } = require("../middlewares/uploadSecurity");

test("PATCH 1 isolated HTTP integration", { timeout: 120000 }, async (t) => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "snapup-patch1-test-"));
  const uploadDir = path.join(temporaryRoot, "snapup-media-uploads");
  const secret = "isolated-patch1-test-secret";
  const claims = { type: "guest", event_id: "event-1", guest_id: "guest-1", user_id: "user-1" };
  const token = jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: "1h", issuer: "snapup-events", audience: "snapup-guest" });
  const expired = jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: -1, issuer: "snapup-events", audience: "snapup-guest" });
  const crypto = require("node:crypto");
  const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
  let active = true, allowUpload = true, onlyUsers = false, currentUser = null, revoked = false;
  let acceptedToken = token, requireApproval = true, workerWakes = 0;
  let writes = [], storageCalls = 0;
  const db = {
    from(table) {
      let inserted;
      const query = {
        select() { return query; }, eq() { return query; }, in() { return query; },
        insert(rows) { inserted = rows; writes.push({ table, rows }); return query; },
        delete() { return query; },
        maybeSingle() { return Promise.resolve(result()); },
        single() { return Promise.resolve(result()); },
        then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
      };
      function result() {
        if (inserted) return { data: inserted.map((row, i) => ({ ...row, media_id: `media-${i}`, job_id: `job-${i}` })) };
        if (table === "event") return { data: { event_id: "event-1", is_event_active: active, package_key: "premium", storage_consumed_bytes: 0 } };
        if (table === "event_settings") return { data: { allow_upload: allowUpload, require_approval: requireApproval, max_upload_per_guest: null, max_storage_per_guest: 2048, only_users: onlyUsers } };
        if (table === "event_guests") return { data: { ...claims, user_id: "user-1", guest_access_token_hash: revoked ? "revoked" : hash(acceptedToken) } };
        if (table === "media_type") return { data: { media_type_id: "type-1" } };
        return { data: [], count: 0 };
      }
      return query;
    },
    async rpc() { return { data: 0 }; },
  };
  const noop = (_req, _res, next) => next();
  const mocks = {
    "../config/supabaseClient": db,
    "../config/cloudinary": {},
    "../middlewares/authMiddleware": noop,
    "../middlewares/optionalAuth": (req, _res, next) => { req.user = currentUser; next(); },
    "../middlewares/security": { guestLimiter: noop, uploadLimiter: noop, likeLimiter: noop },
    "../middlewares/turnstile": { verifyTurnstile: () => noop },
    "../services/guestAccessService": { hashGuestToken: hash, verifyGuestToken: (value) => jwt.verify(value, secret, { algorithms: ["HS256"], issuer: "snapup-events", audience: "snapup-guest" }) },
    "../services/r2MediaService": {
      async deleteMediaAssets() {},
      async uploadImagePair(file) { storageCalls++; return { originalBytes: file.size, displayUrl: "https://example.invalid/image.webp", originalKey: "original", displayKey: "display" }; },
      async uploadVideoOriginal(file) { storageCalls++; return { originalBytes: file.size, originalKey: "video", displayKey: "display", posterKey: "poster", originalContentType: "video/mp4" }; },
    },
    "../services/videoProcessingService": { async probeVideoFile() { return { duration: 1, width: 16, height: 16 }; }, validateVideoMetadata: (value) => value },
    "../services/videoProcessingQueueService": { wakeVideoProcessingWorker() { workerWakes++; } },
    // PATCH 1 regression isolates admission; PATCH 2 has separate real-service tests.
    "../services/uploadAdmissionService": { createUploadAdmissionService: () => ({
      async acquire() { return { assertValid() {}, async release() {} }; },
    }) },
    os: { ...os, tmpdir: () => temporaryRoot },
  };
  const originalLoad = Module._load;
  let router;
  try {
    Module._load = function (request, parent, isMain) {
      if (parent?.filename === require.resolve("../routes/mediaRoutes") && Object.hasOwn(mocks, request)) return mocks[request];
      return originalLoad.call(this, request, parent, isMain);
    };
    router = require("../routes/mediaRoutes");
  } finally { Module._load = originalLoad; }
  const app = express();
  app.use("/api/media", router);
  // Small wire limit exercises the exact same stream helper without large IO.
  const multer = require("multer");
  const smallParser = multer({ dest: uploadDir }).any();
  app.post("/bounded", (req, res, next) => runBoundedMultipart(req, res, smallParser, 1024, async (error) => {
    await Promise.all((req.files || []).map((file) => fs.unlink(file.path).catch(() => {})));
    if (error) return next(error);
    res.json({ success: true });
  }));
  app.use((error, _req, res, _next) => res.status(error.statusCode || 400).json({ code: error.code || "BAD_UPLOAD" }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const boundary = "patch1-boundary";
  function multipart(files, event = "event-1", guest = "guest-1") {
    const parts = [];
    for (const file of files) parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${file.name || "file"}"\r\nContent-Type: ${file.type}\r\n\r\n`), file.bytes, Buffer.from("\r\n"));
    for (const [name, value] of [["event_id", event], ["guest_id", guest]]) parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    return Buffer.concat(parts);
  }
  function send(body, { auth = token, chunked = false, url = "/api/media/upload", chunkSize = 64 * 1024, delayMs = 0 } = {}) {
    return new Promise((resolve, reject) => {
      const headers = { "Content-Type": `multipart/form-data; boundary=${boundary}`, "X-Guest-Token": auth };
      if (!chunked) headers["Content-Length"] = body.length;
      let responding = false;
      let pumpTimer;
      const request = http.request({ host: "127.0.0.1", port, path: url, method: "POST", headers }, (response) => {
        responding = true;
        clearTimeout(pumpTimer);
        let text = "";
        response.on("data", (chunk) => { text += chunk; });
        response.on("end", () => resolve({ status: response.statusCode, body: JSON.parse(text) }));
        response.on("error", reject);
      });
      request.on("error", (error) => { clearTimeout(pumpTimer); if (!responding) reject(error); });
      if (chunked) {
        let offset = 0;
        function pump() {
          if (responding || request.destroyed) return;
          while (offset < body.length) {
            const end = Math.min(offset + chunkSize, body.length);
            const ready = request.write(body.subarray(offset, end));
            offset = end;
            const later = () => { pumpTimer = setTimeout(pump, delayMs); };
            if (!ready) { request.once("drain", delayMs ? later : pump); return; }
            if (delayMs) { later(); return; }
          }
          request.end();
        }
        pump();
      }
      else request.end(body);
    });
  }
  async function clean() {
    // Disk-stream close/unlink callbacks can finish after an aborted socket.
    for (let i = 0; i < 50; i++) {
      if ((await fs.readdir(uploadDir)).length === 0) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.deepEqual(await fs.readdir(uploadDir), []);
  }
  const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
  const photo = { type: "image/png", bytes: png };
  const video = { type: "video/mp4", bytes: Buffer.from("00000018667479706d703432000000006d70343269736f6d", "hex") };
  try {
    await t.test("valid photo returns 201 and preserves pending moderation", async () => {
      const result = await send(multipart([photo]));
      assert.equal(result.status, 201);
      assert.equal(result.body.media[0].media_status, "pending");
      await clean();
    });
    await t.test("valid chunked video returns 202 and queues pending moderation", async () => {
      const result = await send(multipart([video]), { chunked: true });
      assert.equal(result.status, 202);
      assert.equal(writes.find((write) => write.table === "video_processing_jobs").rows[0].target_media_status, "pending");
      assert.equal(writes.find((write) => write.table === "video_processing_jobs").rows[0].status, "queued");
      assert.equal(workerWakes, 1);
      await clean();
    });
    await t.test("anonymous QR-style guest and signed-in event owner both accepted", async () => {
      acceptedToken = jwt.sign({ ...claims, user_id: null }, secret, { algorithm: "HS256", expiresIn: "1h", issuer: "snapup-events", audience: "snapup-guest" });
      try { assert.equal((await send(multipart([photo]), { auth: acceptedToken })).status, 201); }
      finally { acceptedToken = token; }
      onlyUsers = true;
      currentUser = { user_id: "user-1", user_role: "user" };
      try { assert.equal((await send(multipart([photo]))).status, 201); }
      finally { onlyUsers = false; currentUser = null; }
      await clean();
    });
    await t.test("disabled moderation preserves approved photo and video target status", async () => {
      requireApproval = false;
      try {
        assert.equal((await send(multipart([photo]))).body.media[0].media_status, "approved");
        assert.equal((await send(multipart([video]))).status, 202);
        assert.equal(writes.filter((write) => write.table === "video_processing_jobs").at(-1).rows[0].target_media_status, "approved");
      } finally { requireApproval = true; }
      await clean();
    });
    for (const [name, auth] of [["invalid", "bad"], ["expired", expired], ["missing", ""]]) {
      await t.test(`${name} token rejected before parsing invalid multipart`, async () => {
        const count = storageCalls;
        assert.equal((await send(Buffer.from("not multipart"), { auth })).status, 401);
        assert.equal(storageCalls, count);
        await clean();
      });
    }
    await t.test("revoked token rejected", async () => {
      revoked = true;
      try { assert.equal((await send(multipart([photo]))).status, 401); } finally { revoked = false; }
      await clean();
    });
    await t.test("closed event and disabled uploads rejected before parsing", async () => {
      active = false;
      try { assert.equal((await send(Buffer.from("invalid"))).status, 403); } finally { active = true; }
      allowUpload = false;
      try { assert.equal((await send(Buffer.from("invalid"))).status, 403); } finally { allowUpload = true; }
      await clean();
    });
    await t.test("registered-user restriction preserved", async () => {
      onlyUsers = true;
      try {
        assert.equal((await send(multipart([photo]))).status, 401);
        currentUser = { user_id: "other-user" };
        assert.equal((await send(multipart([photo]))).status, 403);
        currentUser = { user_id: "user-1" };
        assert.equal((await send(multipart([photo]))).status, 201);
      } finally { onlyUsers = false; currentUser = null; }
      await clean();
    });
    await t.test("body guest/event mismatch rejected and files cleaned", async () => {
      for (const ids of [["event-1", "other"], ["other", "guest-1"]]) {
        assert.equal((await send(multipart([photo], ...ids))).status, 403);
        await clean();
      }
    });
    await t.test("invalid signature cleaned", async () => {
      assert.equal((await send(multipart([{ type: "image/png", bytes: Buffer.from("invalid") }]))).status, 400);
      await clean();
    });
    await t.test("16 files rejected and cleaned", async () => {
      assert.equal((await send(multipart(Array(16).fill(photo)))).status, 400);
      await clean();
    });
    await t.test("15 valid photos remain accepted", async () => {
      const result = await send(multipart(Array(15).fill(photo)));
      assert.equal(result.status, 201);
      assert.equal(result.body.uploaded_count, 15);
      await clean();
    });
    await t.test("exact 50 MiB files and 200 MiB total remain accepted", async () => {
      const bytes = Buffer.alloc(50 * 1024 * 1024);
      png.copy(bytes);
      const result = await send(multipart(Array(4).fill({ type: "image/png", bytes })), { chunked: true });
      assert.equal(result.status, 201);
      assert.equal(result.body.uploaded_count, 4);
      await clean();
    });
    await t.test("actual 50 MiB per-file limit rejects excess and cleans", async () => {
      const result = await send(multipart([{ type: "image/jpeg", bytes: Buffer.alloc(50 * 1024 * 1024 + 1) }]), { chunked: true });
      assert.equal(result.status, 413);
      await clean();
    });
    await t.test("200 MiB across 15 files with long UTF-8 filenames fits multipart allowance", async () => {
      const small = Buffer.alloc(13 * 1024 * 1024);
      const large = Buffer.alloc(18 * 1024 * 1024);
      png.copy(small); png.copy(large);
      const name = "düğün-anıları-".repeat(15) + ".png";
      const body = multipart([...Array(14).fill({ type: "image/png", bytes: small, name }), { type: "image/png", bytes: large, name }]);
      const overhead = body.length - 200 * 1024 * 1024;
      assert.ok(overhead < 1024 * 1024);
      assert.equal((await send(body, { chunked: true })).status, 201);
      t.diagnostic(`200 MiB / 15 files / long UTF-8 filenames: ${overhead} bytes multipart overhead.`);
      await clean();
    });
    await t.test("actual 200 MiB total file limit rejects excess and cleans", async () => {
      const file = { type: "image/jpeg", bytes: Buffer.alloc(40 * 1024 * 1024 + 1) };
      const result = await send(multipart(Array(5).fill(file)), { chunked: true });
      assert.equal(result.status, 413);
      assert.equal(result.body.code, "MEDIA_REQUEST_TOO_LARGE");
      await clean();
    });
    await t.test("actual 201 MiB HTTP limit rejects chunked overflow during transfer", async () => {
      const file = { type: "image/jpeg", bytes: Buffer.alloc(41 * 1024 * 1024) };
      const result = await send(multipart(Array(5).fill(file)), { chunked: true });
      assert.equal(result.status, 413);
      assert.equal(result.body.code, "MEDIA_REQUEST_TOO_LARGE");
      await clean();
    });
    await t.test("chunked HTTP wire limit stops parser and cleans partial file", async () => {
      const result = await send(multipart([{ type: "image/jpeg", bytes: Buffer.alloc(2048) }]), { chunked: true, url: "/bounded" });
      assert.equal(result.status, 413);
      assert.equal(result.body.code, "MEDIA_REQUEST_TOO_LARGE");
      await clean();
    });
    await t.test("malformed multipart cleans partial disk file", async () => {
      const body = multipart([photo]);
      assert.equal((await send(body.subarray(0, body.length - 30))).status, 400);
      await clean();
    });
    await t.test("slow valid transfer lasting longer than 250 ms is accepted", async () => {
      const bytes = Buffer.alloc(32 * 1024);
      png.copy(bytes);
      const start = performance.now();
      const result = await send(multipart([{ type: "image/png", bytes }]), { chunked: true, chunkSize: 1024, delayMs: 20 });
      assert.equal(result.status, 201);
      assert.ok(performance.now() - start > 250);
      await clean();
    });
    await t.test("slow oversized transfer receives 413 after bounded grace", async () => {
      const start = performance.now();
      const result = await send(multipart([{ type: "image/png", bytes: Buffer.alloc(8192) }]), { chunked: true, url: "/bounded", chunkSize: 256, delayMs: 80 });
      const elapsed = performance.now() - start;
      assert.equal(result.status, 413);
      assert.ok(elapsed < 2000, `bounded failure took ${elapsed} ms`);
      t.diagnostic(`Slow overflow response: ${elapsed.toFixed(1)} ms (includes paced input before limit).`);
      await clean();
    });
    await t.test("large valid transfer with paced chunks remains accepted", async () => {
      const bytes = Buffer.alloc(50 * 1024 * 1024);
      png.copy(bytes);
      assert.equal((await send(multipart([{ type: "image/png", bytes }]), { chunked: true, chunkSize: 512 * 1024, delayMs: 5 })).status, 201);
      await clean();
    });
    await t.test("disconnect during file transfer cleans partial disk file", async () => {
      await new Promise((resolve) => {
        const request = http.request({ host: "127.0.0.1", port, path: "/api/media/upload", method: "POST", headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "X-Guest-Token": token } });
        request.on("error", () => {});
        request.write(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="file"\r\nContent-Type: image/jpeg\r\n\r\n`));
        request.write(Buffer.alloc(64 * 1024));
        setTimeout(() => { request.destroy(); resolve(); }, 100);
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      await clean();
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    assert.equal(path.dirname(temporaryRoot), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temporaryRoot).startsWith("snapup-patch1-test-"));
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("pre-upload authorization latency model (no external services)", async (t) => {
  for (const queryMs of [0, 10, 30]) {
    let queries = 0;
    const query = async () => {
      queries++;
      if (queryMs) await new Promise((resolve) => setTimeout(resolve, queryMs));
    };
    const authorize = createUploadAuthorization({
      verifyGuestToken: () => ({ type: "guest", event_id: "event", guest_id: "guest" }),
      hashGuestToken: () => "hash",
      async getGuestSecurity() { await query(); return { guest_access_token_hash: "hash" }; },
      async getUploadStatusForEvent() { await query(); await query(); return { onlyUsers: false }; },
      assertRegisteredUserAccess() {},
    });
    const samples = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await new Promise((resolve, reject) => authorize({ get: () => "token" }, {}, (error) => error ? reject(error) : resolve()));
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    assert.equal(queries, 30);
    t.diagnostic(`3 sequential queries, injected ${queryMs} ms/query; n=10; median=${samples[5].toFixed(2)} ms; p95=${samples[9].toFixed(2)} ms. Synthetic, not Supabase latency.`);
  }
});
