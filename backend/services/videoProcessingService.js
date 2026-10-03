"use strict";

const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const MAX_VIDEO_DURATION_SECONDS = 5 * 60;
const MAX_VIDEO_DIMENSION = 3840;
const DISPLAY_MAX_WIDTH = 1920;
const DISPLAY_MAX_HEIGHT = 1080;
const DISPLAY_CRF = 23;
const DISPLAY_AUDIO_BITRATE = "128k";
const POSTER_MAX_EDGE = 1280;
const MAX_PROCESS_OUTPUT_BYTES = 2 * 1024 * 1024;

function createVideoError(message, code, statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function runProcess(command, args, { allowNonZero = false } = {}) {
  return new Promise((resolve, reject) => {
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);

    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const append = (current, chunk) => {
      if (current.length >= MAX_PROCESS_OUTPUT_BYTES) return current;
      const next = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const remaining = MAX_PROCESS_OUTPUT_BYTES - current.length;
      return Buffer.concat([current, next.subarray(0, remaining)]);
    };

    child.stdout.on("data", (chunk) => {
      stdout = append(stdout, chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr = append(stderr, chunk);
    });

    child.once("error", (error) => reject(error));
    child.once("close", (code, signal) => {
      const result = {
        code,
        signal,
        stdout: stdout.toString("utf8"),
        stderr: stderr.toString("utf8"),
      };

      if (code === 0 || allowNonZero) {
        resolve(result);
        return;
      }

      const error = new Error(
        `Media process failed (${command}, exit ${code ?? "unknown"}).`,
      );
      error.code = "VIDEO_PROCESS_FAILED";
      error.statusCode = 500;
      error.process = result;
      reject(error);
    });
  });
}

function parseDurationToSeconds(value) {
  const match = String(value || "").match(/^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const total = hours * 3600 + minutes * 60 + seconds;

  return Number.isFinite(total) ? total : null;
}

async function probeWithFfprobe(filePath) {
  const result = await runProcess(process.env.FFPROBE_PATH || "ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,codec_name,duration:format=duration",
    "-of",
    "json",
    filePath,
  ]);

  const payload = JSON.parse(result.stdout || "{}");
  const stream = Array.isArray(payload.streams) ? payload.streams[0] : null;

  if (!stream) {
    throw createVideoError(
      "The uploaded file does not contain a readable video stream.",
      "VIDEO_STREAM_MISSING",
    );
  }

  const duration = Number(stream.duration || payload.format?.duration);

  return {
    duration: Number.isFinite(duration) ? duration : null,
    width: Number(stream.width),
    height: Number(stream.height),
    codec: String(stream.codec_name || ""),
  };
}

async function probeWithFfmpeg(filePath) {
  const result = await runProcess(
    process.env.FFMPEG_PATH || "ffmpeg",
    ["-hide_banner", "-i", filePath, "-f", "null", "-"],
    { allowNonZero: true },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  const durationMatch = output.match(/Duration:\s*(\d+:\d{2}:\d{2}(?:\.\d+)?)/i);
  const videoLine = output
    .split(/\r?\n/)
    .find((line) => /Video:/i.test(line));
  const dimensions = videoLine?.match(/(?:^|[ ,])(\d{2,5})x(\d{2,5})(?:[ ,]|$)/);
  const codecMatch = videoLine?.match(/Video:\s*([^,\s]+)/i);

  if (!videoLine || !dimensions) {
    throw createVideoError(
      "The uploaded file does not contain a readable video stream.",
      "VIDEO_STREAM_MISSING",
    );
  }

  return {
    duration: durationMatch ? parseDurationToSeconds(durationMatch[1]) : null,
    width: Number(dimensions[1]),
    height: Number(dimensions[2]),
    codec: codecMatch ? codecMatch[1] : "",
  };
}

async function probeVideoFile(filePath) {
  try {
    return await probeWithFfprobe(filePath);
  } catch (error) {
    // Render includes ffmpeg at runtime. ffprobe normally accompanies it, but
    // this fallback keeps the upload path functional if ffprobe is unavailable.
    if (error?.code !== "ENOENT" && error?.code !== "VIDEO_STREAM_MISSING") {
      try {
        return await probeWithFfmpeg(filePath);
      } catch (_fallbackError) {
        throw error;
      }
    }

    return probeWithFfmpeg(filePath);
  }
}

function validateVideoMetadata(metadata) {
  const duration = Number(metadata?.duration);
  const width = Number(metadata?.width);
  const height = Number(metadata?.height);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw createVideoError(
      "Video duration could not be determined.",
      "VIDEO_DURATION_INVALID",
    );
  }

  if (duration > MAX_VIDEO_DURATION_SECONDS + 0.25) {
    throw createVideoError(
      "Video must be no longer than 5 minutes.",
      "VIDEO_DURATION_TOO_LONG",
    );
  }

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > MAX_VIDEO_DIMENSION ||
    height > MAX_VIDEO_DIMENSION
  ) {
    throw createVideoError(
      "Video dimensions must not exceed 4K.",
      "VIDEO_DIMENSIONS_TOO_LARGE",
    );
  }

  return {
    ...metadata,
    duration,
    width,
    height,
  };
}

async function safeUnlink(filePath) {
  if (!filePath) return;
  await fs.promises.unlink(filePath).catch(() => {});
}

async function transcodeVideoForDisplay(file) {
  const sourcePath = file?.path;

  if (!sourcePath) {
    throw createVideoError(
      "Video processing requires a temporary source file.",
      "VIDEO_SOURCE_MISSING",
      500,
    );
  }

  let originalMetadata;
  try {
    originalMetadata = validateVideoMetadata(await probeVideoFile(sourcePath));
  } catch (error) {
    if (error?.statusCode && error.statusCode < 500) throw error;

    const wrapped = createVideoError(
      "Video metadata could not be read on the server.",
      "VIDEO_PROBE_FAILED",
      500,
    );
    wrapped.stage = "probe";
    wrapped.cause = error;
    wrapped.process = error?.process;
    throw wrapped;
  }

  const token = crypto.randomUUID();
  const displayPath = `${sourcePath}.${token}.display.mp4`;
  const posterPngPath = `${sourcePath}.${token}.poster.png`;
  const posterPath = `${sourcePath}.${token}.poster.webp`;

  try {
    try {
      await runProcess(process.env.FFMPEG_PATH || "ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-nostdin",
        "-y",
        "-i",
        sourcePath,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-vf",
        `scale=w='min(${DISPLAY_MAX_WIDTH},iw)':h='min(${DISPLAY_MAX_HEIGHT},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        String(DISPLAY_CRF),
        "-pix_fmt",
        "yuv420p",
        "-threads",
        "2",
        "-c:a",
        "aac",
        "-b:a",
        DISPLAY_AUDIO_BITRATE,
        "-ac",
        "2",
        "-movflags",
        "+faststart",
        "-max_muxing_queue_size",
        "2048",
        displayPath,
      ]);
    } catch (error) {
      const wrapped = createVideoError(
        "Video could not be converted to browser-compatible MP4.",
        "VIDEO_TRANSCODE_PROCESS_FAILED",
        500,
      );
      wrapped.stage = "transcode";
      wrapped.cause = error;
      wrapped.process = error?.process;
      throw wrapped;
    }

    const seekSeconds = Math.min(
      1,
      Math.max(0, originalMetadata.duration * 0.1),
    );

    // Build the poster from the normalized MP4 instead of seeking the original
    // container a second time. This is more reliable for unusual MP4/MOV/WEBM
    // sources and avoids a successful transcode being discarded only because
    // the original container is difficult to seek for thumbnail extraction.
    try {
      await runProcess(process.env.FFMPEG_PATH || "ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-nostdin",
        "-y",
        "-i",
        displayPath,
        "-ss",
        String(seekSeconds),
        "-frames:v",
        "1",
        "-an",
        "-vf",
        `scale=w='min(${POSTER_MAX_EDGE},iw)':h='min(${POSTER_MAX_EDGE},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        posterPngPath,
      ]);
    } catch (error) {
      const wrapped = createVideoError(
        "Video poster could not be generated.",
        "VIDEO_POSTER_PROCESS_FAILED",
        500,
      );
      wrapped.stage = "poster";
      wrapped.cause = error;
      wrapped.process = error?.process;
      throw wrapped;
    }

    try {
      await sharp(posterPngPath, {
        failOn: "error",
        limitInputPixels: 40_000_000,
      })
        .webp({ quality: 82, effort: 4 })
        .toFile(posterPath);
    } catch (error) {
      const wrapped = createVideoError(
        "Video poster could not be encoded as WEBP.",
        "VIDEO_POSTER_WEBP_FAILED",
        500,
      );
      wrapped.stage = "poster-webp";
      wrapped.cause = error;
      throw wrapped;
    }

    await safeUnlink(posterPngPath);

    const [displayStat, posterStat, displayMetadata] = await Promise.all([
      fs.promises.stat(displayPath),
      fs.promises.stat(posterPath),
      probeVideoFile(displayPath),
    ]);

    if (displayStat.size <= 0 || posterStat.size <= 0) {
      throw createVideoError(
        "Video derivative generation produced an empty file.",
        "VIDEO_DERIVATIVE_EMPTY",
        500,
      );
    }

    return {
      displayPath,
      posterPath,
      originalMetadata,
      displayMetadata: validateVideoMetadata(displayMetadata),
      displayBytes: displayStat.size,
      posterBytes: posterStat.size,
      displayContentType: "video/mp4",
      posterContentType: "image/webp",
    };
  } catch (error) {
    await Promise.allSettled([
      safeUnlink(displayPath),
      safeUnlink(posterPngPath),
      safeUnlink(posterPath),
    ]);

    if (error?.statusCode) throw error;

    const wrapped = createVideoError(
      "Video could not be converted for browser playback.",
      "VIDEO_TRANSCODE_FAILED",
      500,
    );
    wrapped.stage = "unknown";
    wrapped.cause = error;
    throw wrapped;
  }
}

async function cleanupVideoDerivatives(result) {
  await Promise.allSettled([
    safeUnlink(result?.displayPath),
    safeUnlink(result?.posterPath),
  ]);
}

module.exports = {
  MAX_VIDEO_DIMENSION,
  MAX_VIDEO_DURATION_SECONDS,
  cleanupVideoDerivatives,
  probeVideoFile,
  transcodeVideoForDisplay,
  validateVideoMetadata,
};
