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
const {
  cleanupVideoDerivatives,
  transcodeVideoForDisplay,
} = require("./videoProcessingService");

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

function sanitizeExtension(value, allowedExtensions, fallback = "bin") {
  let extension = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\./, "");

  if (extension === "jpeg") extension = "jpg";

  return allowedExtensions.includes(extension) ? extension : fallback;
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

function wrapR2VideoUploadError(error, { code, message, stage }) {
  const wrapped = new Error(message);
  wrapped.code = code;
  wrapped.statusCode = 502;
  wrapped.stage = stage;
  wrapped.cause = error;
  return wrapped;
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

async function deleteMediaAssets({ originalKey, displayKey, posterKey = null }) {
  const buckets = getR2Buckets();

  await Promise.allSettled([
    originalKey ? deleteObject(buckets.originals, originalKey) : null,
    displayKey ? deleteObject(buckets.display, displayKey) : null,
    posterKey ? deleteObject(buckets.display, posterKey) : null,
  ]);
}

async function deleteImagePair({ originalKey, displayKey, posterKey = null }) {
  return deleteMediaAssets({ originalKey, displayKey, posterKey });
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
    ["jpg", "png", "webp"],
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


async function uploadVideoBundle(file, eventId) {
  if (!file?.path) {
    throw new Error("R2 video upload requires a temporary file path.");
  }

  const buckets = getR2Buckets();
  const assetId = crypto.randomUUID();
  const originalExtension = sanitizeExtension(
    file.detectedFormat || path.extname(file.originalname),
    ["mp4", "webm", "mov"],
  );
  const objectPrefix = `events/${eventId}/media/${assetId}`;
  const originalKey = `${objectPrefix}/original.${originalExtension}`;
  const displayKey = `${objectPrefix}/display.mp4`;
  const posterKey = `${objectPrefix}/poster.webp`;
  const originalBytes = Math.max(0, Number(file.size) || 0);
  const originalContentType = String(
    file.detectedMime || file.mimetype || "application/octet-stream",
  );

  let derivatives = null;
  const uploadedKeys = [];

  try {
    derivatives = await transcodeVideoForDisplay(file);

    try {
      await putObject({
        bucket: buckets.originals,
        key: originalKey,
        body: fs.createReadStream(file.path),
        contentType: originalContentType,
        contentLength: originalBytes,
        cacheControl: "private, no-store",
        metadata: {
          event_id: String(eventId),
          asset_kind: "media_video_original",
        },
      });
      uploadedKeys.push({ bucket: buckets.originals, key: originalKey });
    } catch (error) {
      throw wrapR2VideoUploadError(error, {
        code: "R2_VIDEO_ORIGINAL_UPLOAD_FAILED",
        message: "Original video could not be stored.",
        stage: "r2-original",
      });
    }

    try {
      await putObject({
        bucket: buckets.display,
        key: displayKey,
        body: fs.createReadStream(derivatives.displayPath),
        contentType: derivatives.displayContentType,
        contentLength: derivatives.displayBytes,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          event_id: String(eventId),
          asset_kind: "media_video_display",
          source_key: originalKey,
        },
      });
      uploadedKeys.push({ bucket: buckets.display, key: displayKey });
    } catch (error) {
      throw wrapR2VideoUploadError(error, {
        code: "R2_VIDEO_DISPLAY_UPLOAD_FAILED",
        message: "Converted video could not be stored.",
        stage: "r2-display",
      });
    }

    try {
      await putObject({
        bucket: buckets.display,
        key: posterKey,
        body: fs.createReadStream(derivatives.posterPath),
        contentType: derivatives.posterContentType,
        contentLength: derivatives.posterBytes,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          event_id: String(eventId),
          asset_kind: "media_video_poster",
          source_key: originalKey,
        },
      });
      uploadedKeys.push({ bucket: buckets.display, key: posterKey });
    } catch (error) {
      throw wrapR2VideoUploadError(error, {
        code: "R2_VIDEO_POSTER_UPLOAD_FAILED",
        message: "Video poster could not be stored.",
        stage: "r2-poster",
      });
    }

    return {
      storageProvider: "r2",
      objectKind: "media",
      originalKey,
      displayKey,
      posterKey,
      displayUrl: buildDisplayUrl(displayKey),
      posterUrl: buildDisplayUrl(posterKey),
      originalBytes,
      displayBytes: derivatives.displayBytes,
      posterBytes: derivatives.posterBytes,
      originalContentType,
      displayContentType: derivatives.displayContentType,
      posterContentType: derivatives.posterContentType,
      durationSeconds: derivatives.originalMetadata.duration,
      originalWidth: derivatives.originalMetadata.width,
      originalHeight: derivatives.originalMetadata.height,
      displayWidth: derivatives.displayMetadata.width,
      displayHeight: derivatives.displayMetadata.height,
    };
  } catch (error) {
    await Promise.allSettled(
      uploadedKeys.map((item) => deleteObject(item.bucket, item.key)),
    );
    throw error;
  } finally {
    await cleanupVideoDerivatives(derivatives);
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



async function getOriginalObjectBuffer(
  originalKey,
  { maxBytes = 12 * 1024 * 1024 } = {},
) {
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

  const declaredLength = Number(response.ContentLength || 0);

  if (declaredLength > maxBytes) {
    throw new Error("R2 original object exceeds the allowed size.");
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
  deleteMediaAssets,
  getDisplayObjectBuffer,
  getOriginalObjectBuffer,
  getOriginalObjectStream,
  isR2DisplayUrl,
  listBucketObjects,
  uploadImagePair,
  uploadVideoBundle,
};
