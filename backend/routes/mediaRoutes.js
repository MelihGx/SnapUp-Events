const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const supabase = require("../config/supabaseClient");
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuth = require("../middlewares/optionalAuth");
const { validateUploadedFiles } = require("../middlewares/fileValidation");
const { guestLimiter, uploadLimiter, likeLimiter } = require("../middlewares/security");
const { cleanText } = require("../utils/validation");
const { hashGuestToken, issueGuestToken, verifyGuestToken } = require("../services/guestAccessService");

const router = express.Router();

const MAX_MEDIA_FILES_PER_REQUEST = 15;
const MAX_MEDIA_FILE_BYTES = 50 * 1024 * 1024;
const MAX_MEDIA_REQUEST_BYTES = 200 * 1024 * 1024;
const MAX_MEDIA_MULTIPART_BYTES = MAX_MEDIA_REQUEST_BYTES + 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 5 * 60;
const MAX_VIDEO_DIMENSION = 3840;
const MEDIA_UPLOAD_DIRECTORY = path.join(os.tmpdir(), "snapup-media-uploads");

fs.mkdirSync(MEDIA_UPLOAD_DIRECTORY, { recursive: true, mode: 0o700 });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MEDIA_UPLOAD_DIRECTORY),
  filename: (_req, _file, cb) => cb(null, crypto.randomUUID()),
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_MEDIA_FILE_BYTES,
    files: MAX_MEDIA_FILES_PER_REQUEST,
    fields: 8,
    parts: MAX_MEDIA_FILES_PER_REQUEST + 8,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error(
        "Only JPG, PNG, WEBP, MP4, WEBM and MOV files are allowed.",
      );
      error.statusCode = 400;
      error.code = "UNSUPPORTED_MEDIA_TYPE";
      return cb(error);
    }

    cb(null, true);
  },
});

async function cleanupTemporaryFiles(files = []) {
  await Promise.allSettled(
    files
      .filter((file) => file?.path)
      .map((file) => fs.promises.unlink(file.path)),
  );
}

const mediaUploadFields = upload.fields([
  { name: "media", maxCount: MAX_MEDIA_FILES_PER_REQUEST },
  { name: "photo", maxCount: MAX_MEDIA_FILES_PER_REQUEST },
  { name: "video", maxCount: MAX_MEDIA_FILES_PER_REQUEST },
]);

function handleMediaUpload(req, _res, next) {
  mediaUploadFields(req, _res, async (error) => {
    if (!error) {
      return next();
    }

    const files = Object.values(req.files || {}).flat();
    await cleanupTemporaryFiles(files);

    if (error instanceof multer.MulterError) {
      error.statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

      if (error.code === "LIMIT_FILE_SIZE") {
        error.message = "Each media file must be 50 MB or smaller.";
        error.code = "MEDIA_FILE_TOO_LARGE";
      } else if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        error.message = "A maximum of 15 media files can be uploaded at once.";
        error.code = "MEDIA_FILE_LIMIT_EXCEEDED";
      }
    }

    return next(error);
  });
}

function enforceMediaRequestSize(req, res, next) {
  const contentLength = Number(req.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_MULTIPART_BYTES) {
    return res.status(413).json({
      success: false,
      message: "The selected files must be 200 MB or smaller in total.",
      code: "MEDIA_REQUEST_TOO_LARGE",
    });
  }

  return next();
}

function getMediaKindFromMime(mimetype) {
  if (mimetype.startsWith("image/")) {
    return "image";
  }

  if (mimetype.startsWith("video/")) {
    return "video";
  }

  return null;
}

async function getMediaTypeId(mediaTypeName) {
  const { data, error } = await supabase
    .from("media_type")
    .select("media_type_id")
    .eq("media_type", mediaTypeName)
    .single();

  if (error || !data) {
    throw new Error(`${mediaTypeName} media type could not be found.`);
  }

  return data.media_type_id;
}

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getUploadStatusForEvent(eventId) {
  const { data: event, error: eventError } = await supabase
    .from("event")
    .select("event_id, is_event_active")
    .eq("event_id", eventId)
    .maybeSingle();

  if (eventError) {
    throw createHttpError(eventError.message, 500);
  }

  if (!event) {
    throw createHttpError("Event not found.", 404);
  }

  if (event.is_event_active === false) {
    throw createHttpError("This event is not active.", 403);
  }

  const { data: settings, error: settingsError } = await supabase
    .from("event_settings")
    .select("allow_upload, require_approval, max_upload_per_guest, max_storage_per_guest, only_users")
    .eq("event_id", eventId)
    .maybeSingle();

  if (settingsError) {
    throw createHttpError(settingsError.message, 500);
  }

  if (settings?.allow_upload === false) {
    throw createHttpError("Uploads are disabled for this event.", 403);
  }

  return {
    mediaStatus: settings?.require_approval ? "pending" : "approved",
    maxUploadPerGuest: Number(settings?.max_upload_per_guest) || 20,
    maxStoragePerGuest: Math.min(Number(settings?.max_storage_per_guest) || 250, 2048),
    onlyUsers: settings?.only_users === true,
  };
}

async function checkGuestBelongsToEvent(eventId, guestId) {
  const { data: guest, error } = await supabase
    .from("event_guests")
    .select("guest_id, event_id")
    .eq("guest_id", guestId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    throw createHttpError(error.message, 500);
  }

  if (!guest) {
    throw createHttpError("Guest does not belong to this event.", 403);
  }

  return guest;
}

async function checkGuestUploadLimit(eventId, guestId, incomingFileCount) {
  const { maxUploadPerGuest } = await getUploadStatusForEvent(eventId);

  const { count, error } = await supabase
    .from("media")
    .select("media_id", {
      count: "exact",
      head: true,
    })
    .eq("event_id", eventId)
    .eq("guest_id", guestId);

  if (error) {
    throw createHttpError(error.message, 500);
  }

  const currentUploadCount = count || 0;
  const nextUploadCount = currentUploadCount + incomingFileCount;

  if (nextUploadCount > maxUploadPerGuest) {
    throw createHttpError(
      `Upload limit exceeded. This guest can upload maximum ${maxUploadPerGuest} item(s).`,
      400,
    );
  }
}

function uploadToCloudinary(file, eventId, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `snapup-events/${eventId}`,
        resource_type: resourceType,
        type: "authenticated",
        allowed_formats: resourceType === "image" ? ["jpg", "jpeg"] : ["mp4", "webm", "mov"],
        media_metadata: resourceType === "video",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    const input = fs.createReadStream(file.path);
    input.once("error", reject);
    input.pipe(stream);
  });
}

function validateCloudinaryVideo(result) {
  const duration = Number(result?.duration);
  const width = Number(result?.width);
  const height = Number(result?.height);
  const format = String(result?.format || "").toLowerCase();

  const isValid =
    result?.resource_type === "video" &&
    ["mp4", "webm", "mov"].includes(format) &&
    Number.isFinite(duration) &&
    duration > 0 &&
    duration <= MAX_VIDEO_DURATION_SECONDS &&
    Number.isFinite(width) &&
    width > 0 &&
    width <= MAX_VIDEO_DIMENSION &&
    Number.isFinite(height) &&
    height > 0 &&
    height <= MAX_VIDEO_DIMENSION;

  if (!isValid) {
    throw createHttpError(
      "Video must be MP4, WEBM or MOV, no longer than 5 minutes, and no larger than 4K.",
      400,
    );
  }
}

function getCloudinaryPublicId(mediaUrl) {
  if (!mediaUrl || !/\/(?:upload|authenticated)\//.test(mediaUrl)) {
    return null;
  }

  try {
    const url = new URL(mediaUrl);
    const afterUpload = url.pathname.split(/\/(?:upload|authenticated)\//)[1];

    if (!afterUpload) {
      return null;
    }

    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");

    return decodeURIComponent(withoutExtension);
  } catch (error) {
    return null;
  }
}

async function getOwnedMedia(mediaId, userId) {
  const { data: media, error: mediaError } = await supabase
    .from("media")
    .select("media_id, event_id, media_url, media_status")
    .eq("media_id", mediaId)
    .maybeSingle();

  if (mediaError) {
    throw createHttpError(mediaError.message, 500);
  }

  if (!media) {
    throw createHttpError("Media not found.", 404);
  }

  const { data: event, error: eventError } = await supabase
    .from("event")
    .select("event_id, user_id")
    .eq("event_id", media.event_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (eventError) {
    throw createHttpError(eventError.message, 500);
  }

  if (!event) {
    throw createHttpError("You do not have permission for this media.", 403);
  }

  return media;
}

router.post("/guests", guestLimiter, optionalAuth, async (req, res) => {
  try {
    const { event_id, guest_name } = req.body;

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: "event_id is required.",
      });
    }

    if (!guest_name || guest_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "guest_name is required.",
      });
    }

    const cleanGuestName = cleanText(guest_name, { min: 1, max: 80, field: "guest_name" });
    const uploadStatus = await getUploadStatusForEvent(event_id);
    if (uploadStatus.onlyUsers && !req.user?.user_id) {
      return res.status(401).json({ success: false, message: "A registered user session is required.", code: "REGISTERED_USERS_ONLY" });
    }

    const { data: existingGuests, error: existingGuestError } = await supabase
      .from("event_guests")
      .select("guest_id")
      .eq("event_id", event_id)
      .ilike("guest_name", cleanGuestName);

    if (existingGuestError) {
      return res.status(500).json({
        success: false,
        message: "Guest could not be checked.",
        error: existingGuestError.message,
      });
    }

    if (existingGuests && existingGuests.length > 0) {
      return res.status(409).json({ success: false, message: "This guest name is already in use. Choose another name.", code: "GUEST_NAME_IN_USE" });
    }

    const { data, error } = await supabase
      .from("event_guests")
      .insert({
        event_id,
        guest_name: cleanGuestName,
        user_id: req.user?.user_id || null,
      })
      .select("guest_id, event_id, guest_name, user_id")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Guest could not be created.",
        error: error.message,
      });
    }

    const guestToken = issueGuestToken({ guestId: data.guest_id, eventId: data.event_id, userId: data.user_id });
    const { error: tokenError } = await supabase
      .from("event_guests")
      .update({ guest_access_token_hash: hashGuestToken(guestToken) })
      .eq("guest_id", data.guest_id);
    if (tokenError) throw createHttpError("Guest session could not be created.", 500);

    return res.status(201).json({
      success: true,
      message: "Guest created successfully.",
      guest: { guest_id: data.guest_id, event_id: data.event_id, guest_name: data.guest_name },
      guest_access_token: guestToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Guest creation failed.",
      error: error.message,
    });
  }
});

router.post(
  "/upload",
  uploadLimiter,
  enforceMediaRequestSize,
  handleMediaUpload,
  validateUploadedFiles,
  async (req, res) => {
  const uploadedItems = [];
  const files = Object.values(req.files || {}).flat();

  try {
    const { event_id, guest_id, message } = req.body;

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: "event_id is required.",
      });
    }

    if (!guest_id) {
      return res.status(400).json({
        success: false,
        message: "guest_id is required.",
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one media file is required.",
      });
    }

    if (files.length > MAX_MEDIA_FILES_PER_REQUEST) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 15 media files can be uploaded at once.",
        code: "MEDIA_FILE_LIMIT_EXCEEDED",
      });
    }

    const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (incomingBytes > MAX_MEDIA_REQUEST_BYTES) {
      return res.status(413).json({
        success: false,
        message: "The selected files must be 200 MB or smaller in total.",
        code: "MEDIA_REQUEST_TOO_LARGE",
      });
    }

    const guestToken = String(req.get("x-guest-token") || "");
    let guestClaims;
    try { guestClaims = verifyGuestToken(guestToken); } catch (_error) {
      return res.status(401).json({ success: false, message: "Guest session is invalid or expired.", code: "INVALID_GUEST_SESSION" });
    }
    if (String(guestClaims.event_id) !== String(event_id) || String(guestClaims.guest_id) !== String(guest_id)) {
      return res.status(403).json({ success: false, message: "Guest session does not match this event.", code: "GUEST_SESSION_MISMATCH" });
    }
    const guest = await checkGuestBelongsToEvent(event_id, guest_id);
    const { data: guestSecurity } = await supabase.from("event_guests")
      .select("guest_access_token_hash, user_id").eq("guest_id", guest_id).maybeSingle();
    if (!guestSecurity || guestSecurity.guest_access_token_hash !== hashGuestToken(guestToken)) {
      return res.status(401).json({ success: false, message: "Guest session has been revoked.", code: "GUEST_SESSION_REVOKED" });
    }
    await checkGuestUploadLimit(event_id, guest_id, files.length);

    const { mediaStatus, maxStoragePerGuest, onlyUsers } = await getUploadStatusForEvent(event_id);
    if (onlyUsers && !guestSecurity.user_id) {
      return res.status(403).json({ success: false, message: "Registered users only.", code: "REGISTERED_USERS_ONLY" });
    }
    const { data: usageRows, error: usageError } = await supabase.from("media")
      .select("bytes").eq("event_id", event_id).eq("guest_id", guest_id);
    if (usageError) throw createHttpError("Storage usage could not be checked.", 500);
    const usedBytes = (usageRows || []).reduce((sum, row) => sum + Number(row.bytes || 0), 0);
    if (usedBytes + incomingBytes > maxStoragePerGuest * 1024 * 1024) {
      return res.status(413).json({ success: false, message: "Guest storage quota exceeded.", code: "GUEST_STORAGE_QUOTA_EXCEEDED" });
    }

    const cleanMessage =
      message && message.trim() !== "" ? cleanText(message, { max: 2000, field: "message" }) : null;

    for (const file of files) {
      const mediaKind = getMediaKindFromMime(file.mimetype);

      if (!mediaKind) {
        throw createHttpError("Unsupported media type.", 400);
      }

      const resourceType = mediaKind === "video" ? "video" : "image";
      const mediaTypeId = await getMediaTypeId(mediaKind);

      const cloudinaryResult = await uploadToCloudinary(
        file,
        event_id,
        resourceType,
      );

      if (mediaKind === "video") {
        try {
          validateCloudinaryVideo(cloudinaryResult);
        } catch (error) {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id, {
            resource_type: "video",
            type: cloudinaryResult.type || "authenticated",
          });
          throw error;
        }
      }

      uploadedItems.push({
        event_id,
        guest_id,
        media_type_id: mediaTypeId,
        media_url: cloudinaryResult.secure_url,
        message: cleanMessage,
        media_status: mediaStatus,
        cloudinary: {
          url: cloudinaryResult.secure_url,
          public_id: cloudinaryResult.public_id,
          resource_type: cloudinaryResult.resource_type,
          bytes: cloudinaryResult.bytes,
          format: cloudinaryResult.format,
          type: cloudinaryResult.type,
        },
      });
    }

    const mediaRows = uploadedItems.map((item) => ({
      event_id: item.event_id,
      guest_id: item.guest_id,
      media_type_id: item.media_type_id,
      media_url: item.media_url,
      message: item.message,
        media_status: item.media_status,
        bytes: item.cloudinary.bytes,
        cloudinary_public_id: item.cloudinary.public_id,
        resource_type: item.cloudinary.resource_type,
        delivery_type: item.cloudinary.type || "authenticated",
        format: item.cloudinary.format,
    }));

    const { data, error } = await supabase
      .from("media")
      .insert(mediaRows)
      .select();

    if (error) {
      await Promise.allSettled(uploadedItems.map((item) => cloudinary.uploader.destroy(
        item.cloudinary.public_id,
        { resource_type: item.cloudinary.resource_type, type: item.cloudinary.type || "authenticated" },
      )));
      return res.status(500).json({
        success: false,
        message: "Files uploaded to Cloudinary but Supabase insert failed.",
        uploaded_cloudinary: uploadedItems.map((item) => item.cloudinary),
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${data.length} media file uploaded successfully.`,
      uploaded_count: data.length,
      media: data,
      cloudinary: uploadedItems.map((item) => item.cloudinary),
    });
  } catch (error) {
    await Promise.allSettled(uploadedItems.map((item) => cloudinary.uploader.destroy(
      item.cloudinary.public_id,
      { resource_type: item.cloudinary.resource_type, type: item.cloudinary.type || "authenticated" },
    )));
    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Media upload failed.",
      code: error.code || "MEDIA_UPLOAD_FAILED",
      error: error.message,
    });
  } finally {
    await cleanupTemporaryFiles(files);
  }
  },
);

router.post("/message", uploadLimiter, async (req, res) => {
  try {
    const { event_id, guest_id, message } = req.body;

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: "event_id is required.",
      });
    }

    if (!guest_id) {
      return res.status(400).json({
        success: false,
        message: "guest_id is required.",
      });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "message is required.",
      });
    }

    const guestToken = String(req.get("x-guest-token") || "");
    let claims;
    try { claims = verifyGuestToken(guestToken); } catch (_error) {
      return res.status(401).json({ success: false, message: "Guest session is invalid or expired.", code: "INVALID_GUEST_SESSION" });
    }
    if (String(claims.event_id) !== String(event_id) || String(claims.guest_id) !== String(guest_id)) {
      return res.status(403).json({ success: false, message: "Guest session mismatch." });
    }
    const { data: guestSecurity } = await supabase.from("event_guests").select("guest_access_token_hash, user_id").eq("guest_id", guest_id).maybeSingle();
    if (!guestSecurity || guestSecurity.guest_access_token_hash !== hashGuestToken(guestToken)) {
      return res.status(401).json({ success: false, message: "Guest session has been revoked." });
    }
    await checkGuestUploadLimit(event_id, guest_id, 1);

    const { mediaStatus } = await getUploadStatusForEvent(event_id);
    const mediaTypeId = await getMediaTypeId("message");

    const { data, error } = await supabase
      .from("media")
      .insert({
        event_id,
        guest_id,
        media_type_id: mediaTypeId,
        media_url: null,
        message: cleanText(message, { min: 1, max: 2000, field: "message" }),
        media_status: mediaStatus,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Message could not be saved.",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message saved successfully.",
      media: data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: "Message save failed.",
      error: error.message,
    });
  }
});

router.post("/:mediaId/like", likeLimiter, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { like_key } = req.body;

    if (!mediaId) {
      return res.status(400).json({
        success: false,
        message: "mediaId is required.",
      });
    }

    if (!like_key || String(like_key).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "like_key is required.",
      });
    }

    const cleanLikeKey = String(like_key).trim().slice(0, 160);

    const { data: media, error: mediaError } = await supabase
      .from("events_media")
      .select("media_id, event_id, media_type, media_url, media_status")
      .eq("media_id", mediaId)
      .maybeSingle();

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Media could not be checked.",
        error: mediaError.message,
      });
    }

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found.",
      });
    }

    if (media.media_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Only approved media can be liked.",
      });
    }

    if (media.media_type !== "image" || !media.media_url) {
      return res.status(400).json({
        success: false,
        message: "Only approved images can be liked.",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select("event_id, is_event_active")
      .eq("event_id", media.event_id)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event could not be checked.",
        error: eventError.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.is_event_active === false) {
      return res.status(403).json({
        success: false,
        message: "This event is not active.",
      });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("event_settings")
      .select("allow_likes")
      .eq("event_id", media.event_id)
      .maybeSingle();

    if (settingsError) {
      return res.status(500).json({
        success: false,
        message: "Like settings could not be checked.",
        error: settingsError.message,
      });
    }

    if (settings?.allow_likes === false) {
      return res.status(403).json({
        success: false,
        message: "Likes are disabled by the event admin.",
      });
    }

    const { data: existingLike, error: existingLikeError } = await supabase
      .from("media_likes")
      .select("media_like_id")
      .eq("media_id", mediaId)
      .eq("like_key", cleanLikeKey)
      .maybeSingle();

    if (existingLikeError) {
      return res.status(500).json({
        success: false,
        message: "Like status could not be checked.",
        error: existingLikeError.message,
      });
    }

    let liked = false;

    if (existingLike) {
      const { error: unlikeError } = await supabase
        .from("media_likes")
        .delete()
        .eq("media_id", mediaId)
        .eq("like_key", cleanLikeKey);

      if (unlikeError) {
        return res.status(500).json({
          success: false,
          message: "Like could not be removed.",
          error: unlikeError.message,
        });
      }

      liked = false;
    } else {
      const { error: likeError } = await supabase.from("media_likes").insert({
        media_id: mediaId,
        like_key: cleanLikeKey,
      });

      if (likeError) {
        return res.status(500).json({
          success: false,
          message: "Like could not be saved.",
          error: likeError.message,
        });
      }

      liked = true;
    }

    const { count, error: countError } = await supabase
      .from("media_likes")
      .select("media_like_id", {
        count: "exact",
        head: true,
      })
      .eq("media_id", mediaId);

    if (countError) {
      return res.status(500).json({
        success: false,
        message: "Like count could not be loaded.",
        error: countError.message,
      });
    }

    return res.status(200).json({
      success: true,
      liked,
      likes_count: count || 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Like action failed.",
      error: error.message,
    });
  }
});

router.put(
  "/events/:eventId/approve-images",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: "eventId is required.",
        });
      }

      const { data: event, error: eventError } = await supabase
        .from("event")
        .select("event_id, user_id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();

      if (eventError) {
        return res.status(500).json({
          success: false,
          message: "Event ownership could not be checked.",
          error: eventError.message,
        });
      }

      if (!event) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission for this event.",
        });
      }

      const imageTypeId = await getMediaTypeId("image");

      const { data, error } = await supabase
        .from("media")
        .update({
          media_status: "approved",
        })
        .eq("event_id", eventId)
        .eq("media_type_id", imageTypeId)
        .neq("media_status", "approved")
        .select("media_id");

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Photos could not be approved.",
          error: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: `${data.length} photo(s) approved successfully.`,
        approved_count: data.length,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: "Approve all photos failed.",
        error: error.message,
      });
    }
  },
);

router.put("/:mediaId/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { mediaId } = req.params;
    const { media_status } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!allowedStatuses.includes(media_status)) {
      return res.status(400).json({
        success: false,
        message: "media_status must be pending, approved, or rejected.",
      });
    }

    await getOwnedMedia(mediaId, userId);

    const { data, error } = await supabase
      .from("media")
      .update({
        media_status,
      })
      .eq("media_id", mediaId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Media status could not be updated.",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media status updated successfully.",
      media: data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: "Media status update failed.",
      error: error.message,
    });
  }
});

router.delete("/:mediaId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { mediaId } = req.params;

    const media = await getOwnedMedia(mediaId, userId);

    const { error } = await supabase
      .from("media")
      .delete()
      .eq("media_id", mediaId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Media could not be deleted.",
        error: error.message,
      });
    }

    const publicId = getCloudinaryPublicId(media.media_url);

    if (publicId) {
      cloudinary.uploader
        .destroy(publicId, {
          resource_type: media.media_url.includes("/video/")
            ? "video"
            : "image",
          type: "authenticated",
        })
        .catch((error) => {
          console.error("Cloudinary delete error:", error.message);
        });
    }

    return res.status(200).json({
      success: true,
      message: "Media deleted successfully.",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: "Media delete failed.",
      error: error.message,
    });
  }
});

module.exports = router;
