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
const {
  validateUploadedMediaFilesPreserveOriginal,
} = require("../middlewares/fileValidation");
const { guestLimiter, uploadLimiter, likeLimiter } = require("../middlewares/security");
const { verifyTurnstile } = require("../middlewares/turnstile");
const { cleanText } = require("../utils/validation");
const {
  deleteImagePair,
  uploadImagePair,
} = require("../services/r2MediaService");
const {
  STORAGE_PROVIDERS,
  getMediaStorageProvider,
} = require("../services/storagePolicy");
const { getPackageStorageLimitBytes, normalizePackageKey } = require("../services/pricingService");
const { hashGuestToken, issueGuestToken, verifyGuestToken } = require("../services/guestAccessService");
const {
  assertRegisteredUserAccess,
} = require("../services/registeredUserAccessService");

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

function createHttpError(message, statusCode = 500, code = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

async function getUploadStatusForEvent(eventId) {
  const { data: event, error: eventError } = await supabase
    .from("event")
    .select("event_id, is_event_active, package_key, storage_consumed_bytes")
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

  const packageKey = normalizePackageKey(event.package_key || "free");

  return {
    mediaStatus: settings?.require_approval ? "pending" : "approved",
    maxUploadPerGuest: Number(settings?.max_upload_per_guest) || 20,
    maxStoragePerGuest: Math.min(Number(settings?.max_storage_per_guest) || 250, 2048),
    onlyUsers: settings?.only_users === true,
    packageKey,
    eventStorageLimitBytes: getPackageStorageLimitBytes(packageKey),
    eventStorageUsedBytes: Math.max(0, Number(event.storage_consumed_bytes) || 0),
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

async function getGuestSecurity(eventId, guestId) {
  const { data, error } = await supabase
    .from("event_guests")
    .select("guest_id, event_id, guest_name, user_id, guest_access_token_hash")
    .eq("guest_id", guestId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    throw createHttpError(error.message, 500);
  }

  return data;
}

function findGuestForSession(existingGuests, guestToken, eventId) {
  if (!guestToken) return null;

  try {
    const claims = verifyGuestToken(guestToken);
    if (String(claims.event_id) !== String(eventId)) return null;

    const guest = existingGuests.find(
      (item) =>
        String(item.guest_id) === String(claims.guest_id) &&
        item.guest_access_token_hash === hashGuestToken(guestToken),
    );

    return guest ? { guest, claims } : null;
  } catch (_error) {
    return null;
  }
}

async function refreshGuestSession(guest, userId = null) {
  const guestToken = issueGuestToken({
    guestId: guest.guest_id,
    eventId: guest.event_id,
    userId,
  });

  const { data, error } = await supabase
    .from("event_guests")
    .update({
      user_id: userId,
      guest_access_token_hash: hashGuestToken(guestToken),
    })
    .eq("guest_id", guest.guest_id)
    .eq("event_id", guest.event_id)
    .select("guest_id, event_id, guest_name, user_id")
    .single();

  if (error || !data) {
    throw createHttpError("Guest session could not be refreshed.", 500);
  }

  return { guest: data, guestToken };
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


async function cleanupUploadedItem(item) {
  if (!item) return;

  if (item.storage_provider === STORAGE_PROVIDERS.R2) {
    await deleteImagePair({
      originalKey: item.r2?.original_key,
      displayKey: item.r2?.display_key,
    });
    return;
  }

  if (item.cloudinary?.public_id) {
    await cloudinary.uploader.destroy(item.cloudinary.public_id, {
      resource_type: item.cloudinary.resource_type,
      type: item.cloudinary.type || "authenticated",
    });
  }
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
    .select("media_id, event_id, media_url, media_status, storage_provider, r2_original_key, r2_display_key")
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

router.post(
  "/guests",
  guestLimiter,
  verifyTurnstile("guest_join"),
  optionalAuth,
  async (req, res) => {
    try {
      const { event_id, guest_name } = req.body;

      if (!event_id) {
        return res.status(400).json({
          success: false,
          message: "event_id is required.",
        });
      }

      const currentUserId = req.user?.user_id || null;
      const registeredUserName = currentUserId
        ? cleanText(req.user?.user_name || "", {
            min: 1,
            max: 80,
            field: "user_name",
          })
        : null;

      if (!currentUserId && (!guest_name || guest_name.trim() === "")) {
        return res.status(400).json({
          success: false,
          message: "guest_name is required.",
        });
      }

      // Signed-in users get their account name as the default, but they may
      // edit the display name used for this event/upload.
      const requestedGuestName = String(guest_name || "").trim();
      const cleanGuestName = requestedGuestName
        ? cleanText(requestedGuestName, {
            min: 1,
            max: 80,
            field: "guest_name",
          })
        : registeredUserName;

      const uploadStatus = await getUploadStatusForEvent(event_id);

      if (uploadStatus.onlyUsers && !currentUserId) {
        return res.status(401).json({
          success: false,
          message: "A registered user session is required.",
          code: "REGISTERED_USERS_ONLY",
        });
      }

      let registeredGuest = null;

      if (currentUserId) {
        const { data, error } = await supabase
          .from("event_guests")
          .select(
            "guest_id, event_id, guest_name, user_id, guest_access_token_hash",
          )
          .eq("event_id", event_id)
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (error) {
          return res.status(500).json({
            success: false,
            message: "Registered guest could not be checked.",
            error: error.message,
          });
        }

        registeredGuest = data || null;
      }

      const { data: sameNameGuests, error: sameNameError } = await supabase
        .from("event_guests")
        .select(
          "guest_id, event_id, guest_name, user_id, guest_access_token_hash",
        )
        .eq("event_id", event_id)
        .ilike("guest_name", cleanGuestName);

      if (sameNameError) {
        return res.status(500).json({
          success: false,
          message: "Guest could not be checked.",
          error: sameNameError.message,
        });
      }

      if (registeredGuest) {
        const nameCollision = (sameNameGuests || []).find(
          (item) =>
            String(item.guest_id) !== String(registeredGuest.guest_id),
        );

        if (nameCollision) {
          return res.status(409).json({
            success: false,
            message:
              "Your registered account name is already in use in this event.",
            code: "REGISTERED_NAME_IN_USE",
          });
        }

        if (registeredGuest.guest_name !== cleanGuestName) {
          const { data: updatedGuest, error: updateError } = await supabase
            .from("event_guests")
            .update({ guest_name: cleanGuestName })
            .eq("guest_id", registeredGuest.guest_id)
            .eq("event_id", event_id)
            .eq("user_id", currentUserId)
            .select(
              "guest_id, event_id, guest_name, user_id, guest_access_token_hash",
            )
            .single();

          if (updateError || !updatedGuest) {
            return res.status(500).json({
              success: false,
              message: "Registered guest name could not be synchronized.",
              error: updateError?.message || "Updated guest could not be read.",
            });
          }

          registeredGuest = updatedGuest;
        }

        const refreshed = await refreshGuestSession(
          registeredGuest,
          currentUserId,
        );

        return res.status(200).json({
          success: true,
          message: "Registered guest session refreshed successfully.",
          guest: refreshed.guest,
          guest_access_token: refreshed.guestToken,
        });
      }

      const existingGuestToken = String(req.get("x-guest-token") || "");
      const validatedSession = findGuestForSession(
        sameNameGuests || [],
        existingGuestToken,
        event_id,
      );

      if (validatedSession?.guest) {
        if (
          validatedSession.guest.user_id &&
          currentUserId &&
          String(validatedSession.guest.user_id) !== String(currentUserId)
        ) {
          return res.status(403).json({
            success: false,
            message: "This guest session belongs to another registered user.",
            code: "REGISTERED_USER_SESSION_MISMATCH",
          });
        }

        const refreshed = await refreshGuestSession(
          validatedSession.guest,
          currentUserId || validatedSession.guest.user_id || null,
        );

        return res.status(200).json({
          success: true,
          message: "Guest session refreshed successfully.",
          guest: refreshed.guest,
          guest_access_token: refreshed.guestToken,
        });
      }

      if (sameNameGuests && sameNameGuests.length > 0) {
        return res.status(409).json({
          success: false,
          message: currentUserId
            ? "Your registered account name is already in use in this event."
            : "This guest name is already in use. Choose another name.",
          code: currentUserId
            ? "REGISTERED_NAME_IN_USE"
            : "GUEST_NAME_IN_USE",
        });
      }

      const { data, error } = await supabase
        .from("event_guests")
        .insert({
          event_id,
          guest_name: cleanGuestName,
          user_id: currentUserId,
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

      const guestToken = issueGuestToken({
        guestId: data.guest_id,
        eventId: data.event_id,
        userId: data.user_id,
      });

      const { error: tokenError } = await supabase
        .from("event_guests")
        .update({ guest_access_token_hash: hashGuestToken(guestToken) })
        .eq("guest_id", data.guest_id);

      if (tokenError) {
        throw createHttpError("Guest session could not be created.", 500);
      }

      return res.status(201).json({
        success: true,
        message: "Guest created successfully.",
        guest: {
          guest_id: data.guest_id,
          event_id: data.event_id,
          guest_name: data.guest_name,
          user_id: data.user_id,
        },
        guest_access_token: guestToken,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.statusCode && error.statusCode < 500
            ? error.message
            : "Guest creation failed.",
        code: error.code || "GUEST_CREATION_FAILED",
        error: error.message,
      });
    }
  },
);

router.post(
  "/upload",
  uploadLimiter,
  optionalAuth,
  enforceMediaRequestSize,
  handleMediaUpload,
  validateUploadedMediaFilesPreserveOriginal,
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
    await checkGuestBelongsToEvent(event_id, guest_id);
    const guestSecurity = await getGuestSecurity(event_id, guest_id);
    if (!guestSecurity || guestSecurity.guest_access_token_hash !== hashGuestToken(guestToken)) {
      return res.status(401).json({ success: false, message: "Guest session has been revoked.", code: "GUEST_SESSION_REVOKED" });
    }

    const {
      mediaStatus,
      maxStoragePerGuest,
      onlyUsers,
      packageKey,
      eventStorageLimitBytes,
      eventStorageUsedBytes,
    } = await getUploadStatusForEvent(event_id);
    assertRegisteredUserAccess({
      onlyUsers,
      currentUser: req.user,
      guestSecurity,
      guestClaims,
    });
    await checkGuestUploadLimit(event_id, guest_id, files.length);
    const { data: guestUsageRows, error: usageError } = await supabase
      .from("media")
      .select("bytes")
      .eq("event_id", event_id)
      .eq("guest_id", guest_id);

    if (usageError) {
      throw createHttpError("Storage usage could not be checked.", 500);
    }

    // Event quota is cumulative: deleting media does not return event storage quota.
    const eventUsedBytes = eventStorageUsedBytes;
    const guestUsedBytes = (guestUsageRows || []).reduce(
      (sum, row) => sum + Math.max(0, Number(row?.bytes) || 0),
      0,
    );

    if (eventUsedBytes + incomingBytes > eventStorageLimitBytes) {
      return res.status(413).json({
        success: false,
        message: "Event storage quota exceeded.",
        code: "EVENT_STORAGE_QUOTA_EXCEEDED",
        package: packageKey,
        used_bytes: eventUsedBytes,
        limit_bytes: eventStorageLimitBytes,
        remaining_bytes: Math.max(0, eventStorageLimitBytes - eventUsedBytes),
      });
    }

    if (guestUsedBytes + incomingBytes > maxStoragePerGuest * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: "Guest storage quota exceeded.",
        code: "GUEST_STORAGE_QUOTA_EXCEEDED",
      });
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

      if (mediaKind === "image") {
        const r2Result = await uploadImagePair(file, event_id);

        uploadedItems.push({
          event_id,
          guest_id,
          media_type_id: mediaTypeId,
          media_url: r2Result.displayUrl,
          message: cleanMessage,
          media_status: mediaStatus,
          storage_provider: getMediaStorageProvider("image"),
          bytes: r2Result.originalBytes,
          r2: {
            original_key: r2Result.originalKey,
            display_key: r2Result.displayKey,
            original_bytes: r2Result.originalBytes,
            display_bytes: r2Result.displayBytes,
            original_mime_type: r2Result.originalContentType,
            display_mime_type: r2Result.displayContentType,
          },
          cloudinary: null,
        });

        continue;
      }

      // Phase 1 keeps video transcoding/playback on Cloudinary.
      const cloudinaryResult = await uploadToCloudinary(
        file,
        event_id,
        resourceType,
      );

      try {
        validateCloudinaryVideo(cloudinaryResult);
      } catch (error) {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id, {
          resource_type: "video",
          type: cloudinaryResult.type || "authenticated",
        });
        throw error;
      }

      uploadedItems.push({
        event_id,
        guest_id,
        media_type_id: mediaTypeId,
        media_url: cloudinaryResult.secure_url,
        message: cleanMessage,
        media_status: mediaStatus,
        storage_provider: getMediaStorageProvider("video"),
        bytes: cloudinaryResult.bytes,
        r2: null,
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
      bytes: Math.max(0, Number(item.bytes) || 0),
      storage_provider: item.storage_provider,
      r2_original_key: item.r2?.original_key || null,
      r2_display_key: item.r2?.display_key || null,
      original_bytes: item.r2?.original_bytes || item.cloudinary?.bytes || null,
      display_bytes: item.r2?.display_bytes || null,
      original_mime_type: item.r2?.original_mime_type || null,
      display_mime_type: item.r2?.display_mime_type || null,
      cloudinary_public_id: item.cloudinary?.public_id || null,
      // These columns predate R2. delivery_type is NOT NULL in the current
      // database schema, so R2 rows must not explicitly insert NULL here.
      resource_type: item.cloudinary?.resource_type || (item.storage_provider === STORAGE_PROVIDERS.R2 ? "image" : null),
      delivery_type: item.cloudinary?.type || (item.storage_provider === STORAGE_PROVIDERS.R2 ? "authenticated" : "authenticated"),
      format: item.cloudinary?.format || (item.storage_provider === STORAGE_PROVIDERS.R2 ? "webp" : null),
    }));

    const { data, error } = await supabase
      .from("media")
      .insert(mediaRows)
      .select();

    if (error) {
      await Promise.allSettled(
        uploadedItems.map((item) => cleanupUploadedItem(item)),
      );
      return res.status(500).json({
        success: false,
        message: "Media storage upload succeeded but the database insert failed.",
        uploaded_storage_assets: uploadedItems.map((item) => ({
          provider: item.storage_provider,
          original_key: item.r2?.original_key || null,
          display_key: item.r2?.display_key || null,
          cloudinary_public_id: item.cloudinary?.public_id || null,
        })),
        error: error.message,
      });
    }

    const consumedBytes = (data || []).reduce(
      (sum, row) => sum + Math.max(0, Number(row?.bytes) || 0),
      0,
    );

    if (consumedBytes > 0) {
      const { error: storageCounterError } = await supabase.rpc(
        "increment_event_storage_consumed",
        {
          p_event_id: event_id,
          p_bytes: Math.round(consumedBytes),
        },
      );

      if (storageCounterError) {
        const insertedMediaIds = (data || []).map((row) => row.media_id).filter(Boolean);
        if (insertedMediaIds.length > 0) {
          const { error: rollbackError } = await supabase
            .from("media")
            .delete()
            .in("media_id", insertedMediaIds);

          if (rollbackError) {
            console.error("Media rollback error after storage counter failure:", rollbackError.message);
          }
        }

        throw createHttpError(
          "Event storage usage could not be recorded.",
          500,
          "EVENT_STORAGE_COUNTER_FAILED",
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: `${data.length} media file uploaded successfully.`,
      uploaded_count: data.length,
      media: data,
      storage_assets: uploadedItems.map((item) => ({
        provider: item.storage_provider,
        original_key: item.r2?.original_key || null,
        display_key: item.r2?.display_key || null,
        cloudinary_public_id: item.cloudinary?.public_id || null,
      })),
    });
  } catch (error) {
    await Promise.allSettled(
      uploadedItems.map((item) => cleanupUploadedItem(item)),
    );
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

router.post("/message", uploadLimiter, optionalAuth, async (req, res) => {
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
    const guestSecurity = await getGuestSecurity(event_id, guest_id);
    if (!guestSecurity || guestSecurity.guest_access_token_hash !== hashGuestToken(guestToken)) {
      return res.status(401).json({ success: false, message: "Guest session has been revoked.", code: "GUEST_SESSION_REVOKED" });
    }

    const { mediaStatus, onlyUsers } = await getUploadStatusForEvent(event_id);
    assertRegisteredUserAccess({
      onlyUsers,
      currentUser: req.user,
      guestSecurity,
      guestClaims: claims,
    });
    await checkGuestUploadLimit(event_id, guest_id, 1);
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
        storage_provider: getMediaStorageProvider("message"),
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
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Message save failed.",
      code: error.code || "MESSAGE_SAVE_FAILED",
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

    if (
      media.storage_provider === STORAGE_PROVIDERS.R2 &&
      (media.r2_original_key || media.r2_display_key)
    ) {
      deleteImagePair({
        originalKey: media.r2_original_key,
        displayKey: media.r2_display_key,
      }).catch((error) => {
        console.error("R2 media delete error:", error.message);
      });
    } else {
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
