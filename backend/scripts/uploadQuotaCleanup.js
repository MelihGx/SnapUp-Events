"use strict";

// Deliberately separate from r2Reconcile.js. Default is read-only audit.
// Re-run on a schedule: a stalled, cancelled writer can finish an R2 PUT late.
async function runUploadQuotaCleanup({ supabase, deleteAsset, apply = false }) {
  let deleted = 0, reservations = 0, after = null;
  while (true) {
    const { data, error } = await supabase.rpc("list_upload_quota_cleanup", { p_apply: apply, p_after: after });
    if (error) throw new Error("Upload quota cleanup state could not be read.");
    reservations += (data || []).length;
    for (const row of data || []) {
      for (const asset of row.assets || []) {
        // Check persisted references again immediately before each deletion.
        // Committed rows never enter the cleanup list. Do not delete any key
        // referenced by a legacy/current media row or any video job (even failed).
        const keys = [asset.original_key, asset.display_key, asset.poster_key].filter(Boolean);
        const [{ data: media, error: me }, { data: jobs, error: je }] = await Promise.all([
          supabase.from("media").select("media_id").in("r2_original_key", keys).limit(1),
          supabase.from("video_processing_jobs").select("job_id").in("original_key", keys).limit(1),
        ]);
        if (me || je) throw new Error("Cleanup references could not be verified; refusing deletion.");
        if (media?.length || jobs?.length) continue;
        if (apply) { await deleteAsset(asset); deleted++; }
      }
    }
    if (!data?.length || data.length < 100) break;
    after = data.at(-1).reservation_id;
  }
  return { apply, reservations, deleted };
}

if (require.main === module) {
  require("dotenv").config();
  const supabase = require("../config/supabaseClient");
  const { getR2Buckets } = require("../config/r2");
  const { deleteBucketObject } = require("../services/r2MediaService");
  runUploadQuotaCleanup({ supabase, apply: process.argv.includes("--apply"),
    async deleteAsset(asset) {
      const buckets = getR2Buckets();
      await deleteBucketObject({ bucket: buckets.originals, key: asset.original_key });
      await deleteBucketObject({ bucket: buckets.display, key: asset.display_key });
      if (asset.poster_key) await deleteBucketObject({ bucket: buckets.display, key: asset.poster_key });
    },
  }).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { runUploadQuotaCleanup };
