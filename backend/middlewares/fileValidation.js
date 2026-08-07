const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_IMAGE_PIXELS = 40_000_000;

async function inspectAndNormalizeFile(file) {
  const { fileTypeFromBuffer, fileTypeFromFile } = await import("file-type");
  const detected = file.path
    ? await fileTypeFromFile(file.path)
    : await fileTypeFromBuffer(file.buffer);

  if (!detected || (!IMAGE_TYPES.has(detected.mime) && !VIDEO_TYPES.has(detected.mime))) {
    const error = new Error("File content does not match an allowed media format.");
    error.statusCode = 400;
    error.code = "INVALID_FILE_SIGNATURE";
    throw error;
  }

  if (IMAGE_TYPES.has(detected.mime)) {
    const imageSource = file.path || file.buffer;
    const image = sharp(imageSource, {
      failOn: "error",
      limitInputPixels: MAX_IMAGE_PIXELS,
    });
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      const error = new Error("Image dimensions exceed the allowed limit.");
      error.statusCode = 400;
      error.code = "IMAGE_DIMENSIONS_TOO_LARGE";
      throw error;
    }

    const normalizedImage = image.rotate().jpeg({ quality: 88, mozjpeg: true });

    if (file.path) {
      const normalizedPath = `${file.path}.normalized.jpg`;
      try {
        await normalizedImage.toFile(normalizedPath);
        await fs.promises.unlink(file.path);
        await fs.promises.rename(normalizedPath, file.path);
      } catch (error) {
        await fs.promises.unlink(normalizedPath).catch(() => {});
        throw error;
      }
      file.size = (await fs.promises.stat(file.path)).size;
    } else {
      file.buffer = await normalizedImage.toBuffer();
      file.size = file.buffer.length;
    }

    file.mimetype = "image/jpeg";
    file.originalname = `${path.parse(file.originalname).name}.jpg`;
    file.detectedFormat = "jpg";
    return file;
  }

  // Video container metadata is validated again after Cloudinary parses the
  // authenticated upload. The application server never decodes video bytes.
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
    // Process sequentially so a 15-image request cannot trigger 15 concurrent
    // decoders and recreate the memory-pressure issue this pipeline avoids.
    for (const file of files) {
      await inspectAndNormalizeFile(file);
    }
    next();
  } catch (error) {
    const files = Array.isArray(req.files)
      ? req.files
      : req.files && typeof req.files === "object"
        ? Object.values(req.files).flat()
        : req.file ? [req.file] : [];

    await Promise.allSettled(
      files
        .filter((file) => file?.path)
        .map((file) => fs.promises.unlink(file.path)),
    );
    next(error);
  }
}

module.exports = { inspectAndNormalizeFile, validateUploadedFiles };
