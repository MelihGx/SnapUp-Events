"use strict";

const crypto = require("crypto");
const fs = require("fs");

function quotaError(code, statusCode = 503) {
  return Object.assign(new Error("Upload failed."), { code, statusCode });
}

// Shared exact-label mapping for RPC and direct-insert quota errors.
function mapUploadQuotaError(error) {
  const code = String(error?.message || "");
  const known = ["EVENT_STORAGE_QUOTA_EXCEEDED", "GUEST_STORAGE_QUOTA_EXCEEDED", "GUEST_UPLOAD_LIMIT_EXCEEDED",
    "UPLOAD_IDEMPOTENCY_CONFLICT", "UPLOAD_IN_PROGRESS", "UPLOAD_ADMISSION_LOST", "UPLOAD_DISABLED"];
  const match = known.find((item) => code === item);
  const status = match?.includes("QUOTA_EXCEEDED") ? 413 : match === "GUEST_UPLOAD_LIMIT_EXCEEDED" ? 400
    : ["UPLOAD_IDEMPOTENCY_CONFLICT", "UPLOAD_IN_PROGRESS"].includes(match) ? 409 : match === "UPLOAD_DISABLED" ? 403 : 503;
  return quotaError(match || "UPLOAD_QUOTA_UNAVAILABLE", status);
}

function createUploadQuotaService({ supabase }) {
  async function rpc(name, args) {
    const result = await supabase.rpc(name, args).abortSignal(AbortSignal.timeout(10000));
    if (result.error) {
      throw mapUploadQuotaError(result.error);
    }
    return result.data;
  }

  return {
    async reserve({ req, files, message }) {
      const suppliedKey = req.get("Idempotency-Key");
      if (suppliedKey && !/^[A-Za-z0-9._:-]{16,128}$/.test(suppliedKey)) throw quotaError("INVALID_IDEMPOTENCY_KEY", 400);
      const assets = [];
      for (const file of files) {
        req.uploadLease.assertValid();
        const hash = crypto.createHash("sha256");
        for await (const chunk of fs.createReadStream(file.path)) hash.update(chunk);
        const assetId = crypto.randomUUID();
        const kind = file.mimetype.startsWith("image/") ? "image" : "video";
        const ext = file.detectedFormat === "jpeg" ? "jpg" : file.detectedFormat;
        if (!(kind === "image" ? ["jpg", "png", "webp"] : ["mp4", "webm", "mov"]).includes(ext)) throw quotaError("INVALID_MEDIA_FORMAT", 400);
        const prefix = `events/${req.uploadIdentity.eventId}/media/${assetId}`;
        file.uploadAssetId = assetId;
        assets.push({ asset_id: assetId, kind, bytes: file.size, sha256: hash.digest("hex"),
          original_key: `${prefix}/original.${ext}`, display_key: `${prefix}/display.${kind === "image" ? "webp" : "mp4"}`,
          poster_key: kind === "video" ? `${prefix}/poster.webp` : null });
      }
      const fingerprint = crypto.createHash("sha256").update(JSON.stringify({
        files: assets.map(({ kind, bytes, sha256 }) => ({ kind, bytes, sha256 })), message,
      })).digest("hex");
      const reservationId = crypto.randomUUID();
      const owner = req.uploadLease.ownership;
      if (!owner) throw quotaError("UPLOAD_ADMISSION_LOST");
      const ownership = { p_reservation_id: reservationId, p_owner_hash: owner.p_owner_hash };
      // Install before the RPC: a lost reserve reply can still be cancelled.
      const session = {
        assets,
        async finalize(media, jobs) {
          const result = await rpc("finalize_upload_quota", { ...ownership, p_media: media, p_jobs: jobs });
          if (!Array.isArray(result?.media) || !Array.isArray(result?.video_jobs)) throw quotaError("UPLOAD_QUOTA_UNAVAILABLE");
          return result;
        },
        async cancel() { return rpc("cancel_upload_quota", ownership); },
      };
      req.uploadQuota = session;
      const result = await rpc("reserve_upload_quota", { p_reservation_id: reservationId,
        p_lease_id: owner.p_lease_id, p_owner_hash: owner.p_owner_hash,
        p_event_id: req.uploadIdentity.eventId, p_guest_id: req.uploadIdentity.guestId,
        p_key: suppliedKey || reservationId, p_fingerprint: fingerprint,
        p_bytes: files.reduce((sum, file) => sum + file.size, 0), p_count: files.length, p_assets: assets });
      if (!["reserved", "committed"].includes(result?.state)) throw quotaError("UPLOAD_QUOTA_UNAVAILABLE");
      return { ...session, ...result };
    },
  };
}

module.exports = { createUploadQuotaService, quotaError, mapUploadQuotaError };
