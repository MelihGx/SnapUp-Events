"use strict";

const supabase = require("../config/supabaseClient");
const {
  deleteMediaAssets,
  processStoredVideoOriginal,
} = require("./r2MediaService");

const DEFAULT_POLL_INTERVAL_MS = 3000;
const MIN_POLL_INTERVAL_MS = 1000;
const MAX_POLL_INTERVAL_MS = 30000;

let pollTimer = null;
let loopRunning = false;
let started = false;
let cachedVideoMediaTypeId = null;

function clampInteger(value, fallback, min, max) {
  const number = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function getPollIntervalMs() {
  return clampInteger(
    process.env.VIDEO_QUEUE_POLL_MS,
    DEFAULT_POLL_INTERVAL_MS,
    MIN_POLL_INTERVAL_MS,
    MAX_POLL_INTERVAL_MS,
  );
}

async function getVideoMediaTypeId() {
  if (cachedVideoMediaTypeId) {
    return cachedVideoMediaTypeId;
  }

  const { data, error } = await supabase
    .from("media_type")
    .select("media_type_id")
    .eq("media_type", "video")
    .single();

  if (error || !data?.media_type_id) {
    throw new Error(
      error?.message || "Video media type could not be found.",
    );
  }

  cachedVideoMediaTypeId = data.media_type_id;
  return cachedVideoMediaTypeId;
}

async function recoverInterruptedJobs() {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("video_processing_jobs")
    .update({
      status: "queued",
      updated_at: now,
      started_at: null,
      error_code: "WORKER_RESTART_RECOVERY",
      error_message:
        "The previous worker stopped before the video job completed. The job was queued again automatically.",
    })
    .eq("status", "processing");

  if (error) {
    throw new Error(
      `Interrupted video jobs could not be recovered: ${error.message}`,
    );
  }
}

async function claimNextJob() {
  const { data: job, error } = await supabase
    .from("video_processing_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Video queue could not be read: ${error.message}`);
  }

  if (!job) {
    return null;
  }

  const now = new Date().toISOString();
  const attemptCount = Math.max(0, Number(job.attempt_count) || 0) + 1;

  // The status predicate keeps the claim idempotent if the loop is triggered
  // twice inside the same Node process.
  const { data: claimed, error: claimError } = await supabase
    .from("video_processing_jobs")
    .update({
      status: "processing",
      attempt_count: attemptCount,
      started_at: now,
      updated_at: now,
      error_code: null,
      error_message: null,
    })
    .eq("job_id", job.job_id)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  if (claimError) {
    throw new Error(`Video job could not be claimed: ${claimError.message}`);
  }

  return claimed || null;
}

async function markJobFailed(job, error) {
  const now = new Date().toISOString();
  const errorCode = String(error?.code || "VIDEO_BACKGROUND_PROCESSING_FAILED");
  const errorMessage = String(error?.message || "Video processing failed.").slice(
    0,
    2000,
  );

  const { error: updateError } = await supabase
    .from("video_processing_jobs")
    .update({
      status: "failed",
      updated_at: now,
      error_code: errorCode,
      error_message: errorMessage,
    })
    .eq("job_id", job.job_id);

  if (updateError) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "video_job_failure_status_update_failed",
        job_id: job.job_id,
        message: updateError.message,
      }),
    );
  }

  console.error(
    JSON.stringify({
      level: "error",
      event: "video_background_processing_failed",
      job_id: job.job_id,
      event_id: job.event_id,
      guest_id: job.guest_id,
      code: errorCode,
      message: errorMessage,
    }),
  );
}

async function finalizeVideoJob(job) {
  const derivatives = await processStoredVideoOriginal({
    eventId: job.event_id,
    originalKey: job.original_key,
    displayKey: job.display_key,
    posterKey: job.poster_key,
    originalContentType: job.original_mime_type,
  });

  const mediaTypeId = await getVideoMediaTypeId();

  const mediaRow = {
    // Reusing the persistent job UUID makes finalization idempotent. If the
    // process stops after the media upsert but before the job status update,
    // the next run updates the same media row instead of creating a duplicate.
    media_id: job.job_id,
    event_id: job.event_id,
    guest_id: job.guest_id,
    media_type_id: mediaTypeId,
    media_url: derivatives.displayUrl,
    message: job.message || null,
    media_status: job.target_media_status,
    bytes: Math.max(0, Number(job.original_bytes) || 0),
    storage_provider: "r2",
    r2_original_key: job.original_key,
    r2_display_key: job.display_key,
    r2_poster_key: job.poster_key,
    original_bytes: Math.max(0, Number(job.original_bytes) || 0),
    display_bytes: Math.max(0, Number(derivatives.displayBytes) || 0),
    original_mime_type: job.original_mime_type || null,
    display_mime_type: derivatives.displayContentType || "video/mp4",
    video_duration_seconds:
      Number(job.video_duration_seconds) ||
      Number(derivatives.durationSeconds) ||
      null,
    video_width:
      Number(job.video_width) || Number(derivatives.originalWidth) || null,
    video_height:
      Number(job.video_height) || Number(derivatives.originalHeight) || null,
    cloudinary_public_id: null,
    resource_type: "video",
    delivery_type: "authenticated",
    format: "mp4",
  };

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .upsert(mediaRow, { onConflict: "media_id" })
    .select("media_id")
    .single();

  if (mediaError) {
    // The original stays in R2 for retry/recovery, but derivatives are removed
    // when the final media row cannot be committed.
    await deleteMediaAssets({
      originalKey: null,
      displayKey: job.display_key,
      posterKey: job.poster_key,
    }).catch(() => {});

    const error = new Error(
      `Processed video could not be written to media: ${mediaError.message}`,
    );
    error.code = "VIDEO_MEDIA_FINALIZE_FAILED";
    throw error;
  }

  const now = new Date().toISOString();

  const { error: completeError } = await supabase
    .from("video_processing_jobs")
    .update({
      status: "ready",
      media_id: media.media_id,
      completed_at: now,
      updated_at: now,
      error_code: null,
      error_message: null,
    })
    .eq("job_id", job.job_id);

  if (completeError) {
    // The media row already exists at this point. Keep the job in processing
    // instead of marking it failed; a future process restart will safely
    // re-queue it and the media upsert is idempotent via job_id == media_id.
    console.error(
      JSON.stringify({
        level: "error",
        event: "video_job_complete_status_update_failed",
        job_id: job.job_id,
        media_id: media.media_id,
        message: completeError.message,
      }),
    );
    return;
  }

  console.log(
    JSON.stringify({
      level: "info",
      event: "video_background_processing_completed",
      job_id: job.job_id,
      media_id: media.media_id,
      event_id: job.event_id,
      attempt_count: job.attempt_count,
    }),
  );
}

async function processQueue() {
  if (loopRunning) return;

  loopRunning = true;

  try {
    while (true) {
      const job = await claimNextJob();
      if (!job) break;

      try {
        await finalizeVideoJob(job);
      } catch (error) {
        await markJobFailed(job, error);
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "video_queue_loop_failed",
        message: error?.message || "Video queue loop failed.",
      }),
    );
  } finally {
    loopRunning = false;
  }
}

function wakeVideoProcessingWorker() {
  setImmediate(() => {
    processQueue().catch(() => {});
  });
}

async function startVideoProcessingWorker() {
  if (started) return;
  started = true;

  try {
    await recoverInterruptedJobs();
  } catch (error) {
    // Do not stop the HTTP server if the migration has not been applied yet.
    // The upload route will still report the database problem explicitly.
    console.error(
      JSON.stringify({
        level: "error",
        event: "video_queue_recovery_failed",
        message: error?.message || "Video queue recovery failed.",
      }),
    );
  }

  wakeVideoProcessingWorker();

  pollTimer = setInterval(() => {
    processQueue().catch(() => {});
  }, getPollIntervalMs());

  pollTimer.unref?.();
}

module.exports = {
  startVideoProcessingWorker,
  wakeVideoProcessingWorker,
};
