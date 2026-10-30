"use strict";

// Importing this module never loads .env, an R2 client or an application client.
const PAGE_SIZE = 500;
const TABLES = [
  ["media", "media_id", ["r2_original_key", "r2_display_key", "r2_poster_key"], "storage_provider"],
  ["event", "event_id", ["event_cover_r2_original_key", "event_cover_r2_display_key"], "event_cover_storage_provider"],
  ["video_processing_jobs", "job_id", ["original_key", "display_key", "poster_key"], "status"],
  ["upload_quota_reservations", "reservation_id", [], "state,assets"],
  ["upload_admission_leases", "lease_id", [], "expires_at"],
  ["video_worker_attempts", "attempt_id", ["original_key", "display_key", "poster_key"], "state"],
];
const JOB_STATES = new Set(["queued", "processing", "ready", "failed"]);
const RESERVATION_STATES = new Set(["reserved", "committed", "cancelled"]);

function uncertain() { throw new Error("R2 reference state is uncertain; refusing deletion."); }
function timestamp(value) {
  if (!value) return NaN;
  return new Date(value).getTime();
}
function identity(object) {
  const modified = timestamp(object.lastModified);
  if (!object.key?.startsWith("events/") || !Number.isFinite(modified) ||
      !Number.isSafeInteger(object.size) || object.size < 0) return null;
  return { key: object.key, size: object.size, lastModified: new Date(modified).toISOString() };
}
function sameObject(a, b) {
  return a && b && a.key === b.key && a.size === b.size && a.lastModified === b.lastModified;
}

async function loadReferences(supabase, now) {
  const keys = new Set();
  const published = { originals: new Set(), display: new Set() };
  let busy = false;
  function add(key) {
    if (key === null) return;
    if (typeof key !== "string" || !key.length) uncertain();
    keys.add(key);
  }
  // Sequential reads fail closed; keyset pagination does not skip rows on deletion.
  // This is not a cross-table snapshot: apply additionally requires stopped writers.
  for (const [table, pk, columns, extra] of TABLES) {
    let after = null;
    while (true) {
      let query = supabase.from(table).select([pk, ...columns, extra].filter(Boolean).join(","))
        .order(pk, { ascending: true }).limit(PAGE_SIZE);
      if (after) query = query.gt(pk, after);
      const { data, error } = await query;
      if (error || !Array.isArray(data)) uncertain();
      for (const row of data) {
        if (!row || typeof row[pk] !== "string" || (after && row[pk] <= after)) uncertain();
        after = row[pk];
        for (const column of columns) {
          add(row[column]);
          if (["media", "event"].includes(table) && row[column]) {
            published[column.includes("original") ? "originals" : "display"].add(row[column]);
          }
        }
        if ((table === "media" && row.storage_provider === "r2" &&
            (!row.r2_original_key || !row.r2_display_key)) ||
            (table === "event" && row.event_cover_storage_provider === "r2" &&
            (!row.event_cover_r2_original_key || !row.event_cover_r2_display_key))) uncertain();
        if (table === "video_processing_jobs") {
          if (!JOB_STATES.has(row.status) || columns.some((column) => !row[column])) uncertain();
          if (row.status === "processing") busy = true;
        }
        if (table === "video_worker_attempts") {
          if (!["processing", "committed", "failed", "abandoned"].includes(row.state) ||
              columns.some((column) => !row[column])) uncertain();
        }
        if (table === "upload_quota_reservations") {
          if (!RESERVATION_STATES.has(row.state) || !Array.isArray(row.assets) || !row.assets.length) uncertain();
          // Preserve even expired/cancelled manifests: late PUTs and recovery are
          // handled by the separate quota cleanup protocol, never by age alone.
          for (const asset of row.assets) {
            if (!asset || !["image", "video"].includes(asset.kind) ||
                typeof asset.original_key !== "string" || typeof asset.display_key !== "string" ||
                (asset.kind === "video" && typeof asset.poster_key !== "string")) uncertain();
            add(asset.original_key); add(asset.display_key);
            if (asset.poster_key != null) add(asset.poster_key);
          }
        }
        if (table === "upload_admission_leases") {
          const expiry = timestamp(row.expires_at);
          if (!Number.isFinite(expiry)) uncertain();
          if (expiry > now) busy = true;
        }
      }
      if (data.length < PAGE_SIZE) break;
    }
  }
  return { keys, busy, published };
}

async function runReconcile({ supabase, listObjects, deleteObject, buckets, apply = false,
  writersStopped = false, previousAudit = null, minAgeMs = 86400000, now = Date.now() }) {
  if (!Number.isFinite(now) || !Number.isFinite(minAgeMs) || minAgeMs < 3600000) uncertain();
  if (!buckets?.originals || !buckets?.display || buckets.originals === buckets.display) uncertain();
  if (apply && !writersStopped) throw new Error("Apply requires --writers-stopped: stop and drain ALL writers/workers first.");
  if (apply && (!previousAudit || previousAudit.version !== 1 ||
      !Number.isFinite(previousAudit.observedAt) || previousAudit.observedAt > now - minAgeMs ||
      previousAudit.buckets?.originals !== buckets.originals || previousAudit.buckets?.display !== buckets.display ||
      !Array.isArray(previousAudit.candidates))) throw new Error("Apply requires a matching, aged dry-run audit.");
  const references = await loadReferences(supabase, now);
  if (apply && references.busy) throw new Error("Live admission lease or processing video exists; refusing deletion.");
  const candidates = [], protectedObjects = [], missing = [];
  for (const bucket of [buckets.originals, buckets.display]) {
    const objects = await listObjects({ bucket, prefix: "events/" });
    if (!Array.isArray(objects)) uncertain();
    const seen = new Set();
    for (const object of objects) {
      if (!object || seen.has(object.key)) uncertain();
      seen.add(object.key);
      const item = identity(object);
      if (!item || references.keys.has(object.key) || now - timestamp(item.lastModified) < minAgeMs) {
        protectedObjects.push({ bucket, key: object.key });
      } else candidates.push({ bucket, ...item });
    }
    const published = references.published[bucket === buckets.originals ? "originals" : "display"];
    for (const key of published) if (!seen.has(key)) missing.push({ bucket, key });
  }
  if (apply && missing.length) throw new Error("Published media/cover objects are missing; refusing deletion.");
  const audit = { version: 1, observedAt: now, buckets: { ...buckets }, candidates };
  let deleted = 0, skipped = 0;
  if (apply) {
    for (const candidate of candidates) {
      const old = previousAudit.candidates.find((item) => item.bucket === candidate.bucket && sameObject(item, candidate));
      if (!old) { skipped++; continue; }
      // Fresh R2 identity first, then fresh references immediately before DELETE.
      const current = await listObjects({ bucket: candidate.bucket, prefix: candidate.key });
      if (!Array.isArray(current)) uncertain();
      const matches = current.filter((item) => item.key === candidate.key);
      if (matches.length > 1) uncertain();
      if (matches.length !== 1 || !sameObject(identity(matches[0]), candidate)) { skipped++; continue; }
      const fresh = await loadReferences(supabase, now);
      if (fresh.busy) throw new Error("Writer activity detected during apply; stopping deletion.");
      if (fresh.keys.has(candidate.key)) { skipped++; continue; }
      // No online atomicity claim: the maintenance window is mandatory. No
      // reference reader can fence an uncooperative DB/R2 writer by itself.
      await deleteObject({ bucket: candidate.bucket, key: candidate.key });
      deleted++;
    }
  }
  return { apply, deleted, skipped, protected: protectedObjects.length, missing, audit };
}

async function main() {
  const fs = require("node:fs/promises");
  const args = process.argv.slice(2);
  const allowed = new Set(["--apply", "--writers-stopped", "--audit-file", "--audit-out", "--verbose"]);
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error("Unknown argument.");
    if (["--audit-file", "--audit-out"].includes(args[i])) {
      if (!args[++i] || args[i].startsWith("--")) throw new Error("Audit path is required.");
    }
  }
  const option = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : null;
  const apply = args.includes("--apply");
  if (apply && (!args.includes("--writers-stopped") || !option("--audit-file"))) {
    throw new Error("Apply requires --writers-stopped and --audit-file; no services were contacted.");
  }
  if (apply && option("--audit-out")) throw new Error("Apply cannot overwrite an audit.");
  const previousAudit = option("--audit-file") ? JSON.parse(await fs.readFile(option("--audit-file"), "utf8")) : null;
  require("dotenv").config();
  const hours = Number(process.env.R2_RECONCILE_MIN_AGE_HOURS || 24);
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) throw new Error("Invalid R2_RECONCILE_MIN_AGE_HOURS.");
  const { listBucketObjects, deleteBucketObject } = require("../services/r2MediaService");
  const result = await runReconcile({ supabase: require("../config/supabaseClient"),
    listObjects: listBucketObjects, deleteObject: deleteBucketObject,
    buckets: require("../config/r2").getR2Buckets(), apply,
    writersStopped: args.includes("--writers-stopped"), previousAudit, minAgeMs: hours * 3600000 });
  if (!apply && option("--audit-out")) {
    await fs.writeFile(option("--audit-out"), JSON.stringify(result.audit, null, 2), { flag: "wx", mode: 0o600 });
  }
  console.log(JSON.stringify(args.includes("--verbose") ? result : {
    apply, deleted: result.deleted, skipped: result.skipped, protected: result.protected,
    candidates: result.audit.candidates.length, missing: result.missing.length,
  }, null, 2));
  if (result.missing.length) process.exitCode = 2;
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { loadReferences, runReconcile };
