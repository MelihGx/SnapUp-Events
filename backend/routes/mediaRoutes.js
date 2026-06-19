const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const supabase = require("../config/supabaseClient");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

const storage = multer.memoryStorage();

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
    fileSize: 100 * 1024 * 1024,
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, WEBP, MP4, WEBM and MOV files are allowed."),
      );
    }

    cb(null, true);
  },
});

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
    .select("allow_upload, require_approval, max_upload_per_guest")
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

function uploadToCloudinary(fileBuffer, eventId, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `snapup-events/${eventId}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
}

function getCloudinaryPublicId(mediaUrl) {
  if (!mediaUrl || !mediaUrl.includes("/upload/")) {
    return null;
  }

  try {
    const url = new URL(mediaUrl);
    const afterUpload = url.pathname.split("/upload/")[1];

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

router.post("/guests", async (req, res) => {
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

    const { data, error } = await supabase
      .from("event_guests")
      .insert({
        event_id,
        guest_name: guest_name.trim(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Guest could not be created.",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Guest created successfully.",
      guest: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Guest creation failed.",
      error: error.message,
    });
  }
});

router.post("/upload", upload.any(), async (req, res) => {
  try {
    const { event_id, guest_id, message } = req.body;

    const files =
      req.files?.filter((item) =>
        ["media", "photo", "video"].includes(item.fieldname),
      ) || [];

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

    await checkGuestBelongsToEvent(event_id, guest_id);
    await checkGuestUploadLimit(event_id, guest_id, files.length);

    const { mediaStatus } = await getUploadStatusForEvent(event_id);

    const cleanMessage =
      message && message.trim() !== "" ? message.trim() : null;

    const uploadedItems = [];

    for (const file of files) {
      const mediaKind = getMediaKindFromMime(file.mimetype);

      if (!mediaKind) {
        return res.status(400).json({
          success: false,
          message: "Unsupported media type.",
        });
      }

      const resourceType = mediaKind === "video" ? "video" : "image";

      const cloudinaryResult = await uploadToCloudinary(
        file.buffer,
        event_id,
        resourceType,
      );

      const mediaTypeId = await getMediaTypeId(mediaKind);

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
    }));

    const { data, error } = await supabase
      .from("media")
      .insert(mediaRows)
      .select();

    if (error) {
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: "Media upload failed.",
      error: error.message,
    });
  }
});

router.post("/message", async (req, res) => {
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

    await checkGuestBelongsToEvent(event_id, guest_id);
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
        message: message.trim(),
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

router.post("/:mediaId/like", async (req, res) => {
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
