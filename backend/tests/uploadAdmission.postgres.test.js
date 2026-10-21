"use strict";

// Opt-in, disposable PostgreSQL cluster. Never reads .env or PGHOST/PGDATABASE.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const http = require("node:http");
const { execFile, fork } = require("node:child_process");
const { promisify } = require("node:util");
const exec = promisify(execFile);
const crypto = require("node:crypto");
const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { createUploadAdmissionService } = require("../services/uploadAdmissionService");
const { withUploadAdmission } = require("../middlewares/uploadAdmission");
const { runBoundedMultipart, createUploadAuthorization, assertUploadIdentity } = require("../middlewares/uploadSecurity");
const { assertRegisteredUserAccess } = require("../services/registeredUserAccessService");
const bin = process.env.PATCH2_PG_BIN;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const event1 = "10000000-0000-0000-0000-000000000001";
const event2 = "10000000-0000-0000-0000-000000000002";
const guest = (n) => `20000000-0000-0000-0000-${String(n).padStart(12, "0")}`;

test("PATCH 2 real PostgreSQL admission and HTTP lifecycle", { skip: !bin, timeout: 120000 }, async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "snapup-patch2-pg-"));
  const dataDir = path.join(root, "data");
  const filesDir = path.join(root, "uploads");
  await fs.mkdir(filesDir);
  const reserve = net.createServer();
  reserve.listen(0, "127.0.0.1");
  await new Promise((resolve) => reserve.once("listening", resolve));
  const port = reserve.address().port;
  await new Promise((resolve) => reserve.close(resolve));
  const exe = (name) => path.join(bin, process.platform === "win32" ? `${name}.exe` : name);
  const user = "patch2_isolated";
  // Ignore ambient libpq service/password/SSL settings; only this cluster is used.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PG/i.test(key)));
  const options = { windowsHide: true, env, timeout: 30000, maxBuffer: 1024 * 1024 };
  async function sql(command) {
    const { stdout } = await exec(exe("psql"), ["-X", "-w", "-h", "127.0.0.1", "-p", String(port), "-U", user, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", command], options);
    return stdout.trim();
  }
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  let started = false, server;
  const held = [];
  let renews = 0;
  function client({ shortTtl = false, failRenew = false, failRelease = false } = {}) {
    return { async rpc(name, args) {
      if (name === "renew_upload_admission") {
        renews++;
        if (failRenew) return { error: { message: "isolated outage" } };
      }
      if (name === "release_upload_admission" && failRelease) return { error: { message: "isolated outage" } };
      const value = await sql(`select public.${name}(${Object.values(args).map(quote).join(",")})::text`);
      const result = JSON.parse(value);
      if (shortTtl && result && typeof result === "object" && result.lease_seconds) result.lease_seconds = 3;
      return { data: result };
    } };
  }
  const makeService = (extra = {}) => createUploadAdmissionService({ supabase: client(), localLimit: 6, log() {}, ...extra });
  async function reset(global = 3, event = 2, perGuest = 1) {
    await Promise.all(held.splice(0).map((lease) => lease.release()));
    await sql(`delete from public.upload_admission_leases; update public.upload_admission_policy set global_limit=${global}, event_limit=${event}, guest_limit=${perGuest}`);
  }
  async function take(service, e, g) { const lease = await service.acquire({ eventId: e, guestId: g }); held.push(lease); return lease; }
  async function rejected(promise, scope) { await assert.rejects(promise, (error) => error.statusCode === 429 && error.scope === scope && error.retryAfter > 0); }
  try {
    await exec(exe("initdb"), ["-D", dataDir, "-U", user, "-A", "trust", "--no-locale", "--encoding=UTF8"], options);
    await exec(exe("pg_ctl"), ["-D", dataDir, "-l", path.join(root, "postgres.log"), "-w", "-t", "20", "-o", `-h 127.0.0.1 -p ${port} -c max_connections=60`, "start"], options);
    started = true;
    await sql("create role anon; create role authenticated; create role service_role;");
    const migration = await fs.readFile(path.join(__dirname, "../database/2026-10-21-upload-admission.sql"), "utf8");
    await sql(migration);
    await t.test("unconfigured policy fails closed", async () => {
      await assert.rejects(take(makeService(), event1, guest(1)), { code: "UPLOAD_ADMISSION_UNCONFIGURED" });
    });
    await sql("insert into public.upload_admission_policy values (true,3,2,1,90)");
    await t.test("guest, event, global and per-server caps", async () => {
      const a = makeService(), b = makeService();
      const first = await take(a, event1, guest(1));
      await rejected(take(b, event1, guest(1)), "guest");
      await take(b, event1, guest(2));
      await rejected(take(a, event1, guest(3)), "event");
      await take(a, event2, guest(4));
      await rejected(take(b, event2, guest(5)), "global");
      await first.release(); await first.release();
      assert.equal(await sql("select count(*) from public.upload_admission_leases"), "2");
      await reset();
      const local = makeService({ localLimit: 1 });
      await take(local, event1, guest(1));
      await rejected(take(local, event2, guest(2)), "server");
      assert.equal(local.active, 1);
      await reset();
      assert.equal(local.active, 0);
    });
    await t.test("two independent services compete atomically over separate PG connections", async () => {
      await reset(3,3,1);
      const services = [makeService(), makeService()];
      const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => take(services[i % 2], i % 2 ? event1 : event2, guest(i + 1))));
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
      assert.equal(results.filter((r) => r.status === "rejected").length, 7);
      assert.equal(await sql("select count(*) from public.upload_admission_leases"), "3");
      await reset();
    });
    await t.test("two separate Node processes share the same atomic global cap", async () => {
      await reset(3,3,1);
      const children = [0, 1].map((index) => fork(path.join(__dirname, "fixtures/uploadAdmissionWorker.js"), [JSON.stringify({
        psql: exe("psql"), port, user, eventId: index ? event1 : event2,
        guests: Array.from({ length: 4 }, (_, i) => guest(index * 4 + i + 1)),
      })], { env, windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"] }));
      const exits = children.map((child) => new Promise((resolve, reject) => child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`worker exited ${code}`)))));
      try {
        const results = await Promise.all(children.map((child) => new Promise((resolve, reject) => {
          child.once("message", (message) => message.error ? reject(new Error(message.error)) : resolve(message));
          child.once("error", reject);
        })));
        assert.equal(results.reduce((sum, r) => sum + r.granted, 0), 3);
        assert.equal(results.reduce((sum, r) => sum + r.denied, 0), 5);
        assert.equal(await sql("select count(*) from public.upload_admission_leases"), "3");
        children.forEach((child) => child.send("release"));
        await Promise.all(exits);
        assert.equal(await sql("select count(*) from public.upload_admission_leases"), "0");
      } finally { children.forEach((child) => { if (child.exitCode === null) child.kill(); }); }
      await reset();
    });
    await t.test("ownership, repeat acquisition, repeat release and expiry cannot corrupt counts", async () => {
      const id = crypto.randomUUID(), owner = "a".repeat(64), wrong = "b".repeat(64);
      const acquire = `select public.acquire_upload_admission('${id}','${owner}','${event1}','${guest(1)}')::text`;
      assert.equal(JSON.parse(await sql(acquire)).acquired, true);
      assert.equal(JSON.parse(await sql(acquire)).acquired, true);
      assert.equal(await sql("select count(*) from public.upload_admission_leases"), "1");
      assert.equal(await sql(`select public.release_upload_admission('${id}','${wrong}')`), "f");
      assert.equal(JSON.parse(await sql(`select public.renew_upload_admission('${id}','${wrong}')::text`)).renewed, false);
      await sql(`update public.upload_admission_leases set expires_at=clock_timestamp()-interval '1 second' where lease_id='${id}'`);
      assert.equal(JSON.parse(await sql(`select public.renew_upload_admission('${id}','${owner}')::text`)).renewed, false);
      // A fresh Node service after a simulated process crash reclaims expired rows.
      await take(makeService(), event1, guest(1));
      assert.equal(await sql("select count(*) from public.upload_admission_leases"), "1");
      await reset();
    });
    await t.test("killed Node process leaves a lease that a new instance reclaims only after expiry", async () => {
      const child = fork(path.join(__dirname, "fixtures/uploadAdmissionWorker.js"), [JSON.stringify({
        psql: exe("psql"), port, user, eventId: event1, guests: [guest(1)],
      })], { env, windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"] });
      const exited = new Promise((resolve) => child.once("exit", resolve));
      try {
        const result = await new Promise((resolve, reject) => {
          child.once("message", (message) => message.error ? reject(new Error(message.error)) : resolve(message));
          child.once("error", reject);
        });
        assert.equal(result.granted, 1);
        child.kill(); await exited;
        const restarted = makeService();
        await rejected(take(restarted, event1, guest(1)), "guest");
        // Accelerate the database clock condition instead of sleeping 90 s.
        await sql("update public.upload_admission_leases set expires_at=clock_timestamp()-interval '1 second'");
        await take(restarted, event1, guest(1));
        assert.equal(await sql("select count(*) from public.upload_admission_leases"), "1");
      } finally { if (child.exitCode === null) child.kill(); }
      await reset();
    });
    await t.test("long work renews ownership; late or failed heartbeat stops further work", async () => {
      const service = makeService({ supabase: client({ shortTtl: true }), rpcTimeoutMs: 500 });
      let lost = false;
      const lease = await service.acquire({ eventId: event1, guestId: guest(1) }, () => { lost = true; });
      held.push(lease);
      const before = renews;
      await wait(3400);
      lease.assertValid();
      assert.equal(lost, false);
      assert.ok(renews > before);
      await lease.release();
      assert.equal(service.active, 0);
      const broken = makeService({ supabase: client({ shortTtl: true, failRenew: true }), rpcTimeoutMs: 500 });
      const failed = await broken.acquire({ eventId: event1, guestId: guest(2) }, () => { lost = true; });
      held.push(failed);
      await wait(1400);
      assert.equal(lost, true);
      assert.throws(() => failed.assertValid(), { code: "UPLOAD_ADMISSION_LOST" });
      await reset();
    });
    await t.test("failed release keeps DB lease until expiry but frees local slot", async () => {
      const service = makeService({ supabase: client({ failRelease: true }) });
      const lease = await take(service, event1, guest(1));
      await lease.release();
      assert.equal(service.active, 0);
      assert.equal(await sql("select count(*) from public.upload_admission_leases"), "1");
      await sql("update public.upload_admission_leases set expires_at=clock_timestamp()-interval '1 second'");
      await take(makeService(), event1, guest(1));
      assert.equal(await sql("select count(*) from public.upload_admission_leases"), "1");
      await reset();
    });
    await t.test("RPC functions deny public users", async () => {
      await assert.rejects(sql(`set role anon; select public.acquire_upload_admission('${crypto.randomUUID()}','${"a".repeat(64)}','${event1}','${guest(1)}')`));
      await assert.rejects(sql("set role authenticated; select * from public.upload_admission_leases"));
    });

    const service = makeService({ localLimit: 1 });
    const app = express();
    let handlerDelay = 0, failHandler = false;
    const tokenSecret = "isolated-http-token-secret";
    const claims = { type: "guest", event_id: event1, guest_id: guest(1) };
    const token = jwt.sign(claims, tokenSecret, { expiresIn: "1h" });
    const authorize = createUploadAuthorization({
      verifyGuestToken: (value) => jwt.verify(value, tokenSecret, { algorithms: ["HS256"] }),
      hashGuestToken: (value) => value,
      async getGuestSecurity() { return { guest_access_token_hash: token }; },
      async getUploadStatusForEvent() { return { onlyUsers: false }; },
      assertRegisteredUserAccess,
    });
    const parse = multer({ dest: filesDir }).any();
    const cleanup = async (files) => Promise.all(files.map((file) => fs.unlink(file.path).catch((error) => { if (error.code !== "ENOENT") throw error; })));
    app.post("/upload", authorize, withUploadAdmission(service, [
      (req, res, next) => runBoundedMultipart(req, res, parse, 65536, (error) => {
        if (error) return next(error);
        try { assertUploadIdentity(req); next(); } catch (err) { next(err); }
      }),
      async (req, res) => {
        await wait(handlerDelay);
        req.uploadLease.assertValid();
        if (failHandler) throw new Error("isolated failure");
        res.status(req.query.video ? 202 : 201).json({ success: true });
      },
    ], cleanup));
    app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ code: error.code || "TEST_FAILURE" }));
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const httpPort = server.address().port;
    const boundary = "patch2-boundary";
    const body = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\nfile-bytes\r\n--${boundary}\r\nContent-Disposition: form-data; name="event_id"\r\n\r\n${event1}\r\n--${boundary}\r\nContent-Disposition: form-data; name="guest_id"\r\n\r\n${guest(1)}\r\n--${boundary}--\r\n`);
    function request({ auth = token, video = false, abort = false } = {}) {
      return new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port: httpPort, path: `/upload${video ? "?video=1" : ""}`, method: "POST", headers: { "X-Guest-Token": auth, "Content-Type": `multipart/form-data; boundary=${boundary}` } }, (res) => {
          res.resume(); res.on("end", () => resolve({ status: res.statusCode, retry: res.headers["retry-after"] }));
        });
        req.on("error", (error) => abort ? resolve({ aborted: true }) : reject(error));
        if (abort) { req.write(body.subarray(0, 150)); setTimeout(() => req.destroy(), 100); }
        else req.end(body);
      });
    }
    async function settled() {
      for (let i = 0; i < 100 && service.active; i++) await wait(20);
      assert.equal(service.active, 0);
      assert.equal(await sql("select count(*) from public.upload_admission_leases"), "0");
      assert.deepEqual(await fs.readdir(filesDir), []);
    }
    await t.test("HTTP 201/202, 429 Retry-After, invalid token and cleanup lifecycle", async () => {
      assert.equal((await request()).status, 201); await settled();
      assert.equal((await request({ video: true })).status, 202); await settled();
      assert.equal((await request({ auth: "bad" })).status, 401); await settled();
      handlerDelay = 200;
      const first = request();
      for (let i = 0; i < 100 && !service.active; i++) await wait(5);
      const busy = await request();
      assert.equal(busy.status, 429); assert.ok(Number(busy.retry) > 0);
      assert.equal((await first).status, 201); await settled();
      handlerDelay = 0;
      failHandler = true;
      assert.equal((await request()).status, 500); await settled();
      failHandler = false;
      await request({ abort: true }); await settled();
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
    await Promise.all(held.map((lease) => lease.release()));
    if (started) await exec(exe("pg_ctl"), ["-D", dataDir, "-w", "-t", "20", "-m", "immediate", "stop"], options);
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("snapup-patch2-pg-"));
    await fs.rm(root, { recursive: true, force: true });
  }
});
