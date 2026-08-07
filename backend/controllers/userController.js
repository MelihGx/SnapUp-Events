const supabase = require("../config/supabaseClient");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");
const { validatePassword } = require("../utils/validation");


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

function getCloudinaryResourceType(mediaUrl) {
  return /\/video\/(?:upload|authenticated)\//.test(String(mediaUrl || "")) ? "video" : "image";
}

function getCloudinaryDeliveryType(mediaUrl) {
  return /\/(?:image|video)\/upload\//.test(String(mediaUrl || ""))
    ? "upload"
    : "authenticated";
}

function isMissingRelationError(error) {
  const message = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    /relation .* does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /table .* not found/i.test(message)
  );
}

function uniqueBy(items, keySelector) {
  const seen = new Set();

  return items.filter((item) => {
    const key = keySelector(item);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function deleteRows(query, errorMessage, { optional = false } = {}) {
  const { error } = await query;

  if (!error) {
    return;
  }

  if (optional && isMissingRelationError(error)) {
    return;
  }

  const deletionError = new Error(errorMessage);
  deletionError.details = error.message;
  throw deletionError;
}

async function cleanupCloudinaryAssets(assetUrls) {
  const assets = uniqueBy(
    assetUrls
      .map((url) => ({
        url,
        publicId: getCloudinaryPublicId(url),
        resourceType: getCloudinaryResourceType(url),
        deliveryType: getCloudinaryDeliveryType(url),
      }))
      .filter((asset) => asset.publicId),
    (asset) => `${asset.resourceType}:${asset.deliveryType}:${asset.publicId}`,
  );

  const results = await Promise.allSettled(
    assets.map((asset) =>
      cloudinary.uploader.destroy(asset.publicId, {
        resource_type: asset.resourceType,
        type: asset.deliveryType,
        invalidate: true,
      }),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Account asset cleanup failed (${assets[index].publicId}):`,
        result.reason?.message || result.reason,
      );
    }
  });

  return {
    requested: assets.length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Hesap bilgileri alınırken hata oluştu.",
        error: error.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    return res.status(statusCode).json({
      success: false,
      message: statusCode === 400 ? error.message : "Sunucu hatası.",
      ...(statusCode === 400 ? { code: error.code } : { error: error.message }),
    });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { user_name, user_mail, user_phone } = req.body;

    if (!user_name || !user_mail) {
      return res.status(400).json({
        success: false,
        message: "İsim ve mail zorunludur.",
      });
    }

    const normalizedMail = user_mail.toLowerCase().trim();

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_mail", normalizedMail)
      .neq("user_id", userId)
      .maybeSingle();

    if (existingUserError) {
      return res.status(500).json({
        success: false,
        message: "Mail kontrol edilirken hata oluştu.",
        error: existingUserError.message,
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Bu mail adresi başka bir kullanıcı tarafından kullanılıyor.",
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        user_name: user_name.trim(),
        user_mail: normalizedMail,
        user_phone: user_phone || null,
      })
      .eq("user_id", userId)
      .select(
        "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active",
      )
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Hesap bilgileri güncellenirken hata oluştu.",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hesap bilgileri güncellendi.",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { data: events, error } = await supabase
      .from("event")
      .select(
        "event_id, event_name, event_location, event_address, event_latitude, event_longitude, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description, event_cover_url",
      )
      .eq("user_id", userId)
      .order("event_created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Eventler alınırken hata oluştu.",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { current_password, new_password, confirm_new_password } = req.body;

    if (!current_password || !new_password || !confirm_new_password) {
      return res.status(400).json({
        success: false,
        message: "Mevcut şifre, yeni şifre ve şifre tekrarı zorunludur.",
      });
    }

    validatePassword(new_password);

    if (new_password !== confirm_new_password) {
      return res.status(400).json({
        success: false,
        message: "Yeni şifreler eşleşmiyor.",
      });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, password_hash, token_version")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({
        success: false,
        message: "Kullanıcı bilgisi alınırken hata oluştu.",
        error: userError.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      current_password,
      user.password_hash,
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Mevcut şifre hatalı.",
      });
    }

    const newPasswordHash = await bcrypt.hash(new_password, 12);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: newPasswordHash,
        token_version: Number(user.token_version || 0) + 1,
      })
      .eq("user_id", userId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Şifre güncellenirken hata oluştu.",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Şifre başarıyla güncellendi.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};


const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { current_password, confirmation } = req.body || {};

    if (!current_password) {
      return res.status(400).json({
        success: false,
        message: "Hesabı silmek için mevcut şifreni girmelisin.",
        code: "CURRENT_PASSWORD_REQUIRED",
      });
    }

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: "Hesap silme onayı geçersiz. DELETE yazmalısın.",
        code: "DELETE_CONFIRMATION_REQUIRED",
      });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, password_hash")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({
        success: false,
        message: "Kullanıcı bilgisi kontrol edilirken hata oluştu.",
        error: userError.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      current_password,
      user.password_hash,
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Mevcut şifre hatalı.",
        code: "INVALID_PASSWORD",
      });
    }

    const { data: deletionResult, error: deletionError } = await supabase.rpc(
      "delete_user_account",
      { p_user_id: String(userId) },
    );
    if (deletionError || !deletionResult?.deleted) {
      return res.status(500).json({
        success: false,
        message: "Hesap güvenli biçimde silinemedi.",
        code: "ACCOUNT_DELETE_FAILED",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Hesabın silindi. Medya varlıkları güvenli temizleme kuyruğuna alındı.",
      deleted: deletionResult,
    });

    /* Legacy non-transactional cleanup retained temporarily for rollback reference.
       It is unreachable after the atomic RPC above and can be removed after the
       migration has been deployed successfully. */
    const { data: ownedEvents, error: eventsError } = await supabase
      .from("event")
      .select("event_id, event_cover_url")
      .eq("user_id", userId);

    if (eventsError) {
      return res.status(500).json({
        success: false,
        message: "Hesaba bağlı etkinlikler alınırken hata oluştu.",
        error: eventsError.message,
      });
    }

    const { data: userGuestRows, error: guestRowsError } = await supabase
      .from("event_guests")
      .select("event_id, guest_id")
      .eq("user_id", userId);

    if (guestRowsError) {
      return res.status(500).json({
        success: false,
        message: "Hesaba bağlı misafir kayıtları alınırken hata oluştu.",
        error: guestRowsError.message,
      });
    }

    const eventIds = (ownedEvents || []).map((event) => event.event_id);
    const guestIds = (userGuestRows || []).map((guest) => guest.guest_id);
    const mediaRows = [];

    if (eventIds.length > 0) {
      const { data, error } = await supabase
        .from("media")
        .select("media_id, media_url")
        .in("event_id", eventIds);

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Etkinlik medyaları alınırken hata oluştu.",
          error: error.message,
        });
      }

      mediaRows.push(...(data || []));
    }

    if (guestIds.length > 0) {
      const { data, error } = await supabase
        .from("media")
        .select("media_id, media_url")
        .in("guest_id", guestIds);

      if (error) {
        return res.status(500).json({
          success: false,
          message: "Kullanıcı medyaları alınırken hata oluştu.",
          error: error.message,
        });
      }

      mediaRows.push(...(data || []));
    }

    const uniqueMediaRows = uniqueBy(mediaRows, (media) => media.media_id);
    const mediaIds = uniqueMediaRows.map((media) => media.media_id);
    const cloudinaryUrls = [
      ...(ownedEvents || []).map((event) => event.event_cover_url),
      ...uniqueMediaRows.map((media) => media.media_url),
    ].filter(Boolean);

    if (mediaIds.length > 0) {
      await deleteRows(
        supabase.from("media_likes").delete().in("media_id", mediaIds),
        "Medya beğenileri silinirken hata oluştu.",
        { optional: true },
      );

      await deleteRows(
        supabase.from("media").delete().in("media_id", mediaIds),
        "Hesaba bağlı medya içerikleri silinirken hata oluştu.",
      );
    }

    if (eventIds.length > 0) {
      await deleteRows(
        supabase
          .from("event_invitations")
          .delete()
          .in("event_id", eventIds),
        "Etkinlik davetiyeleri silinirken hata oluştu.",
        { optional: true },
      );

      await deleteRows(
        supabase.from("event_settings").delete().in("event_id", eventIds),
        "Etkinlik ayarları silinirken hata oluştu.",
      );

      await deleteRows(
        supabase.from("event_guests").delete().in("event_id", eventIds),
        "Etkinlik misafirleri silinirken hata oluştu.",
      );
    }

    await deleteRows(
      supabase.from("event_guests").delete().eq("user_id", userId),
      "Kullanıcı misafir kayıtları silinirken hata oluştu.",
    );

    await deleteRows(
      supabase.from("event").delete().eq("user_id", userId),
      "Kullanıcının etkinlikleri silinirken hata oluştu.",
    );

    const { data: deletedUser, error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId)
      .select("user_id")
      .maybeSingle();

    if (deleteUserError) {
      return res.status(500).json({
        success: false,
        message: "Hesap silinirken hata oluştu.",
        error: deleteUserError.message,
      });
    }

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Silinecek hesap bulunamadı.",
      });
    }

    const cleanup = await cleanupCloudinaryAssets(cloudinaryUrls);

    return res.status(200).json({
      success: true,
      message: "Hesabın ve hesaba bağlı içerikler kalıcı olarak silindi.",
      deleted: {
        events: eventIds.length,
        media: mediaIds.length,
      },
      asset_cleanup: cleanup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Hesap silinirken sunucu hatası oluştu.",
      error: error.details || error.message,
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyEvents,
  changeMyPassword,
  deleteMyAccount,
};
