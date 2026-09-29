const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
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

async function listBucketObjects({
  bucket,
  prefix = "events/",
}) {
  if (!bucket) {
    throw new Error("R2 bucket name is required.");
  }

  const objects = [];
  let continuationToken;

  do {
    const response = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );

    for (const item of response.Contents || []) {
      if (!item?.Key) continue;

      objects.push({
        key: item.Key,
        size: Math.max(0, Number(item.Size) || 0),
        lastModified: item.LastModified
          ? new Date(item.LastModified)
          : null,
      });
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return objects;
}

async function deleteBucketObject({ bucket, key }) {
  if (!bucket || !key) {
    throw new Error("R2 bucket and object key are required.");
  }

  await deleteObject(bucket, key);
}

async function uploadImagePair(file, eventId, options = {}) {
  const source = file?.path || file?.buffer;

  if (!source) {
    throw new Error("R2 image upload requires a file path or buffer.");
  }

  const objectKind = options.kind === "cover" ? "cover" : "media";
  const buckets = getR2Buckets();
  const assetId = crypto.randomUUID();
  const originalExtension = sanitizeExtension(
    file.detectedFormat || path.extname(file.originalname),
  );

  const objectPrefix = `events/${eventId}/${objectKind}/${assetId}`;
  const originalKey = `${objectPrefix}/original.${originalExtension}`;
  const displayKey = `${objectPrefix}/display.webp`;

  const originalBytes = Math.max(
    0,
    Number(file.size) || (Buffer.isBuffer(file.buffer) ? file.buffer.length : 0),
  );
  const originalContentType = String(
    file.detectedMime || file.mimetype || "application/octet-stream",
  );

  const { maxDimension, webpQuality } = getImageSettings();

  let displayBuffer;

  try {
    // The source object is never rewritten. Sharp only creates a separate
    // display derivative, preserving the original bytes in the private bucket.
    displayBuffer = await sharp(source, {
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

    const originalBody = file.path
      ? fs.createReadStream(file.path)
      : file.buffer;

    await putObject({
      bucket: buckets.originals,
      key: originalKey,
      body: originalBody,
      contentType: originalContentType,
      contentLength: originalBytes,
      cacheControl: "private, no-store",
      metadata: {
        event_id: String(eventId),
        asset_kind: `${objectKind}_original`,
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
          asset_kind: `${objectKind}_display`,
          source_key: originalKey,
        },
      });
    } catch (error) {
      await deleteObject(buckets.originals, originalKey).catch(() => {});
      throw error;
    }

    return {
      storageProvider: "r2",
      objectKind,
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


async function readObjectBodyToBuffer(body, maxBytes) {
  if (!body) {
    throw new Error("R2 object response body is empty.");
  }

  if (Buffer.isBuffer(body)) {
    if (body.length > maxBytes) {
      throw new Error("R2 object exceeds the allowed size.");
    }
    return body;
  }

  if (body instanceof Uint8Array) {
    const buffer = Buffer.from(body);
    if (buffer.length > maxBytes) {
      throw new Error("R2 object exceeds the allowed size.");
    }
    return buffer;
  }

  if (typeof body[Symbol.asyncIterator] === "function") {
    const chunks = [];
    let total = 0;

    for await (const chunk of body) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;

      if (total > maxBytes) {
        throw new Error("R2 object exceeds the allowed size.");
      }

      chunks.push(buffer);
    }

    return Buffer.concat(chunks, total);
  }

  if (typeof body.transformToByteArray === "function") {
    const bytes = await body.transformToByteArray();
    const buffer = Buffer.from(bytes);

    if (buffer.length > maxBytes) {
      throw new Error("R2 object exceeds the allowed size.");
    }

    return buffer;
  }

  throw new Error("R2 object body could not be read.");
}

async function getDisplayObjectBuffer(
  displayKey,
  { maxBytes = 12 * 1024 * 1024 } = {},
) {
  if (!displayKey) {
    throw new Error("R2 display object key is required.");
  }

  const { display } = getR2Buckets();

  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: display,
      Key: displayKey,
    }),
  );

  const declaredLength = Number(response.ContentLength || 0);

  if (declaredLength > maxBytes) {
    throw new Error("R2 display object exceeds the allowed size.");
  }

  return readObjectBodyToBuffer(response.Body, maxBytes);
}


async function getOriginalObjectStream(originalKey) {
  if (!originalKey) {
    throw new Error("R2 original object key is required.");
  }

  const { originals } = getR2Buckets();

  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: originals,
      Key: originalKey,
    }),
  );

  if (
    !response.Body ||
    typeof response.Body.pipe !== "function"
  ) {
    throw new Error("R2 original object body is not a readable stream.");
  }

  return {
    body: response.Body,
    key: originalKey,
    contentType: response.ContentType || null,
    contentLength: Number(response.ContentLength || 0) || null,
  };
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
  deleteBucketObject,
  deleteImagePair,
  getDisplayObjectBuffer,
  getOriginalObjectStream,
  isR2DisplayUrl,
  listBucketObjects,
  uploadImagePair,
};
