const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  getR2Buckets,
  getR2Client,
  getR2DisplayPublicBaseUrl,
} = require("../config/r2");

const DEFAULT_DISPLAY_MAX_DIMENSION = 2560;
const DEFAULT_DISPLAY_WEBP_QUALITY = 86;
const DEFAULT_ORIGINAL_URL_TTL_SECONDS = 900;

function clampInteger(value, fallback, min, max) {
  const number = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function getImageSettings() {
  return {
    maxDimension: clampInteger(
      process.env.R2_IMAGE_DISPLAY_MAX_DIMENSION,
      DEFAULT_DISPLAY_MAX_DIMENSION,
      1280,
      4096,
    ),
    webpQuality: clampInteger(
      process.env.R2_IMAGE_DISPLAY_WEBP_QUALITY,
      DEFAULT_DISPLAY_WEBP_QUALITY,
      70,
      100,
    ),
  };
}

function getOriginalDownloadTtlSeconds() {
  return clampInteger(
    process.env.R2_ORIGINAL_DOWNLOAD_TTL_SECONDS,
    DEFAULT_ORIGINAL_URL_TTL_SECONDS,
    60,
    604800,
  );
}

function sanitizeExtension(value) {
  const extension = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\./, "");

  if (extension === "jpeg") return "jpg";
  if (["jpg", "png", "webp"].includes(extension)) return extension;
  return "bin";
}

function buildDisplayUrl(key) {
  return `${getR2DisplayPublicBaseUrl()}/${String(key)
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function putObject({
  bucket,
  key,
  body,
  contentType,
  contentLength,
  cacheControl,
  metadata,
}) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: contentLength,
      CacheControl: cacheControl,
      Metadata: metadata,
    }),
  );
}

async function deleteObject(bucket, key) {
  if (!key) return;

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

async function deleteImagePair({ originalKey, displayKey }) {
  const buckets = getR2Buckets();

  await Promise.allSettled([
    originalKey ? deleteObject(buckets.originals, originalKey) : null,
    displayKey ? deleteObject(buckets.display, displayKey) : null,
  ]);
}

async function uploadImagePair(file, eventId) {
  if (!file?.path) {
    throw new Error("R2 image upload requires a temporary file path.");
  }

  const buckets = getR2Buckets();
  const assetId = crypto.randomUUID();
  const originalExtension = sanitizeExtension(
    file.detectedFormat || path.extname(file.originalname),
  );

  const objectPrefix = `events/${eventId}/media/${assetId}`;
  const originalKey = `${objectPrefix}/original.${originalExtension}`;
  const displayKey = `${objectPrefix}/display.webp`;

  const originalBytes = Math.max(0, Number(file.size) || 0);
  const originalContentType =
    String(file.detectedMime || file.mimetype || "application/octet-stream");

  const { maxDimension, webpQuality } = getImageSettings();

  let displayBuffer;

  try {
    // IMPORTANT: the source file itself is never overwritten or recompressed.
    // Sharp only reads it to create a separate display derivative.
    displayBuffer = await sharp(file.path, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: webpQuality,
        effort: 4,
      })
      .toBuffer();

    await putObject({
      bucket: buckets.originals,
      key: originalKey,
      body: fs.createReadStream(file.path),
      contentType: originalContentType,
      contentLength: originalBytes,
      cacheControl: "private, no-store",
      metadata: {
        event_id: String(eventId),
        asset_kind: "original",
      },
    });

    try {
      await putObject({
        bucket: buckets.display,
        key: displayKey,
        body: displayBuffer,
        contentType: "image/webp",
        contentLength: displayBuffer.length,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          event_id: String(eventId),
          asset_kind: "display",
          source_key: originalKey,
        },
      });
    } catch (error) {
      await deleteObject(buckets.originals, originalKey).catch(() => {});
      throw error;
    }

    return {
      storageProvider: "r2",
      originalKey,
      displayKey,
      displayUrl: buildDisplayUrl(displayKey),
      originalBytes,
      displayBytes: displayBuffer.length,
      originalContentType,
      displayContentType: "image/webp",
    };
  } finally {
    displayBuffer = null;
  }
}

async function createOriginalDownloadUrl(originalKey, expiresIn = null) {
  if (!originalKey) return null;

  const { originals } = getR2Buckets();
  const ttl = expiresIn || getOriginalDownloadTtlSeconds();

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: originals,
      Key: originalKey,
    }),
    { expiresIn: ttl },
  );
}

function isR2DisplayUrl(value) {
  const url = String(value || "");
  if (!url) return false;

  try {
    return url.startsWith(`${getR2DisplayPublicBaseUrl()}/`);
  } catch (_error) {
    return false;
  }
}

module.exports = {
  buildDisplayUrl,
  createOriginalDownloadUrl,
  deleteImagePair,
  isR2DisplayUrl,
  uploadImagePair,
};
