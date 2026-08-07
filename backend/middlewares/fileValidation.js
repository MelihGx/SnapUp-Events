const sharp = require("sharp");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_IMAGE_PIXELS = 40_000_000;

async function inspectAndNormalizeFile(file) {
  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || (!IMAGE_TYPES.has(detected.mime) && !VIDEO_TYPES.has(detected.mime))) {
    const error = new Error("File content does not match an allowed media format.");
    error.statusCode = 400;
    error.code = "INVALID_FILE_SIGNATURE";
    throw error;
  }

  if (IMAGE_TYPES.has(detected.mime)) {
    const image = sharp(file.buffer, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      const error = new Error("Image dimensions exceed the allowed limit.");
      error.statusCode = 400;
      error.code = "IMAGE_DIMENSIONS_TOO_LARGE";
      throw error;
    }
    file.buffer = await image.rotate().jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    file.mimetype = "image/jpeg";
    file.originalname = file.originalname.replace(/\.[^.]+$/, "") + ".jpg";
    file.size = file.buffer.length;
    file.detectedFormat = "jpg";
    return file;
  }

  if (process.env.ENABLE_VIDEO_UPLOADS !== "true") {
    const error = new Error("Video uploads are disabled until server-side ffprobe scanning is configured.");
    error.statusCode = 503;
    error.code = "VIDEO_SCANNING_NOT_CONFIGURED";
    throw error;
  }
  // The deployment entrypoint must run ffprobe scanning before setting
  // ENABLE_VIDEO_UPLOADS=true (codec, duration, dimensions and bitrate).
  file.mimetype = detected.mime;
  file.detectedFormat = detected.ext;
  return file;
}

async function validateUploadedFiles(req, _res, next) {
  try {
    const files = Array.isArray(req.files)
      ? req.files
      : req.files && typeof req.files === "object"
        ? Object.values(req.files).flat()
        : req.file ? [req.file] : [];
    await Promise.all(files.map(inspectAndNormalizeFile));
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { inspectAndNormalizeFile, validateUploadedFiles };
