"use strict";

const { admissionError } = require("../services/uploadAdmissionService");

// Hold the permit until middleware, handler AND file cleanup settle. A socket
// 'close' alone must not release it while Sharp/R2 work is still running.
function withUploadAdmission(service, stages, cleanup) {
  return async function admittedUpload(req, res, next) {
    let lease;
    let disconnected = false;
    const onDisconnect = () => { disconnected = true; };
    res.once("close", onDisconnect);
    try {
      lease = await service.acquire(req.uploadIdentity, () => req.destroy());
      req.uploadLease = { assertValid() {
        lease.assertValid();
        if (disconnected || req.aborted) throw admissionError("UPLOAD_ADMISSION_LOST");
      } };
      if (disconnected || req.aborted || res.destroyed) return;
      for (let i = 0; i < stages.length; i++) {
        lease.assertValid();
        if (disconnected || req.aborted) return;
        if (i === stages.length - 1) await stages[i](req, res);
        else await new Promise((resolve, reject) => {
          stages[i](req, res, (error) => error ? reject(error) : resolve());
        });
      }
    } catch (error) {
      if (!res.headersSent && !res.destroyed) {
        if (error.retryAfter) res.setHeader("Retry-After", error.retryAfter);
        if (["UPLOAD_CONCURRENCY_LIMIT", "UPLOAD_ADMISSION_UNCONFIGURED", "UPLOAD_ADMISSION_UNAVAILABLE", "UPLOAD_ADMISSION_LOST"].includes(error.code)) {
          res.status(error.statusCode || 503).json({ success: false, code: error.code,
            message: error.code === "UPLOAD_CONCURRENCY_LIMIT" ? "Too many requests. Please try again later." : error.message });
        } else next(error);
      }
    } finally {
      res.removeListener("close", onDisconnect);
      try { await cleanup(Object.values(req.files || {}).flat()); }
      finally { await lease?.release(); }
    }
  };
}

module.exports = { withUploadAdmission };
