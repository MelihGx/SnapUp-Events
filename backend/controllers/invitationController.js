const supabase = require("../config/supabaseClient");

const ALLOWED_FORMATS = new Set(["mini_card", "pdf", "story"]);
const ALLOWED_STATUSES = new Set(["draft", "published", "archived"]);
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const TEMPLATE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,49}$/i;
const MAX_SAVED_INVITATIONS_PER_EVENT = 3;

function cleanText(value, maxLength, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const cleaned = String(value).trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned.slice(0, maxLength);
}

function cleanColor(value, fallback) {
  const cleaned = cleanText(value, 7);
  return cleaned && COLOR_PATTERN.test(cleaned) ? cleaned.toUpperCase() : fallback;
}

function cleanDate(value) {
  const cleaned = cleanText(value, 10);

  if (!cleaned) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function cleanTemplateKey(value) {
  const cleaned = cleanText(value, 50, "modern");

  return TEMPLATE_KEY_PATTERN.test(cleaned) ? cleaned : "modern";
}

function cleanDesignData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const serialized = JSON.stringify(value);

  if (Buffer.byteLength(serialized, "utf8") > 250_000) {
    const error = new Error("Davetiye tasarım verisi çok büyük.");
    error.code = "INVITATION_DESIGN_DATA_TOO_LARGE";
    throw error;
  }

  return value;
}

function getInvitationDatabaseMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /event_invitations.*(not found|does not exist)/i.test(error.message || "")
  ) {
    return "event_invitations tablosu bulunamadı. Davetiye SQL kurulumunu kontrol et.";
  }

  if (
    error.code === "42703" ||
    /column .* does not exist/i.test(error.message || "")
  ) {
    return "event_invitations tablosunun kolonları güncel backend ile uyuşmuyor.";
  }

  if (error.code === "42501") {
    return "Backend'in event_invitations tablosuna erişim yetkisi yok.";
  }

  if (error.code === "23514") {
    return "Davetiye verisi veritabanındaki kontrol kurallarıyla uyuşmuyor.";
  }

  return fallbackMessage;
}

function normalizeInvitationPayload(body = {}) {
  const invitationFormat = ALLOWED_FORMATS.has(body.invitation_format)
    ? body.invitation_format
    : "mini_card";
  const invitationStatus = ALLOWED_STATUSES.has(body.invitation_status)
    ? body.invitation_status
    : "draft";
  const languageCode = LANGUAGE_PATTERN.test(body.language_code || "")
    ? body.language_code
    : "tr";

  return {
    invitation_name: cleanText(body.invitation_name, 100, "Davetiye"),
    template_key: cleanTemplateKey(body.template_key),
    invitation_format: invitationFormat,
    invitation_title: cleanText(body.invitation_title, 150),
    invitation_message: cleanText(body.invitation_message, 1500),
    dress_code: cleanText(body.dress_code, 100),
    contact_phone: cleanText(body.contact_phone, 20),
    rsvp_deadline: cleanDate(body.rsvp_deadline),
    language_code: languageCode,
    primary_color: cleanColor(body.primary_color, "#7C3AED"),
    secondary_color: cleanColor(body.secondary_color, "#EC4899"),
    text_color: cleanColor(body.text_color, "#FFFFFF"),
    font_key: cleanText(body.font_key, 50, "default"),
    background_image_url: cleanText(body.background_image_url, 2000),
    show_event_cover: body.show_event_cover !== false,
    show_qr_code: body.show_qr_code !== false,
    design_data: cleanDesignData(body.design_data),
    invitation_status: invitationStatus,
    invitation_updated_at: new Date().toISOString(),
  };
}

async function findOwnedEvent(eventId, userId) {
  return supabase
    .from("event")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
}

async function countActiveEventInvitations(eventId) {
  const { count, error } = await supabase
    .from("event_invitations")
    .select("invitation_id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .neq("invitation_status", "archived");

  return {
    count: Number.isFinite(count) ? count : 0,
    error,
  };
}

async function requireOwnedEvent(req, res) {
  const { eventId } = req.params;
  const userId = req.user.user_id;

  if (!eventId) {
    res.status(400).json({
      success: false,
      message: "Event ID zorunludur.",
    });
    return null;
  }

  const { data: event, error } = await findOwnedEvent(eventId, userId);

  if (error) {
    res.status(500).json({
      success: false,
      message: "Event kontrol edilirken hata oluştu.",
      error: error.message,
    });
    return null;
  }

  if (!event) {
    res.status(404).json({
      success: false,
      message: "Event bulunamadı veya bu evente erişim yetkin yok.",
    });
    return null;
  }

  return event;
}

const listEventInvitations = async (req, res) => {
  try {
    const event = await requireOwnedEvent(req, res);

    if (!event) {
      return;
    }

    const { data, error } = await supabase
      .from("event_invitations")
      .select("*")
      .eq("event_id", event.event_id)
      .neq("invitation_status", "archived")
      .order("invitation_updated_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: getInvitationDatabaseMessage(
          error,
          "Davetiyeler alınırken hata oluştu.",
        ),
        code: error.code || "INVITATION_LIST_FAILED",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      invitations: data || [],
      invitation_limit: MAX_SAVED_INVITATIONS_PER_EVENT,
      remaining_invitation_slots: Math.max(
        0,
        MAX_SAVED_INVITATIONS_PER_EVENT - (data?.length || 0),
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const createEventInvitation = async (req, res) => {
  try {
    const event = await requireOwnedEvent(req, res);

    if (!event) {
      return;
    }

    const invitationCount = await countActiveEventInvitations(event.event_id);

    if (invitationCount.error) {
      return res.status(500).json({
        success: false,
        message: getInvitationDatabaseMessage(
          invitationCount.error,
          "Davetiye sayısı kontrol edilirken hata oluştu.",
        ),
        code: invitationCount.error.code || "INVITATION_COUNT_FAILED",
        error: invitationCount.error.message,
      });
    }

    if (invitationCount.count >= MAX_SAVED_INVITATIONS_PER_EVENT) {
      return res.status(409).json({
        success: false,
        message:
          "Bu etkinlik için en fazla 3 davetiye kaydedebilirsin. Yeni bir davetiye kaydetmek için mevcut davetiyelerden birini sil.",
        code: "INVITATION_LIMIT_REACHED",
        invitation_limit: MAX_SAVED_INVITATIONS_PER_EVENT,
      });
    }

    const payload = {
      event_id: event.event_id,
      ...normalizeInvitationPayload(req.body),
    };

    const { data, error } = await supabase
      .from("event_invitations")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: getInvitationDatabaseMessage(
          error,
          "Davetiye kaydedilirken hata oluştu.",
        ),
        code: error.code || "INVITATION_CREATE_FAILED",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Davetiye taslağı kaydedildi.",
      invitation: data,
    });
  } catch (error) {
    if (error.code === "INVITATION_DESIGN_DATA_TOO_LARGE") {
      return res.status(413).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const updateEventInvitation = async (req, res) => {
  try {
    const event = await requireOwnedEvent(req, res);

    if (!event) {
      return;
    }

    const { invitationId } = req.params;

    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: "Davetiye ID zorunludur.",
      });
    }

    const payload = normalizeInvitationPayload(req.body);

    const { data, error } = await supabase
      .from("event_invitations")
      .update(payload)
      .eq("invitation_id", invitationId)
      .eq("event_id", event.event_id)
      .select("*")
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: getInvitationDatabaseMessage(
          error,
          "Davetiye güncellenirken hata oluştu.",
        ),
        code: error.code || "INVITATION_UPDATE_FAILED",
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Davetiye bulunamadı.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Davetiye taslağı güncellendi.",
      invitation: data,
    });
  } catch (error) {
    if (error.code === "INVITATION_DESIGN_DATA_TOO_LARGE") {
      return res.status(413).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const deleteEventInvitation = async (req, res) => {
  try {
    const event = await requireOwnedEvent(req, res);

    if (!event) {
      return;
    }

    const { invitationId } = req.params;

    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: "Davetiye ID zorunludur.",
      });
    }

    const { data, error } = await supabase
      .from("event_invitations")
      .delete()
      .eq("invitation_id", invitationId)
      .eq("event_id", event.event_id)
      .select("invitation_id")
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: getInvitationDatabaseMessage(
          error,
          "Davetiye silinirken hata oluştu.",
        ),
        code: error.code || "INVITATION_DELETE_FAILED",
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Davetiye bulunamadı.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Davetiye silindi.",
      deleted_invitation_id: data.invitation_id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

module.exports = {
  listEventInvitations,
  createEventInvitation,
  updateEventInvitation,
  deleteEventInvitation,
};
