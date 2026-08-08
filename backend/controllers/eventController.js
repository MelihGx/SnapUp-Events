const supabase = require("../config/supabaseClient");
const QRCode = require("qrcode");
const { signedDeliveryUrl } = require("../services/cloudinaryDelivery");
const { generateEventCode } = require("../utils/eventCode");
const cloudinary = require("../config/cloudinary");
const {
  MemoryBookPdfError,
  buildEventMemoryBookPdf,
  createMemoryBookFileName,
} = require("../services/eventMemoryBookPdf");

function cleanOptionalText(value, maxLength) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function normalizeEventCoordinates(latitudeValue, longitudeValue) {
  const latitudeMissing =
    latitudeValue === null ||
    latitudeValue === undefined ||
    latitudeValue === "";
  const longitudeMissing =
    longitudeValue === null ||
    longitudeValue === undefined ||
    longitudeValue === "";

  if (latitudeMissing && longitudeMissing) {
    return {
      latitude: null,
      longitude: null,
      error: null,
    };
  }

  if (latitudeMissing || longitudeMissing) {
    return {
      latitude: null,
      longitude: null,
      error: "Harita konumu için enlem ve boylam birlikte gönderilmelidir.",
    };
  }

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      latitude: null,
      longitude: null,
      error: "Seçilen harita konumu geçersiz.",
    };
  }

  return {
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
    error: null,
  };
}

async function createQrCodeUrl(eventCode) {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://127.0.0.1:5500/frontend"
  ).replace(/\/$/, "");

  const joinUrl = `${frontendUrl}/index.html?code=${encodeURIComponent(
    eventCode,
  )}`;

  return QRCode.toDataURL(joinUrl, { width: 260, margin: 1, errorCorrectionLevel: "M" });
}

async function generateUniqueEventCode() {
  let eventCode = generateEventCode();

  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("event")
      .select("event_id")
      .eq("event_code", eventCode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return eventCode;
    }

    eventCode = generateEventCode();
  }

  throw new Error("Benzersiz event kodu oluşturulamadı.");
}

async function getPacketLevelId(packageName) {
  let packetName = "Free";

  if (packageName === "standard" || packageName === "plus") {
    packetName = "Plus";
  }

  if (packageName === "premium") {
    packetName = "Premium";
  }

  const { data, error } = await supabase
    .from("packet_level")
    .select("packet_level_id, packet_name")
    .eq("packet_name", packetName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Paket seviyesi bulunamadı.");
  }

  return data.packet_level_id;
}

function uploadEventCover(fileBuffer, eventCode) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "snapup-events/event-covers",
        public_id: `${eventCode.toLowerCase()}-${Date.now()}`,
        resource_type: "image",
        type: "authenticated",
        allowed_formats: ["jpg", "jpeg"],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
}

async function deleteEventCover(publicId, deliveryType = "authenticated") {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: deliveryType,
      invalidate: true,
    });
  } catch (error) {
    console.error("Event cover cleanup failed:", error.message);
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
    return decodeURIComponent(withoutVersion.replace(/\.[^/.]+$/, ""));
  } catch (error) {
    return null;
  }
}

function getCloudinaryDeliveryType(mediaUrl) {
  return /\/(?:image|video)\/upload\//.test(String(mediaUrl || ""))
    ? "upload"
    : "authenticated";
}

const createEvent = async (req, res) => {
  let uploadedCoverPublicId = null;
  let createdEventId = null;

  try {
    const userId = req.user.user_id;

    const { data: eventOwner, error: eventOwnerError } = await supabase
      .from("users")
      .select("user_id, is_user_active, is_email_verified")
      .eq("user_id", userId)
      .maybeSingle();

    if (eventOwnerError) {
      return res.status(500).json({
        success: false,
        message: "Kullanıcı doğrulama durumu kontrol edilemedi.",
        error: eventOwnerError.message,
      });
    }

    if (!eventOwner || !eventOwner.is_user_active) {
      return res.status(403).json({
        success: false,
        message: "Bu kullanıcı hesabı aktif değil.",
        code: "USER_NOT_ACTIVE",
      });
    }

    if (!eventOwner.is_email_verified) {
      return res.status(403).json({
        success: false,
        message: "Etkinlik oluşturmak için e-posta adresinizi doğrulayın.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    let requestBody = req.body || {};

    if (typeof requestBody.payload === "string") {
      try {
        requestBody = JSON.parse(requestBody.payload);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Event bilgileri geçersiz.",
          code: "INVALID_EVENT_PAYLOAD",
        });
      }
    }

    const {
      eventName,
      event_name,
      event_location,
      event_address,
      event_latitude,
      event_longitude,
      event_date,
      event_start_time,
      event_finish_time,
      description,
      eventPackage,
      packageName,
      settings,
    } = requestBody;

    const finalEventName = event_name || eventName;

    if (!finalEventName || finalEventName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Event adı zorunludur.",
      });
    }

    const coordinates = normalizeEventCoordinates(
      event_latitude,
      event_longitude,
    );

    if (coordinates.error) {
      return res.status(400).json({
        success: false,
        message: coordinates.error,
        code: "INVALID_EVENT_COORDINATES",
      });
    }

    const selectedPackage = eventPackage || packageName || "starter";
    const packetLevelId = await getPacketLevelId(selectedPackage);

    const eventCode = await generateUniqueEventCode();
    const qrCodeUrl = await createQrCodeUrl(eventCode);
    let eventCoverUrl = null;

    if (req.file) {
      const uploadedCover = await uploadEventCover(
        req.file.buffer,
        eventCode,
      );
      uploadedCoverPublicId = uploadedCover.public_id;
      eventCoverUrl = uploadedCover.secure_url;
    }

    const { data: newEvent, error: eventError } = await supabase
      .from("event")
      .insert([
        {
          event_name: finalEventName.trim(),
          event_location: cleanOptionalText(event_location, 160),
          event_address: cleanOptionalText(event_address, 500),
          event_latitude: coordinates.latitude,
          event_longitude: coordinates.longitude,
          user_id: userId,
          packet_level_id: packetLevelId,
          event_date: event_date || null,
          event_start_time: event_start_time || null,
          event_finish_time: event_finish_time || null,
          event_code: eventCode,
          qr_code_url: qrCodeUrl,
          event_cover_url: eventCoverUrl,
          description: description || null,
          is_event_active: true,
          is_event_private: true,
        },
      ])
      .select(
        "event_id, event_name, event_location, event_address, event_latitude, event_longitude, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description, event_cover_url",
      )
      .single();

    if (eventError) {
      await deleteEventCover(uploadedCoverPublicId);
      uploadedCoverPublicId = null;

      return res.status(500).json({
        success: false,
        message: "Event oluşturulurken hata oluştu.",
        error: eventError.message,
      });
    }

    createdEventId = newEvent.event_id;
    const eventSettings = settings || {};

    const { error: settingsError } = await supabase
      .from("event_settings")
      .insert([
        {
          event_id: newEvent.event_id,
          allow_upload: eventSettings.allow_upload ?? true,
          only_users: eventSettings.only_users ?? false,
          allow_comments: eventSettings.allow_comments ?? true,
          allow_likes: eventSettings.allow_likes ?? true,
          require_approval: eventSettings.require_approval ?? false,
          allow_gallery_view: eventSettings.allow_gallery_view ?? true,
          max_storage_per_guest: eventSettings.max_storage_per_guest ?? 500,
          max_upload_per_guest: eventSettings.max_upload_per_guest ?? 20,
        },
      ]);

    if (settingsError) {
      await supabase.from("event").delete().eq("event_id", newEvent.event_id);
      await deleteEventCover(uploadedCoverPublicId);
      uploadedCoverPublicId = null;
      createdEventId = null;

      return res.status(500).json({
        success: false,
        message: "Event ayarları oluşturulurken hata oluştu.",
        error: settingsError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Event başarıyla oluşturuldu.",
      event: newEvent,
    });
  } catch (error) {
    if (createdEventId) {
      await supabase.from("event").delete().eq("event_id", createdEventId);
    }

    await deleteEventCover(uploadedCoverPublicId);

    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const getEventByCode = async (req, res) => {
  try {
    const eventCode = req.params.eventCode?.trim().toUpperCase();

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event kodu zorunludur.",
      });
    }

    const { data: event, error } = await supabase
      .from("event")
      .select(
        "event_id, event_name, event_location, event_address, event_latitude, event_longitude, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description, event_cover_url",
      )
      .eq("event_code", eventCode)
      .eq("is_event_active", true)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Event aranırken hata oluştu.",
        error: error.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event bulunamadı.",
      });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("event_settings")
      .select("allow_gallery_view")
      .eq("event_id", event.event_id)
      .maybeSingle();

    if (settingsError) {
      return res.status(500).json({
        success: false,
        message: "Event ayarları alınırken hata oluştu.",
        error: settingsError.message,
      });
    }

    const eventWithSettings = {
      ...event,
      allow_gallery_view: settings?.allow_gallery_view !== false,
    };

    return res.status(200).json({
      success: true,
      event: eventWithSettings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const getEventDetail = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID zorunludur.",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select(
        "event_id, event_name, event_location, event_address, event_latitude, event_longitude, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description, event_cover_url, user_id",
      )
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event bilgisi alınırken hata oluştu.",
        error: eventError.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event bulunamadı veya bu evente erişim yetkin yok.",
      });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("event_settings")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (settingsError) {
      return res.status(500).json({
        success: false,
        message: "Event ayarları alınırken hata oluştu.",
        error: settingsError.message,
      });
    }

    const { data: media, error: mediaError } = await supabase
      .from("events_media")
      .select("*")
      .eq("event_id", eventId);

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Event medyaları alınırken hata oluştu.",
        error: mediaError.message,
      });
    }

    return res.status(200).json({
      success: true,
      event,
      settings: {
        ...(settings || {}),
        is_event_active: event.is_event_active !== false,
      },
      media: media || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const updateEventCover = async (req, res) => {
  let uploadedCoverPublicId = null;

  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID zorunludur.",
        code: "EVENT_ID_REQUIRED",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Yeni etkinlik fotoğrafı zorunludur.",
        code: "EVENT_COVER_REQUIRED",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select("event_id, event_code, event_cover_url, user_id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event kontrol edilirken hata oluştu.",
        error: eventError.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event bulunamadı veya fotoğrafı değiştirme yetkin yok.",
        code: "EVENT_NOT_FOUND_OR_FORBIDDEN",
      });
    }

    const uploadedCover = await uploadEventCover(
      req.file.buffer,
      event.event_code,
    );
    uploadedCoverPublicId = uploadedCover.public_id;

    const { data: updatedEvent, error: updateError } = await supabase
      .from("event")
      .update({ event_cover_url: uploadedCover.secure_url })
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .select("event_id, event_code, event_cover_url")
      .single();

    if (updateError || !updatedEvent) {
      await deleteEventCover(uploadedCoverPublicId);
      uploadedCoverPublicId = null;

      return res.status(500).json({
        success: false,
        message: "Etkinlik fotoğrafı güncellenemedi.",
        error: updateError?.message || "Güncellenen event alınamadı.",
      });
    }

    uploadedCoverPublicId = null;
    await deleteEventCover(
      getCloudinaryPublicId(event.event_cover_url),
      getCloudinaryDeliveryType(event.event_cover_url),
    );

    return res.status(200).json({
      success: true,
      message: "Etkinlik fotoğrafı başarıyla güncellendi.",
      event: updatedEvent,
    });
  } catch (error) {
    await deleteEventCover(uploadedCoverPublicId);

    return res.status(500).json({
      success: false,
      message: "Etkinlik fotoğrafı güncellenemedi.",
      error: error.message,
    });
  }
};

const removeEventCover = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID zorunludur.",
        code: "EVENT_ID_REQUIRED",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select("event_id, event_code, event_cover_url, user_id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event kontrol edilirken hata oluştu.",
        error: eventError.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event bulunamadı veya fotoğrafı kaldırma yetkin yok.",
        code: "EVENT_NOT_FOUND_OR_FORBIDDEN",
      });
    }

    if (!event.event_cover_url) {
      return res.status(200).json({
        success: true,
        message: "Etkinlikte kaldırılacak bir fotoğraf bulunmuyor.",
        event: {
          event_id: event.event_id,
          event_code: event.event_code,
          event_cover_url: null,
        },
      });
    }

    const previousCoverPublicId = getCloudinaryPublicId(
      event.event_cover_url,
    );
    const { data: updatedEvent, error: updateError } = await supabase
      .from("event")
      .update({ event_cover_url: null })
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .select("event_id, event_code, event_cover_url")
      .single();

    if (updateError || !updatedEvent) {
      return res.status(500).json({
        success: false,
        message: "Etkinlik fotoğrafı kaldırılamadı.",
        error: updateError?.message || "Güncellenen event alınamadı.",
      });
    }

    await deleteEventCover(
      previousCoverPublicId,
      getCloudinaryDeliveryType(event.event_cover_url),
    );

    return res.status(200).json({
      success: true,
      message: "Etkinlik fotoğrafı başarıyla kaldırıldı.",
      event: updatedEvent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Etkinlik fotoğrafı kaldırılamadı.",
      error: error.message,
    });
  }
};

const updateEventLocation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;
    const {
      event_location,
      event_address,
      event_latitude,
      event_longitude,
    } = req.body || {};

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID zorunludur.",
        code: "EVENT_ID_REQUIRED",
      });
    }

    const coordinates = normalizeEventCoordinates(
      event_latitude,
      event_longitude,
    );

    if (coordinates.error) {
      return res.status(400).json({
        success: false,
        message: coordinates.error,
        code: "INVALID_EVENT_COORDINATES",
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
        message: "Event kontrol edilirken hata oluştu.",
        error: eventError.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event bulunamadı veya konumu değiştirme yetkin yok.",
        code: "EVENT_NOT_FOUND_OR_FORBIDDEN",
      });
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from("event")
      .update({
        event_location: cleanOptionalText(event_location, 160),
        event_address: cleanOptionalText(event_address, 500),
        event_latitude: coordinates.latitude,
        event_longitude: coordinates.longitude,
      })
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .select(
        "event_id, event_location, event_address, event_latitude, event_longitude",
      )
      .single();

    if (updateError || !updatedEvent) {
      return res.status(500).json({
        success: false,
        message: "Etkinlik konumu güncellenemedi.",
        error: updateError?.message || "Güncellenen event alınamadı.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Etkinlik konumu başarıyla güncellendi.",
      event: updatedEvent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Etkinlik konumu güncellenemedi.",
      error: error.message,
    });
  }
};

const updateEventSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;

    const {
      allow_upload,
      only_users,
      allow_comments,
      allow_likes,
      require_approval,
      allow_gallery_view,
      is_event_active,
      max_storage_per_guest,
      max_upload_per_guest,
    } = req.body;

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select("event_id, user_id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event kontrol edilirken hata oluştu.",
        error: eventError.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event bulunamadı veya bu evente erişim yetkin yok.",
      });
    }

    const nextActiveState = is_event_active !== false;

    const { error: activeStateError } = await supabase
      .from("event")
      .update({ is_event_active: nextActiveState })
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (activeStateError) {
      return res.status(500).json({
        success: false,
        message: "Event aktiflik durumu güncellenemedi.",
        error: activeStateError.message,
      });
    }

    const settingsPayload = {
      event_id: eventId,
      allow_upload: allow_upload ?? true,
      only_users: only_users ?? false,
      allow_comments: allow_comments ?? true,
      allow_likes: allow_likes ?? true,
      require_approval: require_approval ?? false,
      allow_gallery_view: allow_gallery_view !== false,
      max_storage_per_guest: Number(max_storage_per_guest) || 500,
      max_upload_per_guest: Number(max_upload_per_guest) || 20,
      settings_updated_at: new Date().toISOString(),
    };

    const { data: updatedSettings, error: settingsError } = await supabase
      .from("event_settings")
      .upsert(settingsPayload, {
        onConflict: "event_id",
      })
      .select("*")
      .single();

    if (settingsError) {
      return res.status(500).json({
        success: false,
        message: "Event ayarları güncellenirken hata oluştu.",
        error: settingsError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event ayarları güncellendi.",
      settings: {
        ...updatedSettings,
        is_event_active: nextActiveState,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select("event_id, user_id, event_cover_url")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event kontrol edilirken hata oluştu.",
        error: eventError.message,
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event bulunamadı veya bu eventi silme yetkin yok.",
      });
    }

    const { error: deleteError } = await supabase
      .from("event")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: "Event silinirken hata oluştu.",
        error: deleteError.message,
      });
    }

    await deleteEventCover(
      getCloudinaryPublicId(event.event_cover_url),
      getCloudinaryDeliveryType(event.event_cover_url),
    );

    return res.status(200).json({
      success: true,
      message: "Event başarıyla silindi.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

async function getEventGuests(req, res) {
  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;

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
        message: "You do not have permission to view guests for this event.",
      });
    }

    const { data: guests, error: guestsError } = await supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", eventId)
      .order("guest_name", { ascending: true });

    if (guestsError) {
      return res.status(500).json({
        success: false,
        message: "Guests could not be loaded.",
        error: guestsError.message,
      });
    }

    const { data: media, error: mediaError } = await supabase
      .from("media")
      .select("guest_id, media_status")
      .eq("event_id", eventId);

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Guest media counts could not be loaded.",
        error: mediaError.message,
      });
    }

    const guestNameMap = new Map();

    (guests || []).forEach((guest) => {
      const normalizedName = String(guest.guest_name || "")
        .trim()
        .toLowerCase();

      if (!normalizedName) {
        return;
      }

      if (!guestNameMap.has(normalizedName)) {
        guestNameMap.set(normalizedName, {
          ...guest,
          duplicate_guest_ids: [guest.guest_id],
          total_uploads: 0,
          pending_uploads: 0,
          approved_uploads: 0,
          rejected_uploads: 0,
        });

        return;
      }

      const existingGuest = guestNameMap.get(normalizedName);

      existingGuest.duplicate_guest_ids.push(guest.guest_id);
    });

    const groupedGuests = Array.from(guestNameMap.values()).map((guest) => {
      const guestMedia = (media || []).filter((item) =>
        guest.duplicate_guest_ids.includes(item.guest_id),
      );

      return {
        ...guest,
        total_uploads: guestMedia.length,
        pending_uploads: guestMedia.filter(
          (item) => item.media_status === "pending",
        ).length,
        approved_uploads: guestMedia.filter(
          (item) => item.media_status === "approved",
        ).length,
        rejected_uploads: guestMedia.filter(
          (item) => item.media_status === "rejected",
        ).length,
      };
    });

    groupedGuests.sort((a, b) =>
      String(a.guest_name || "").localeCompare(
        String(b.guest_name || ""),
        "tr",
      ),
    );

    return res.status(200).json({
      success: true,
      guests: groupedGuests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Guests loading failed.",
      error: error.message,
    });
  }
}

async function getPublicEventGallery(req, res) {
  try {
    const eventCode = req.params.eventCode?.trim().toUpperCase();
    const likeKey = req.query.like_key ? String(req.query.like_key).trim() : "";

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required.",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select(
        `
        event_id,
        event_name,
        event_location,
        event_address,
        event_latitude,
        event_longitude,
        event_date,
        event_start_time,
        event_finish_time,
        event_code,
        description,
        event_cover_url,
        is_event_active
      `,
      )
      .eq("event_code", eventCode)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event could not be loaded.",
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
      .select("allow_gallery_view, allow_likes")
      .eq("event_id", event.event_id)
      .maybeSingle();

    if (settingsError) {
      return res.status(500).json({
        success: false,
        message: "Gallery settings could not be loaded.",
        error: settingsError.message,
      });
    }

    if (settings?.allow_gallery_view === false) {
      return res.status(403).json({
        success: false,
        message: "Gallery access is disabled by the event admin.",
      });
    }

    const { data: guests, error: guestsError } = await supabase
      .from("event_guests")
      .select("guest_id, guest_name")
      .eq("event_id", event.event_id)
      .order("guest_name", { ascending: true });

    if (guestsError) {
      return res.status(500).json({
        success: false,
        message: "Guests could not be loaded.",
        error: guestsError.message,
      });
    }

    const { data: media, error: mediaError } = await supabase
      .from("events_media")
      .select(
        `
        media_id,
        event_id,
        guest_id,
        guest_name,
        media_type,
        media_url,
        message,
        media_status,
        media_created_at
      `,
      )
      .eq("event_id", event.event_id)
      .eq("media_status", "approved")
      .in("media_type", ["image", "video", "message"])
      .order("media_created_at", { ascending: false });

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Approved gallery could not be loaded.",
        error: mediaError.message,
      });
    }

    const galleryItems = media || [];
    const mediaList = galleryItems.filter(
      (item) =>
        ["image", "video"].includes(item.media_type) && Boolean(item.media_url),
    );
    const messageList = galleryItems.filter(
      (item) =>
        item.media_type === "message" &&
        typeof item.message === "string" &&
        item.message.trim() !== "",
    );
    const mediaIds = mediaList.map((item) => item.media_id);

    let likes = [];

    if (mediaIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from("media_likes")
        .select("media_id, like_key")
        .in("media_id", mediaIds);

      if (likesError) {
        return res.status(500).json({
          success: false,
          message: "Like counts could not be loaded.",
          error: likesError.message,
        });
      }

      likes = likesData || [];
    }

    const likesCountByMediaId = new Map();
    const likedByCurrentVisitor = new Set();

    likes.forEach((like) => {
      likesCountByMediaId.set(
        like.media_id,
        (likesCountByMediaId.get(like.media_id) || 0) + 1,
      );

      if (likeKey && like.like_key === likeKey) {
        likedByCurrentVisitor.add(like.media_id);
      }
    });

    const mediaWithLikes = mediaList.map((item) => ({
      ...item,
      likes_count: likesCountByMediaId.get(item.media_id) || 0,
      user_liked: likedByCurrentVisitor.has(item.media_id),
    }));

    return res.status(200).json({
      success: true,
      event,
      settings: {
        allow_likes: settings?.allow_likes !== false,
      },
      guests: guests || [],
      media: mediaWithLikes,
      messages: messageList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Public gallery loading failed.",
      error: error.message,
    });
  }
}

async function getApprovedEventImages(eventId) {
  return supabase
    .from("events_media")
    .select(
      `
      media_id,
      guest_name,
      media_type,
      media_url,
      message,
      media_status,
      media_created_at
    `,
    )
    .eq("event_id", eventId)
    .eq("media_status", "approved")
    .eq("media_type", "image")
    .not("media_url", "is", null)
    .order("media_created_at", { ascending: true });
}

function getValidApprovedImages(media) {
  return (media || []).filter(
    (item) =>
      item &&
      item.media_url &&
      item.media_status === "approved" &&
      item.media_type === "image",
  ).map((item) => ({ ...item, media_url: signedDeliveryUrl(item.media_url) }));
}

function encodeDownloadFileName(fileName) {
  return encodeURIComponent(fileName);
}

async function buildAndSendMemoryBook(res, event, media) {
  const validImages = getValidApprovedImages(media);

  if (validImages.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No approved photos are available for the Memory Book.",
    });
  }

  const { buffer, includedCount, skippedCount } =
    await buildEventMemoryBookPdf({
      event: {
        ...event,
        event_cover_url: signedDeliveryUrl(event.event_cover_url),
      },
      media: validImages,
      logger: console,
    });

  const fileName = createMemoryBookFileName(event);
  const encodedFileName = encodeDownloadFileName(fileName);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
  );
  res.setHeader("Content-Length", String(buffer.length));
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-SnapUp-PDF-Engine", "memory-book-v3");
  res.setHeader("X-SnapUp-PDF-Design", "editorial-album-v3");
  res.setHeader("X-Memory-Book-Photos", String(includedCount));
  res.setHeader("X-Memory-Book-Skipped", String(skippedCount));

  return res.status(200).send(buffer);
}

function handleMemoryBookError(res, error) {
  console.error("Memory Book PDF error:", error);

  if (error instanceof MemoryBookPdfError) {
    const statusCode = error.code === "NO_RENDERABLE_IMAGES" ? 422 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        error.code === "NO_RENDERABLE_IMAGES"
          ? "Approved photos exist, but none could be prepared for the PDF."
          : "Memory Book resources are incomplete.",
      error: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "The Memory Book PDF could not be generated.",
    error: error.message,
  });
}

async function downloadEventMemoryBookV3(req, res) {
  try {
    const userId = req.user.user_id;
    const { eventId } = req.params;

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select(
        `
        event_id,
        event_name,
        event_location,
        event_address,
        event_latitude,
        event_longitude,
        event_date,
        event_start_time,
        event_finish_time,
        event_code,
        description,
        event_cover_url,
        user_id
      `,
      )
      .eq("event_id", eventId)
      .eq("user_id", userId)
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
        message: "Event not found or you do not have permission.",
      });
    }

    const { data: media, error: mediaError } =
      await getApprovedEventImages(eventId);

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Approved photos could not be loaded.",
        error: mediaError.message,
      });
    }

    return await buildAndSendMemoryBook(res, event, media);
  } catch (error) {
    return handleMemoryBookError(res, error);
  }
}

async function downloadPublicMemoryBook(req, res) {
  try {
    const eventCode = req.params.eventCode?.trim().toUpperCase();

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required.",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select(
        `
        event_id,
        event_name,
        event_location,
        event_address,
        event_latitude,
        event_longitude,
        event_date,
        event_start_time,
        event_finish_time,
        event_code,
        description,
        event_cover_url,
        is_event_active
      `,
      )
      .eq("event_code", eventCode)
      .maybeSingle();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event could not be loaded.",
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
      .select("allow_gallery_view")
      .eq("event_id", event.event_id)
      .maybeSingle();

    if (settingsError) {
      return res.status(500).json({
        success: false,
        message: "Gallery settings could not be loaded.",
        error: settingsError.message,
      });
    }

    if (settings?.allow_gallery_view === false) {
      return res.status(403).json({
        success: false,
        message: "Gallery access is disabled by the event admin.",
      });
    }

    const { data: media, error: mediaError } =
      await getApprovedEventImages(event.event_id);

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Approved photos could not be loaded.",
        error: mediaError.message,
      });
    }

    return await buildAndSendMemoryBook(res, event, media);
  } catch (error) {
    return handleMemoryBookError(res, error);
  }
}

module.exports = {
  createEvent,
  getEventByCode,
  getEventDetail,
  updateEventCover,
  removeEventCover,
  updateEventLocation,
  updateEventSettings,
  deleteEvent,
  getEventGuests,
  getPublicEventGallery,
  downloadEventMemoryBookV3,
  downloadPublicMemoryBook,
};
