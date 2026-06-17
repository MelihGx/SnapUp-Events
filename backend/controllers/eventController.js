const pptxgen = require("pptxgenjs");
const supabase = require("../config/supabaseClient");

function generateEventCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function createQrCodeUrl(eventCode) {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://127.0.0.1:5500/frontend"
  ).replace(/\/$/, "");

  const joinUrl = `${frontendUrl}/index.html?code=${encodeURIComponent(
    eventCode,
  )}`;

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    joinUrl,
  )}`;
}

async function generateUniqueEventCode() {
  let eventCode = generateEventCode();

  for (let i = 0; i < 5; i++) {
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

function cleanFileName(value) {
  return String(value || "snapup-event")
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  return new Date(value).toLocaleDateString("tr-TR");
}

function getImageExtensionFromUrl(url) {
  const cleanUrl = String(url || "")
    .split("?")[0]
    .toLowerCase();

  if (cleanUrl.endsWith(".png")) return "png";
  if (cleanUrl.endsWith(".webp")) return "png";
  if (cleanUrl.endsWith(".jpg")) return "jpg";
  if (cleanUrl.endsWith(".jpeg")) return "jpg";

  return "jpg";
}

async function getImageAsDataUri(imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Image could not be downloaded: ${imageUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const contentType =
    response.headers.get("content-type") ||
    `image/${getImageExtensionFromUrl(imageUrl)}`;

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function addText(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    color: options.color || "17110F",
    fontSize: options.fontSize || 16,
    bold: options.bold || false,
    align: options.align || "left",
    valign: options.valign || "mid",
    margin: options.margin ?? 0.04,
    breakLine: options.breakLine || false,
    fit: options.fit || "shrink",
  });
}

function addFooter(slide, eventCode) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 7.08,
    w: 12.23,
    h: 0,
    line: {
      color: "E9DED2",
      width: 1,
    },
  });

  addText(slide, "SnapUp Events", 0.55, 7.16, 2.4, 0.25, {
    fontSize: 9,
    bold: true,
    color: "0D0B0A",
  });

  addText(slide, eventCode || "", 10.6, 7.16, 2.18, 0.25, {
    fontSize: 9,
    bold: true,
    color: "FF6A3D",
    align: "right",
  });
}

const createEvent = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      eventName,
      event_name,
      event_location,
      event_date,
      event_start_time,
      event_finish_time,
      description,
      eventPackage,
      packageName,
      settings,
    } = req.body;

    const finalEventName = event_name || eventName;

    if (!finalEventName || finalEventName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Event adı zorunludur.",
      });
    }

    const selectedPackage = eventPackage || packageName || "starter";
    const packetLevelId = await getPacketLevelId(selectedPackage);

    const eventCode = await generateUniqueEventCode();
    const qrCodeUrl = createQrCodeUrl(eventCode);

    const { data: newEvent, error: eventError } = await supabase
      .from("event")
      .insert([
        {
          event_name: finalEventName.trim(),
          event_location: event_location || null,
          user_id: userId,
          packet_level_id: packetLevelId,
          event_date: event_date || null,
          event_start_time: event_start_time || null,
          event_finish_time: event_finish_time || null,
          event_code: eventCode,
          qr_code_url: qrCodeUrl,
          description: description || null,
          is_event_active: true,
          is_event_private: true,
        },
      ])
      .select(
        "event_id, event_name, event_location, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description",
      )
      .single();

    if (eventError) {
      return res.status(500).json({
        success: false,
        message: "Event oluşturulurken hata oluştu.",
        error: eventError.message,
      });
    }

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
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const getEventByCode = async (req, res) => {
  try {
    const { eventCode } = req.params;

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event kodu zorunludur.",
      });
    }

    const { data: event, error } = await supabase
      .from("event")
      .select(
        "event_id, event_name, event_location, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description, event_cover_url",
      )
      .eq("event_code", eventCode.toUpperCase())
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
        "event_id, event_name, event_location, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description, event_cover_url, user_id",
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
      settings: settings || null,
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
      settings: updatedSettings,
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

    const guestsWithStats = (guests || []).map((guest) => {
      const guestMedia = (media || []).filter(
        (item) => item.guest_id === guest.guest_id,
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

    return res.status(200).json({
      success: true,
      guests: guestsWithStats,
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
      .eq("media_type", "image")
      .not("media_url", "is", null)
      .order("media_created_at", { ascending: false });

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Approved gallery could not be loaded.",
        error: mediaError.message,
      });
    }

    const mediaList = media || [];
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
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Public gallery loading failed.",
      error: error.message,
    });
  }
}

async function downloadEventSlideshow(req, res) {
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

    const { data: media, error: mediaError } = await supabase
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

    if (mediaError) {
      return res.status(500).json({
        success: false,
        message: "Approved photos could not be loaded.",
        error: mediaError.message,
      });
    }

    const approvedImages = media || [];

    if (approvedImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No approved photos found for slideshow.",
      });
    }

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "SnapUp Events";
    pptx.subject = "Event slideshow";
    pptx.title = `${event.event_name || "SnapUp Event"} Slideshow`;
    pptx.company = "SnapUp Events";
    pptx.lang = "tr-TR";
    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
      lang: "tr-TR",
    };

    pptx.defineLayout({
      name: "SNAPUP_WIDE",
      width: 13.333,
      height: 7.5,
    });

    pptx.layout = "SNAPUP_WIDE";

    const coverSlide = pptx.addSlide();
    coverSlide.background = { color: "0D0B0A" };

    coverSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      fill: { color: "0D0B0A" },
      line: { color: "0D0B0A" },
    });

    coverSlide.addShape(pptx.ShapeType.arc, {
      x: 8.8,
      y: -1.1,
      w: 5.8,
      h: 5.8,
      line: { color: "FF6A3D", transparency: 40, width: 3 },
      adjustPoint: 0.4,
    });

    addText(coverSlide, "SNAPUP EVENTS", 0.75, 0.7, 4.8, 0.4, {
      fontSize: 14,
      bold: true,
      color: "F7B14C",
    });

    addText(
      coverSlide,
      event.event_name || "Untitled Event",
      0.75,
      2.25,
      8.5,
      1.25,
      {
        fontSize: 42,
        bold: true,
        color: "FFFAF2",
        fit: "shrink",
      },
    );

    const eventMeta = [
      event.event_location || "",
      formatDate(event.event_date),
      event.event_code ? `Code: ${event.event_code}` : "",
    ]
      .filter(Boolean)
      .join("  ·  ");

    addText(coverSlide, eventMeta, 0.75, 3.72, 9.2, 0.4, {
      fontSize: 16,
      bold: true,
      color: "F7B14C",
    });

    addText(
      coverSlide,
      event.description || "Approved memories from this event.",
      0.75,
      4.35,
      8.9,
      0.9,
      {
        fontSize: 15,
        color: "E9DED2",
        fit: "shrink",
      },
    );

    addText(
      coverSlide,
      `${approvedImages.length} approved photos`,
      0.75,
      6.36,
      3.6,
      0.35,
      {
        fontSize: 15,
        bold: true,
        color: "FF6A3D",
      },
    );

    for (let index = 0; index < approvedImages.length; index++) {
      const item = approvedImages[index];
      const slide = pptx.addSlide();

      slide.background = { color: "FFFAF2" };

      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        fill: { color: "FFFAF2" },
        line: { color: "FFFAF2" },
      });

      slide.addShape(pptx.ShapeType.rect, {
        x: 0.45,
        y: 0.42,
        w: 12.43,
        h: 6.45,
        fill: { color: "FFFFFF" },
        line: { color: "E9DED2", width: 1 },
        radius: 0.22,
      });

      const imageData = await getImageAsDataUri(item.media_url);

      slide.addImage({
        data: imageData,
        x: 0.78,
        y: 0.75,
        w: 8.3,
        h: 5.78,
        sizing: {
          type: "contain",
          x: 0.78,
          y: 0.75,
          w: 8.3,
          h: 5.78,
        },
      });

      slide.addShape(pptx.ShapeType.rect, {
        x: 9.38,
        y: 0.75,
        w: 3.08,
        h: 5.78,
        fill: { color: "0D0B0A" },
        line: { color: "0D0B0A" },
        radius: 0.18,
      });

      addText(slide, `PHOTO ${index + 1}`, 9.7, 1.05, 2.4, 0.25, {
        fontSize: 10,
        bold: true,
        color: "F7B14C",
      });

      addText(
        slide,
        `Uploaded by\n${item.guest_name || "Guest"}`,
        9.7,
        1.55,
        2.35,
        0.8,
        {
          fontSize: 18,
          bold: true,
          color: "FFFAF2",
          fit: "shrink",
        },
      );

      const caption = item.message || "No caption added.";

      addText(slide, caption, 9.7, 2.62, 2.35, 1.4, {
        fontSize: 13,
        color: "E9DED2",
        fit: "shrink",
      });

      addText(
        slide,
        item.media_created_at
          ? new Date(item.media_created_at).toLocaleString("tr-TR")
          : "",
        9.7,
        4.45,
        2.35,
        0.32,
        {
          fontSize: 10,
          color: "AFA39A",
        },
      );

      addText(
        slide,
        `${index + 1} / ${approvedImages.length}`,
        9.7,
        5.76,
        2.35,
        0.35,
        {
          fontSize: 14,
          bold: true,
          color: "FF6A3D",
        },
      );

      addFooter(slide, event.event_code);
    }

    const endSlide = pptx.addSlide();
    endSlide.background = { color: "0D0B0A" };

    endSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      fill: { color: "0D0B0A" },
      line: { color: "0D0B0A" },
    });

    addText(endSlide, "SnapUp Events", 0.9, 2.45, 11.5, 0.8, {
      fontSize: 44,
      bold: true,
      color: "FFFAF2",
      align: "center",
    });

    addText(
      endSlide,
      "Capture it. Share it. Cherish it forever.",
      1.4,
      3.46,
      10.5,
      0.45,
      {
        fontSize: 19,
        bold: true,
        color: "F7B14C",
        align: "center",
      },
    );

    addText(
      endSlide,
      event.event_code ? `Event Code: ${event.event_code}` : "",
      1.4,
      4.22,
      10.5,
      0.35,
      {
        fontSize: 14,
        bold: true,
        color: "FF6A3D",
        align: "center",
      },
    );

    const pptxBuffer = await pptx.write({
      outputType: "nodebuffer",
    });

    const fileName = `${cleanFileName(
      event.event_name || "snapup-event",
    )}-slideshow.pptx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pptxBuffer.length);

    return res.status(200).send(pptxBuffer);
  } catch (error) {
    console.error("Slideshow download error:", error);

    return res.status(500).json({
      success: false,
      message: "Slideshow could not be generated.",
      error: error.message,
    });
  }
}

module.exports = {
  createEvent,
  getEventByCode,
  getEventDetail,
  updateEventSettings,
  deleteEvent,
  getEventGuests,
  getPublicEventGallery,
  downloadEventSlideshow,
};
