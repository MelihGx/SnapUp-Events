"use strict";

const assert = require("node:assert/strict");
const Module = require("node:module");
const crypto = require("node:crypto");
const os = require("node:os");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const express = require("express");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const { createUploadAdmissionService } = require("../../services/uploadAdmissionService");
const { runUploadQuotaCleanup } = require("../../scripts/uploadQuotaCleanup");

module.exports = async function routeScenarios({ t, sql, call, reset, root, event, guest }) {
  const secret = "isolated-patch3-secret";
  const token = jwt.sign({ type: "guest", event_id: event, guest_id: guest }, secret, { expiresIn: "1h" });
  const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
  let failR2 = false, failFinalize = false, loseReply = false, onR2Start;
  const bucket = new Map();
  const db = {
    rpc(name, args) {
      return { async abortSignal() {
        if (name === "finalize_upload_quota" && failFinalize) return { error: { message: "injected DB failure" } };
        const data = await call(name, args);
        if (name === "finalize_upload_quota" && loseReply) return { error: { message: "lost committed reply" } };
        return { data };
      } };
    },
    from(table) {
      const filters = {};
      let column, keys;
      const query = { select() { return query; }, eq(key, value) { filters[key] = value; return query; },
        in(key, values) { column = key; keys = values; return query; }, limit() { return query; },
        async maybeSingle() { return { data: (await result())[0] || null }; },
        async single() { return { data: (await result())[0] || null }; },
        then(resolve, reject) { return result().then((data) => ({ data })).then(resolve, reject); },
      };
      async function result() {
        if (table === "media_type") return [{ media_type_id: filters.media_type === "video" ? 2 : 1 }];
        const allowed = new Set(["event", "event_settings", "event_guests", "media", "video_processing_jobs"]);
        if (!allowed.has(table)) throw new Error("Unexpected test table");
        const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
        const where = Object.entries(filters).map(([key, value]) => `${key}=${quote(value)}`);
        if (column) where.push(`${column} in (${keys.map(quote).join(",")})`);
        const rows = JSON.parse(await sql(`select coalesce(json_agg(t),'[]')::text from (select * from public.${table}${where.length ? " where " + where.join(" and ") : ""}) t`));
        return table === "event_guests" ? rows.map((row) => ({ ...row, guest_access_token_hash: hash(token) })) : rows;
      }
      return query;
    },
  };
  const noop = (_req, _res, next) => next();
  async function put(file, eventId, options, video = false) {
    const prefix = `events/${eventId}/media/${options.assetId}`;
    const originalKey = `${prefix}/original.${video ? "mp4" : "png"}`;
    const displayKey = `${prefix}/display.${video ? "mp4" : "webp"}`;
    bucket.set(originalKey, true);
    if (onR2Start) await onR2Start();
    if (failR2) throw new Error("injected R2 interruption");
    if (!video) bucket.set(displayKey, true);
    return { originalKey, displayKey, posterKey: video ? `${prefix}/poster.webp` : null,
      originalBytes: file.size, displayBytes: 5, originalContentType: file.mimetype, displayContentType: "image/webp", displayUrl: `https://example.invalid/${displayKey}` };
  }
  const mocks = {
    "../config/supabaseClient": db, "../config/cloudinary": {},
    "../middlewares/authMiddleware": noop, "../middlewares/optionalAuth": noop,
    "../middlewares/security": { guestLimiter: noop, uploadLimiter: noop, likeLimiter: noop },
    "../middlewares/turnstile": { verifyTurnstile: () => noop },
    "../services/guestAccessService": { hashGuestToken: hash, verifyGuestToken: (value) => jwt.verify(value, secret) },
    "../services/uploadAdmissionService": { createUploadAdmissionService: () => createUploadAdmissionService({ supabase: db, localLimit: 3 }) },
    "../services/r2MediaService": { uploadImagePair: put, uploadVideoOriginal: (file, eventId, options) => put(file, eventId, options, true),
      async deleteMediaAssets({ originalKey, displayKey, posterKey }) { [originalKey, displayKey, posterKey].forEach((key) => bucket.delete(key)); } },
    "../services/videoProcessingService": { async probeVideoFile() { return { duration: 1, width: 10, height: 10 }; }, validateVideoMetadata: (value) => value },
    "../services/videoProcessingQueueService": { wakeVideoProcessingWorker() {} },
    os: { ...os, tmpdir: () => root },
  };
  const originalLoad = Module._load;
  let router;
  try {
    Module._load = function (name, parent, isMain) {
      if (parent?.filename === require.resolve("../../routes/mediaRoutes") && Object.hasOwn(mocks, name)) return mocks[name];
      return originalLoad.call(this, name, parent, isMain);
    };
    router = require("../../routes/mediaRoutes");
  } finally { Module._load = originalLoad; }
  const app = express(); app.use("/api/media", router);
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ code: error.code }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
  const mp4 = Buffer.from("00000018667479706d703432000000006d70343269736f6d", "hex");
  async function send({ video = false, key = crypto.randomUUID(), abortAtR2 = false } = {}) {
    const boundary = "quota-route-boundary";
    const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="test"\r\nContent-Type: ${video ? "video/mp4" : "image/png"}\r\n\r\n`), video ? mp4 : png,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="event_id"\r\n\r\n${event}\r\n--${boundary}\r\nContent-Disposition: form-data; name="guest_id"\r\n\r\n${guest}\r\n--${boundary}--\r\n`)]);
    return new Promise((resolve, reject) => {
      const request = http.request({ host: "127.0.0.1", port: server.address().port, path: "/api/media/upload", method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length,
          "X-Guest-Token": token, "Idempotency-Key": key } }, (response) => {
        let text = ""; response.on("data", (chunk) => { text += chunk; });
        response.on("end", () => resolve({ status: response.statusCode, body: JSON.parse(text) }));
      });
      request.on("error", (error) => abortAtR2 ? resolve({ aborted: true }) : reject(error));
      if (abortAtR2) onR2Start = async () => {
        request.destroy();
        await new Promise((resolve) => setTimeout(resolve, 80));
      };
      request.end(body);
    });
  }
  async function settle() {
    for (let i = 0; i < 100; i++) {
      if (await sql("select count(*) from public.upload_admission_leases") === "0") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.deepEqual(await fs.readdir(path.join(root, "snapup-media-uploads")), []);
  }
  try {
    await t.test("PATCH 3 actual upload route + PG + fake R2 preserves 201/202 and committed replay", async () => {
      await reset(); bucket.clear();
      const key = crypto.randomUUID();
      const photo = await send({ key }); assert.equal(photo.status, 201);
      await settle();
      const replay = await send({ key }); assert.equal(replay.status, 201);
      assert.deepEqual(replay.body, photo.body); await settle();
      assert.equal(bucket.size, 2);
      const video = await send({ video: true }); assert.equal(video.status, 202); await settle();
      assert.equal(video.body.video_jobs[0].status, "queued");
      assert.equal(Number(await sql("select storage_consumed_bytes from public.event")), png.length + mp4.length);
    });
    await t.test("PATCH 3 actual route R2 and finalize errors release reservations and remove fake objects", async () => {
      await reset(); bucket.clear(); failR2 = true;
      assert.equal((await send()).status, 500); await settle(); failR2 = false;
      assert.equal(bucket.size, 0);
      failFinalize = true;
      assert.equal((await send()).status, 503); await settle(); failFinalize = false;
      assert.equal(bucket.size, 0);
      assert.equal(await sql("select storage_consumed_bytes from public.event"), "0");
      assert.equal(await sql("select count(*) from public.media"), "0");
      assert.equal(await sql("select count(*) from public.upload_quota_reservations where state='reserved'"), "0");
    });
    await t.test("PATCH 3 actual route lost finalize reply returns committed success without R2 deletion", async () => {
      await reset(); bucket.clear(); loseReply = true;
      try { assert.equal((await send()).status, 201); await settle(); }
      finally { loseReply = false; }
      assert.equal(bucket.size, 2);
      assert.equal(await sql("select count(*) from public.media"), "1");
    });
    await t.test("PATCH 3 disconnect after reservation and during fake R2 cancels without consumption", async () => {
      await reset(); bucket.clear();
      try { assert.equal((await send({ abortAtR2: true })).aborted, true); await settle(); }
      finally { onR2Start = null; }
      assert.equal(bucket.size, 0);
      assert.equal(await sql("select storage_consumed_bytes from public.event"), "0");
      assert.equal(await sql("select count(*) from public.upload_quota_reservations where state='reserved'"), "0");
    });
    await t.test("PATCH 3 cleanup dry run never deletes and apply preserves committed assets", async () => {
      await reset(); bucket.clear(); failR2 = true;
      await send(); await settle(); failR2 = false;
      const cancelled = JSON.parse(await sql("select assets::text from public.upload_quota_reservations"));
      bucket.set(cancelled[0].original_key, true); // simulate a late PUT after cancellation
      const accepted = await send(); await settle(); assert.equal(accepted.status, 201);
      let deletes = 0;
      const deleteAsset = async (asset) => { deletes++; [asset.original_key, asset.display_key, asset.poster_key].forEach((key) => bucket.delete(key)); };
      const cleanupDb = { ...db, async rpc(name, args) { return { data: await call(name, args) }; } };
      await runUploadQuotaCleanup({ supabase: cleanupDb, deleteAsset }); assert.equal(deletes, 0);
      await runUploadQuotaCleanup({ supabase: cleanupDb, deleteAsset, apply: true });
      assert.equal(deletes, 1); assert.equal(bucket.size, 2);
    });
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
};
