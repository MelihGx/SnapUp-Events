const PDFDocument = require("pdfkit");
const supabase = require("../config/supabaseClient");

const PDF_WIDTH = 960;
const PDF_HEIGHT = 540;

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

function limitText(value, maxLength = 220) {
  const text = String(value || "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function getCloudinaryJpgUrl(imageUrl) {
  if (!imageUrl || !imageUrl.includes("/upload/")) {
    return imageUrl;
  }

  return imageUrl.replace("/upload/", "/upload/f_jpg,q_auto/");
}

async function getImageBuffer(imageUrl) {
  const safeImageUrl = getCloudinaryJpgUrl(imageUrl);

  const response = await fetch(safeImageUrl);

  if (!response.ok) {
    throw new Error(`Image could not be downloaded: ${safeImageUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

function drawFooter(doc, eventCode) {
  doc
    .moveTo(45, PDF_HEIGHT - 34)
    .lineTo(PDF_WIDTH - 45, PDF_HEIGHT - 34)
    .lineWidth(1)
    .strokeColor("#E9DED2")
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#0D0B0A")
    .text("SnapUp Events", 45, PDF_HEIGHT - 24, {
      width: 220,
      align: "left",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#FF6A3D")
    .text(eventCode || "", PDF_WIDTH - 250, PDF_HEIGHT - 24, {
      width: 205,
      align: "right",
    });
}

function drawCoverPage(doc, event, photoCount) {
  doc.addPage();

  doc.rect(0, 0, PDF_WIDTH, PDF_HEIGHT).fill("#0D0B0A");

  doc.save();
  doc.fillOpacity(0.14).circle(830, 65, 165).fill("#FF6A3D");
  doc.fillOpacity(0.12).circle(805, 430, 85).fill("#F7B14C");
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#F7B14C")
    .text("SNAPUP EVENTS", 58, 58, {
      width: 320,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(42)
    .fillColor("#FFFAF2")
    .text(event.event_name || "Untitled Event", 58, 160, {
      width: 640,
      height: 105,
      lineGap: 2,
    });

  const eventMeta = [
    event.event_location || "",
    formatDate(event.event_date),
    event.event_code ? `Code: ${event.event_code}` : "",
  ]
    .filter(Boolean)
    .join("  •  ");

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#F7B14C")
    .text(eventMeta, 58, 285, {
      width: 720,
    });

  doc
    .font("Helvetica")
    .fontSize(15)
    .fillColor("#E9DED2")
    .text(
      limitText(event.description || "Approved memories from this event.", 180),
      58,
      335,
      {
        width: 680,
        lineGap: 4,
      },
    );

  doc.roundedRect(58, 455, 230, 38, 19).fill("#FF6A3D");

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#0D0B0A")
    .text(`${photoCount} approved photos`, 78, 466, {
      width: 190,
      align: "center",
    });
}

function drawPhotoPage(doc, item, index, total, imageBuffer) {
  doc.addPage();

  doc.rect(0, 0, PDF_WIDTH, PDF_HEIGHT).fill("#FFFAF2");

  doc
    .roundedRect(42, 38, PDF_WIDTH - 84, PDF_HEIGHT - 82, 20)
    .fill("#FFFFFF")
    .strokeColor("#E9DED2")
    .lineWidth(1)
    .stroke();

  doc.roundedRect(62, 58, 610, 380, 16).fill("#F7F1EA");

  if (imageBuffer) {
    doc.image(imageBuffer, 78, 74, {
      fit: [578, 348],
      align: "center",
      valign: "center",
    });
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#FF6A3D")
      .text("Photo could not be loaded.", 95, 220, {
        width: 540,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#776E68")
      .text(
        "This image was skipped because it could not be downloaded.",
        95,
        258,
        {
          width: 540,
          align: "center",
        },
      );
  }

  doc.roundedRect(700, 58, 215, 380, 16).fill("#0D0B0A");

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#F7B14C")
    .text(`PHOTO ${index + 1}`, 725, 88, {
      width: 165,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor("#FFFAF2")
    .text(`Uploaded by\n${item.guest_name || "Guest"}`, 725, 125, {
      width: 165,
      lineGap: 4,
    });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#E9DED2")
    .text(limitText(item.message || "No caption added.", 170), 725, 225, {
      width: 165,
      height: 95,
      lineGap: 3,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#AFA39A")
    .text(
      item.media_created_at
        ? new Date(item.media_created_at).toLocaleString("tr-TR")
        : "",
      725,
      350,
      {
        width: 165,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#FF6A3D")
    .text(`${index + 1} / ${total}`, 725, 395, {
      width: 165,
    });

  drawFooter(doc, item.event_code);
}

function drawEndPage(doc, event, addedImageCount) {
  doc.addPage();

  doc.rect(0, 0, PDF_WIDTH, PDF_HEIGHT).fill("#0D0B0A");

  doc.save();
  doc.fillOpacity(0.13).circle(165, 85, 105).fill("#FF6A3D");
  doc.fillOpacity(0.1).circle(805, 435, 125).fill("#F7B14C");
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(44)
    .fillColor("#FFFAF2")
    .text("SnapUp Events", 90, 190, {
      width: 780,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor("#F7B14C")
    .text("Capture it. Share it. Cherish it forever.", 90, 260, {
      width: 780,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#FF6A3D")
    .text(event.event_code ? `Event Code: ${event.event_code}` : "", 90, 320, {
      width: 780,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#AFA39A")
    .text(
      `Generated with ${addedImageCount} photo${
        addedImageCount === 1 ? "" : "s"
      }.`,
      90,
      355,
      {
        width: 780,
        align: "center",
      },
    );
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

    const validImages = (media || []).filter(
      (item) =>
        item &&
        item.media_url &&
        item.media_status === "approved" &&
        item.media_type === "image",
    );

    if (validImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid approved photos found for slideshow.",
      });
    }

    const fileName = `${cleanFileName(
      event.event_name || "snapup-event",
    )}-slideshow.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({
      size: [PDF_WIDTH, PDF_HEIGHT],
      margin: 0,
      autoFirstPage: false,
    });

    doc.pipe(res);

    drawCoverPage(doc, event, validImages.length);

    let addedImageCount = 0;

    for (let index = 0; index < validImages.length; index++) {
      const item = {
        ...validImages[index],
        event_code: event.event_code,
      };

      let imageBuffer = null;

      try {
        imageBuffer = await getImageBuffer(item.media_url);
        addedImageCount++;
      } catch (imageError) {
        console.error("PDF slideshow image error:", {
          media_id: item.media_id,
          media_url: item.media_url,
          error: imageError.message,
        });
      }

      drawPhotoPage(doc, item, index, validImages.length, imageBuffer);
    }

    drawEndPage(doc, event, addedImageCount);

    doc.end();
  } catch (error) {
    console.error("PDF slideshow download error:", error);

    return res.status(500).json({
      success: false,
      message: "PDF slideshow could not be generated.",
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
