"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { createUploadAdmissionService } = require("../services/uploadAdmissionService");
const { withUploadAdmission } = require("../middlewares/uploadAdmission");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const identity = { eventId: "event", guestId: "guest" };

test("invalid local capacity fails closed without RPC", async () => {
  const service = createUploadAdmissionService({ localLimit: 0, supabase: { rpc() { throw new Error("must not run"); } } });
  await assert.rejects(service.acquire(identity), { code: "UPLOAD_ADMISSION_UNCONFIGURED" });
  assert.equal(service.active, 0);
});

test("hung acquisition is bounded, attempts cleanup and frees local capacity", async () => {
  const calls = [];
  const service = createUploadAdmissionService({ localLimit: 1, rpcTimeoutMs: 20, log() {}, supabase: {
    rpc(name) {
      calls.push(name);
      return name === "acquire_upload_admission" ? new Promise(() => {}) : Promise.resolve({ data: true });
    },
  } });
  const pending = service.acquire(identity);
  await assert.rejects(service.acquire(identity), { code: "UPLOAD_CONCURRENCY_LIMIT", scope: "server" });
  await assert.rejects(pending, { code: "UPLOAD_ADMISSION_UNAVAILABLE" });
  assert.deepEqual(calls, ["acquire_upload_admission", "release_upload_admission"]);
  assert.equal(service.active, 0);
});

test("late heartbeat cannot resurrect an expired local deadline", async () => {
  let mono = 0, lost = 0;
  const service = createUploadAdmissionService({ localLimit: 1, rpcTimeoutMs: 20, now: () => mono, log() {}, supabase: {
    async rpc(name) {
      if (name === "renew_upload_admission") { mono = 10000; return { data: { renewed: true, lease_seconds: 0.15 } }; }
      return { data: name === "acquire_upload_admission" ? { acquired: true, lease_seconds: 0.15 } : true };
    },
  } });
  const lease = await service.acquire(identity, () => { lost++; });
  await wait(85);
  assert.throws(() => lease.assertValid(), { code: "UPLOAD_ADMISSION_LOST" });
  assert.equal(lost, 1);
  await Promise.all([lease.release(), lease.release()]);
  assert.equal(service.active, 0);
});

test("disconnect during acquisition or ongoing work releases only after settlement", async () => {
  let releaseCount = 0, finishWork;
  const req = new EventEmitter();
  req.uploadIdentity = identity;
  const res = new EventEmitter();
  res.destroyed = false;
  const service = {
    async acquire() { return { assertValid() {}, async release() { releaseCount++; } }; },
  };
  const run = withUploadAdmission(service, [async () => new Promise((resolve) => { finishWork = resolve; })], async () => {});
  const result = run(req, res, () => assert.fail("unexpected error"));
  await wait(0);
  res.destroyed = true; res.emit("close");
  assert.equal(releaseCount, 0);
  finishWork(); await result;
  assert.equal(releaseCount, 1);

  let grant;
  releaseCount = 0;
  const delayedService = { acquire: () => new Promise((resolve) => { grant = resolve; }) };
  const earlyRes = new EventEmitter();
  const earlyReq = { uploadIdentity: identity };
  const waiting = withUploadAdmission(delayedService, [async () => assert.fail("disconnected request must not run")], async () => {})(earlyReq, earlyRes, () => {});
  earlyRes.destroyed = true; earlyRes.emit("close");
  grant({ assertValid() {}, async release() { releaseCount++; } });
  await waiting;
  assert.equal(releaseCount, 1);
});

test("cleanup completes before a permit is released, even on handler error", async () => {
  const events = [];
  const res = new EventEmitter();
  const service = { async acquire() { return { assertValid() {}, async release() { events.push("release"); } }; } };
  await withUploadAdmission(service, [async () => { throw new Error("failed work"); }], async () => {
    await wait(5); events.push("cleanup");
  })({ uploadIdentity: identity }, res, () => events.push("error"));
  assert.deepEqual(events, ["error", "cleanup", "release"]);
});
