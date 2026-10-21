"use strict";

const crypto = require("crypto");
const { performance } = require("perf_hooks");

function admissionError(code, statusCode = 503) {
  return Object.assign(new Error(code === "UPLOAD_CONCURRENCY_LIMIT"
    ? "Too many requests. Please try again later."
    : "Upload failed."), { code, statusCode });
}

function createUploadAdmissionService({ supabase, localLimit = () => Number(process.env.UPLOAD_MAX_ACTIVE),
  rpcTimeoutMs = 5000, now = () => performance.now(), log = (message) => console.error(message) }) {
  let active = 0;
  // A per-process cap bounds resources even if a partitioned/stalled request
  // outlives its distributed lease. It includes pending acquisition RPCs.
  async function rpc(name, args) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), rpcTimeoutMs);
    let deadline;
    try {
      const operation = supabase.rpc(name, args);
      const request = typeof operation.abortSignal === "function" ? operation.abortSignal(controller.signal) : operation;
      const result = await Promise.race([request, new Promise((_, reject) => {
        deadline = setTimeout(() => reject(admissionError("UPLOAD_ADMISSION_UNAVAILABLE")), rpcTimeoutMs);
      })]);
      if (result.error) throw admissionError("UPLOAD_ADMISSION_UNAVAILABLE");
      return result.data;
    } finally { clearTimeout(timer); clearTimeout(deadline); }
  }

  return {
    get active() { return active; },
    async acquire(identity, onLost) {
      const limit = typeof localLimit === "function" ? localLimit() : localLimit;
      if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw admissionError("UPLOAD_ADMISSION_UNCONFIGURED");
      if (active >= limit) throw Object.assign(admissionError("UPLOAD_CONCURRENCY_LIMIT", 429), { retryAfter: 2, scope: "server" });
      active++;
      const leaseId = crypto.randomUUID();
      const ownerHash = crypto.createHash("sha256").update(crypto.randomBytes(32)).digest("hex");
      const ownership = { p_lease_id: leaseId, p_owner_hash: ownerHash };
      let stopped = false, lost = false, renewal, heartbeat, watchdog, deadline;
      function assertValid() {
        if (lost || stopped || now() >= deadline) throw admissionError("UPLOAD_ADMISSION_LOST");
      }
      function fail() {
        if (stopped || lost) return;
        lost = true;
        clearTimeout(heartbeat); clearTimeout(watchdog);
        onLost?.(admissionError("UPLOAD_ADMISSION_LOST"));
      }
      function setDeadline(start, ttl) {
        if (!Number.isFinite(ttl) || ttl <= 2 * rpcTimeoutMs / 1000) throw admissionError("UPLOAD_ADMISSION_UNAVAILABLE");
        deadline = start + ttl * 1000 - rpcTimeoutMs;
        if (now() >= deadline) throw admissionError("UPLOAD_ADMISSION_LOST");
        clearTimeout(watchdog);
        watchdog = setTimeout(fail, Math.max(1, deadline - now()));
        watchdog.unref?.();
      }
      async function renew() {
        const start = now();
        try {
          const result = await rpc("renew_upload_admission", ownership);
          if (stopped || lost) return;
          // A renewal arriving after our old deadline cannot resurrect work.
          assertValid();
          if (!result?.renewed) throw admissionError("UPLOAD_ADMISSION_LOST");
          setDeadline(start, Number(result.lease_seconds));
          schedule(Number(result.lease_seconds));
        } catch (_) { fail(); }
      }
      function schedule(ttl) {
        heartbeat = setTimeout(() => { renewal = renew(); }, ttl * 1000 / 3);
        heartbeat.unref?.();
      }
      try {
        const start = now();
        const result = await rpc("acquire_upload_admission", { ...ownership, p_event_id: identity.eventId, p_guest_id: identity.guestId });
        if (!result?.acquired) {
          if (["guest", "event", "global"].includes(result?.reason)) {
            throw Object.assign(admissionError("UPLOAD_CONCURRENCY_LIMIT", 429), { retryAfter: result.retry_after || 2, scope: result.reason });
          }
          throw admissionError("UPLOAD_ADMISSION_UNCONFIGURED");
        }
        setDeadline(start, Number(result.lease_seconds));
        schedule(Number(result.lease_seconds));
      } catch (error) {
        stopped = true; clearTimeout(heartbeat); clearTimeout(watchdog);
        // Acquire might have committed even when its response was lost.
        try { await rpc("release_upload_admission", ownership); } catch (_) { log("Upload admission acquire cleanup deferred to lease expiry."); }
        active--;
        throw error;
      }
      return {
        assertValid,
        async release() {
          if (stopped) return;
          stopped = true;
          clearTimeout(heartbeat); clearTimeout(watchdog);
          // A late renewal must settle before release, so it cannot extend a
          // released permit. All RPCs are bounded; failed releases expire.
          try {
            await renewal;
            await rpc("release_upload_admission", ownership);
          } catch (_) { log("Upload admission release deferred to lease expiry."); }
          finally { active--; }
        },
      };
    },
  };
}

module.exports = { createUploadAdmissionService, admissionError };
