"use strict";
const { createVideoWorker } = require("./videoWorkerService");
let worker, pollTimer, loop, stopped = false;
function getWorker() {
  if (!worker) {
    const supabase = require("../config/supabaseClient");
    let mediaTypeId;
    worker = createVideoWorker({ supabase,
      processVideo: (options) => require("./r2MediaService").processStoredVideoOriginal(options),
      async getVideoMediaTypeId() {
        if (!mediaTypeId) {
          const { data, error } = await supabase.from("media_type").select("media_type_id").eq("media_type", "video").single();
          if (error || !data?.media_type_id) throw new Error("Video media type unavailable");
          mediaTypeId = data.media_type_id;
        }
        return mediaTypeId;
      },
    });
  }
  return worker;
}
function wakeVideoProcessingWorker() {
  if (stopped || loop) return;
  loop = Promise.resolve().then(() => getWorker().drain()).catch(() => {
    console.error(JSON.stringify({ event: "video_queue_loop_failed" }));
  }).finally(() => { loop = null; });
}
async function startVideoProcessingWorker() {
  if (stopped || pollTimer) return;
  // Atomic claim handles expiry. Never reset somebody else's processing job.
  getWorker();
  const configured = Number(process.env.VIDEO_QUEUE_POLL_MS || 3000);
  const interval = Number.isFinite(configured) ? Math.min(30000, Math.max(1000, configured)) : 3000;
  pollTimer = setInterval(wakeVideoProcessingWorker, interval); pollTimer.unref?.();
  wakeVideoProcessingWorker();
}
async function stopVideoProcessingWorker(options) {
  stopped = true;
  clearInterval(pollTimer); pollTimer = null;
  await worker?.stop(options);
}
module.exports = { startVideoProcessingWorker, wakeVideoProcessingWorker, stopVideoProcessingWorker };
