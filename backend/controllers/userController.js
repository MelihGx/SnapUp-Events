const supabase = require("../config/supabaseClient");
const bcrypt = require("bcryptjs");

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
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
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
        "event_id, event_name, event_location, event_created_at, is_event_active, is_event_private, event_date, event_start_time, event_finish_time, event_code, qr_code_url, description, event_cover_url",
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

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Yeni şifre en az 6 karakter olmalıdır.",
      });
    }

    if (new_password !== confirm_new_password) {
      return res.status(400).json({
        success: false,
        message: "Yeni şifreler eşleşmiyor.",
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

    const newPasswordHash = await bcrypt.hash(new_password, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: newPasswordHash,
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

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyEvents,
  changeMyPassword,
};
