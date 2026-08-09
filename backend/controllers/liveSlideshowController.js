const supabase = require("../config/supabaseClient");
const { signedDeliveryUrl } = require("../services/cloudinaryDelivery");

const SLIDESHOW_MODES = new Set(["latest", "random", "selected"]);
const DEFAULT_SLIDESHOW_SETTINGS = Object.freeze({
  slideshow_mode: "latest",
  latest_min_seconds: 10,
  random_interval_seconds: 10,
  selected_media_id: null,
});
const MIN_DISPLAY_SECONDS = 3;
const MAX_DISPLAY_SECONDS = 300;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function databaseMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /event_slideshow_settings.*(not found|does not exist)/i.test(
      error.message || "",
    )
  ) {
    return "event_slideshow_settings tablosu bulunamadı. Canlı slideshow SQL kurulumunu çalıştır.";
  }

  if (error.code === "42501") {
    return "Backend'in canlı slideshow ayarlarına erişim yetkisi yok.";
  }

  return fallbackMessage;
}

function normalizeSeconds(value, fallbackValue) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    return fallbackValue;
  }

  return Math.min(
    MAX_DISPLAY_SECONDS,
    Math.max(MIN_DISPLAY_SECONDS, numberValue),
  );
}

function normalizeSettings(settings = {}) {
  const source = settings || {};

  return {
    slideshow_mode: SLIDESHOW_MODES.has(source.slideshow_mode)
      ? source.slideshow_mode
      : DEFAULT_SLIDESHOW_SETTINGS.slideshow_mode,
    latest_min_seconds: normalizeSeconds(
      source.latest_min_seconds,
      DEFAULT_SLIDESHOW_SETTINGS.latest_min_seconds,
    ),
    random_interval_seconds: normalizeSeconds(
      source.random_interval_seconds,
      DEFAULT_SLIDESHOW_SETTINGS.random_interval_seconds,
    ),
    selected_media_id:
      typeof source.selected_media_id === "string" &&
      source.selected_media_id.trim()
        ? source.selected_media_id.trim()
        : null,
  };
}

function publicSettings(settings = {}) {
  const source = settings || {};

  return {
    ...normalizeSettings(source),
    slideshow_updated_at: source.slideshow_updated_at || null,
  };
}

async function requireOwnedEvent(req, res) {
  const eventId = req.params.eventId;
  const userId = req.user.user_id;

  if (!eventId) {
    res.status(400).json({
      success: false,
      message: "Event ID zorunludur.",
      code: "EVENT_ID_REQUIRED",
    });
    return null;
  }

  const { data: event, error } = await supabase
    .from("event")
    .select(
      "event_id, event_name, event_code, event_cover_url, is_event_active, user_id",
    )
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    res.status(500).json({
      success: false,
      message: "Event kontrol edilirken hata oluştu.",
      code: error.code || "EVENT_LOOKUP_FAILED",
      error: error.message,
    });
    return null;
  }

  if (!event) {
    res.status(404).json({
      success: false,
      message: "Event bulunamadı veya canlı gösteriyi yönetme yetkin yok.",
      code: "EVENT_NOT_FOUND_OR_FORBIDDEN",
    });
    return null;
  }

  return event;
}

async function getApprovedImages(eventId) {
  const { data, error } = await supabase
    .from("events_media")
    .select(
      "media_id, guest_name, media_url, message, media_created_at, media_status, media_type",
    )
    .eq("event_id", eventId)
    .eq("media_status", "approved")
    .eq("media_type", "image")
    .not("media_url", "is", null)
    .order("media_created_at", { ascending: true });

  return {
    data: (data || []).map((item) => ({
      media_id: item.media_id,
      guest_name: item.guest_name || null,
      media_url: signedDeliveryUrl(item.media_url),
      message: item.message || null,
      media_created_at: item.media_created_at,
    })),
    error,
  };
}

async function getStoredSettings(eventId) {
  return supabase
    .from("event_slideshow_settings")
    .select(
      "event_id, slideshow_mode, latest_min_seconds, random_interval_seconds, selected_media_id, slideshow_updated_at",
    )
    .eq("event_id", eventId)
    .maybeSingle();
}

const getLiveSlideshow = async (req, res) => {
  try {
    const event = await requireOwnedEvent(req, res);

    if (!event) {
      return;
    }

    const [settingsResult, mediaResult] = await Promise.all([
      getStoredSettings(event.event_id),
      getApprovedImages(event.event_id),
    ]);

    if (settingsResult.error) {
      return res.status(500).json({
        success: false,
        message: databaseMessage(
          settingsResult.error,
          "Canlı slideshow ayarları alınamadı.",
        ),
        code: settingsResult.error.code || "SLIDESHOW_SETTINGS_LOAD_FAILED",
        error: settingsResult.error.message,
      });
    }

    if (mediaResult.error) {
      return res.status(500).json({
        success: false,
        message: "Onaylanmış slideshow fotoğrafları alınamadı.",
        code: mediaResult.error.code || "SLIDESHOW_MEDIA_LOAD_FAILED",
        error: mediaResult.error.message,
      });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Pragma", "no-cache");

    return res.status(200).json({
      success: true,
      event: {
        event_id: event.event_id,
        event_name: event.event_name,
        event_code: event.event_code,
        event_cover_url: signedDeliveryUrl(event.event_cover_url),
        is_event_active: event.is_event_active !== false,
      },
      slideshow: publicSettings(settingsResult.data),
      media: mediaResult.data,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Canlı slideshow yüklenirken sunucu hatası oluştu.",
      code: "SLIDESHOW_LOAD_FAILED",
      error: error.message,
    });
  }
};

const updateLiveSlideshow = async (req, res) => {
  try {
    const event = await requireOwnedEvent(req, res);

    if (!event) {
      return;
    }

    const settings = normalizeSettings(req.body);

    if (settings.slideshow_mode === "selected" && !settings.selected_media_id) {
      return res.status(400).json({
        success: false,
        message: "Seçili fotoğraf modunda bir fotoğraf seçmelisin.",
        code: "SLIDESHOW_SELECTED_PHOTO_REQUIRED",
      });
    }

    if (
      settings.selected_media_id &&
      !UUID_PATTERN.test(settings.selected_media_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Seçilen fotoğraf kimliği geçersiz.",
        code: "SLIDESHOW_SELECTED_PHOTO_ID_INVALID",
      });
    }

    if (settings.selected_media_id) {
      const { data: selectedMedia, error: selectedMediaError } = await supabase
        .from("events_media")
        .select("media_id")
        .eq("media_id", settings.selected_media_id)
        .eq("event_id", event.event_id)
        .eq("media_status", "approved")
        .eq("media_type", "image")
        .maybeSingle();

      if (selectedMediaError) {
        return res.status(500).json({
          success: false,
          message: "Seçilen fotoğraf doğrulanamadı.",
          code: selectedMediaError.code || "SLIDESHOW_MEDIA_CHECK_FAILED",
          error: selectedMediaError.message,
        });
      }

      if (!selectedMedia) {
        return res.status(400).json({
          success: false,
          message:
            "Seçilen fotoğraf bu etkinliğe ait onaylanmış bir görsel değil.",
          code: "SLIDESHOW_SELECTED_PHOTO_INVALID",
        });
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("event_slideshow_settings")
      .upsert(
        {
          event_id: event.event_id,
          ...settings,
          slideshow_updated_at: now,
          updated_by: req.user.user_id,
        },
        { onConflict: "event_id" },
      )
      .select(
        "event_id, slideshow_mode, latest_min_seconds, random_interval_seconds, selected_media_id, slideshow_updated_at",
      )
      .single();

    if (error || !data) {
      return res.status(500).json({
        success: false,
        message: databaseMessage(error, "Canlı slideshow ayarları kaydedilemedi."),
        code: error?.code || "SLIDESHOW_SETTINGS_SAVE_FAILED",
        error: error?.message || "Kaydedilen ayarlar alınamadı.",
      });
    }

    res.setHeader("Cache-Control", "private, no-store");

    return res.status(200).json({
      success: true,
      message: "Canlı slideshow ayarları kaydedildi.",
      slideshow: publicSettings(data),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Canlı slideshow ayarları kaydedilirken sunucu hatası oluştu.",
      code: "SLIDESHOW_SETTINGS_SAVE_FAILED",
      error: error.message,
    });
  }
};

module.exports = {
  DEFAULT_SLIDESHOW_SETTINGS,
  MAX_DISPLAY_SECONDS,
  MIN_DISPLAY_SECONDS,
  getLiveSlideshow,
  normalizeSettings,
  updateLiveSlideshow,
};
