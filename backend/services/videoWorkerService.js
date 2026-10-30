"use strict";
const crypto = require("node:crypto");
const { performance } = require("node:perf_hooks");

function createVideoWorker({ supabase, processVideo, getVideoMediaTypeId, leaseSeconds = 90,
  heartbeatMs = leaseSeconds * 1000 / 3, rpcTimeoutMs = 5000, now = () => performance.now(),
  log = (event) => console.error(JSON.stringify(event)) }) {
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 30 || leaseSeconds > 600 ||
      heartbeatMs <= 0 || heartbeatMs >= (leaseSeconds * 1000 - rpcTimeoutMs) / 2) throw new Error("Invalid video worker lease configuration");
  let stopped = false, running = null, active = null;
  async function rpc(name, args) {
    const controller = new AbortController();
    let timer;
    try {
      const operation = supabase.rpc(name, args);
      const request = typeof operation.abortSignal === "function" ? operation.abortSignal(controller.signal) : operation;
      const result = await Promise.race([request, new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error("Video RPC deadline exceeded")); }, rpcTimeoutMs);
      })]);
      if (result.error) throw Object.assign(new Error("Video worker database operation failed"), { code: result.error.code || "VIDEO_DB_UNAVAILABLE" });
      return result.data;
    } finally { clearTimeout(timer); }
  }
  async function processOne() {
    if (stopped) return false;
    const start = now();
    const job = await rpc("claim_video_job", { p_owner: crypto.randomUUID(), p_lease_seconds: leaseSeconds });
    if (!job) return false;
    const ownership = { p_job: job.job_id, p_owner: job.worker_owner, p_generation: job.worker_generation };
    if (!ownership.p_owner || !Number.isSafeInteger(ownership.p_generation) || ownership.p_generation < 1) throw new Error("Invalid worker ownership response");
    const controller = new AbortController();
    let deadline = start + Number(job.lease_seconds) * 1000 - rpcTimeoutMs;
    let lost = false, finished = false, heartbeat, watchdog, renewal;
    const lose = () => { lost = true; clearTimeout(heartbeat); controller.abort(); };
    const assertValid = () => {
      if (stopped || lost || finished || !Number.isFinite(deadline) || now() >= deadline) { lose(); throw Object.assign(new Error("Video ownership lost"), { code: "VIDEO_OWNERSHIP_LOST" }); }
    };
    function watch() { clearTimeout(watchdog); watchdog = setTimeout(lose, Math.max(1, deadline - now())); watchdog.unref?.(); }
    async function renew() {
      const began = now();
      try {
        const result = await rpc("renew_video_job", { ...ownership, p_lease_seconds: leaseSeconds });
        assertValid(); // A late renewal cannot resurrect the previous local deadline.
        if (!result?.renewed) throw new Error("Video lease lost");
        deadline = began + Number(result.lease_seconds) * 1000 - rpcTimeoutMs;
        if (!Number.isFinite(deadline) || now() >= deadline) throw new Error("Invalid video lease deadline");
        watch(); schedule();
      } catch (_) { lose(); }
    }
    function schedule() { heartbeat = setTimeout(() => { renewal = renew(); }, heartbeatMs); heartbeat.unref?.(); }
    active = { abort: lose };
    try {
      assertValid(); watch(); schedule();
      const derivatives = await processVideo({ eventId: job.event_id, originalKey: job.original_key,
        displayKey: job.worker_display_key, posterKey: job.worker_poster_key,
        originalContentType: job.original_mime_type, preserveOnError: true, assertValid, signal: controller.signal });
      assertValid();
      const type = await getVideoMediaTypeId();
      assertValid();
      const media = { media_id: job.job_id, event_id: job.event_id, guest_id: job.guest_id, media_type_id: type,
        media_url: derivatives.displayUrl, media_status: job.target_media_status, bytes: Number(job.original_bytes),
        storage_provider: "r2", r2_original_key: job.original_key, r2_display_key: job.worker_display_key,
        r2_poster_key: job.worker_poster_key, display_bytes: Number(derivatives.displayBytes) || 0,
        display_mime_type: derivatives.displayContentType || "video/mp4", video_duration_seconds: derivatives.durationSeconds,
        video_width: derivatives.originalWidth, video_height: derivatives.originalHeight };
      const result = await rpc("publish_video_job", { ...ownership, p_media: media });
      if (result?.state !== "committed") throw new Error("Video publication outcome uncertain");
    } catch (error) {
      // Never infer rollback from a failed REST response. The attempt manifest is
      // already durable before R2 starts. No worker path performs an R2 DELETE.
      try {
        const outcome = await rpc("video_job_outcome", ownership);
        if (outcome?.state === "committed") return true;
        if (outcome?.state === "owned" && !stopped && !lost && now() < deadline) {
          await rpc("fail_video_job", { ...ownership, p_code: error.code || "VIDEO_PROCESS_FAILED" });
        }
      } catch (_) { /* Keep persistent processing/attempt rows for expiry/recovery. */ }
      log({ event: "video_attempt_deferred_or_failed", job_id: job.job_id, generation: job.worker_generation, code: error.code || "VIDEO_PROCESS_FAILED" });
    } finally {
      finished = true; clearTimeout(heartbeat); clearTimeout(watchdog); controller.abort();
      await renewal; active = null;
    }
    return true;
  }
  function runOnce() {
    if (running) return running;
    running = processOne().finally(() => { running = null; });
    return running;
  }
  return {
    runOnce,
    async drain() { while (!stopped && await runOnce()) { /* serial work per process */ } },
    async stop({ timeoutMs = 10000 } = {}) {
      stopped = true; active?.abort();
      if (!running) return;
      let timer;
      try { await Promise.race([running.catch(() => {}), new Promise((resolve) => { timer = setTimeout(resolve, timeoutMs); })]); }
      finally { clearTimeout(timer); }
      // An uninterruptible FFmpeg call can finish late, but cannot publish or
      // touch another attempt's keys. Its database lease expires naturally.
    },
  };
}
module.exports = { createVideoWorker };
