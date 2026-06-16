const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");

const createToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      user_mail: user.user_mail,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

const register = async (req, res) => {
  try {
    const { user_name, user_mail, user_phone, password, user_password } =
      req.body;

    const rawPassword = password || user_password;

    if (!user_name || !user_mail || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: "İsim, mail ve şifre zorunludur.",
      });
    }

    if (rawPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Şifre en az 6 karakter olmalıdır.",
      });
    }

    const normalizedMail = user_mail.toLowerCase().trim();

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("user_id, user_mail")
      .eq("user_mail", normalizedMail)
      .maybeSingle();

    if (existingUserError) {
      return res.status(500).json({
        success: false,
        message: "Kullanıcı kontrol edilirken hata oluştu.",
        error: existingUserError.message,
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Bu mail adresi zaten kayıtlı.",
      });
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          user_name: user_name.trim(),
          user_mail: normalizedMail,
          user_phone: user_phone || null,
          password_hash: passwordHash,
          is_user_active: true,
        },
      ])
      .select(
        "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active",
      )
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        message: "Kayıt oluşturulurken hata oluştu.",
        error: insertError.message,
      });
    }

    const token = createToken(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { user_mail, password, user_password } = req.body;

    const rawPassword = password || user_password;

    if (!user_mail || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: "Mail ve şifre zorunludur.",
      });
    }

    const normalizedMail = user_mail.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "user_id, user_name, user_mail, user_phone, password_hash, user_created_at, is_user_active",
      )
      .eq("user_mail", normalizedMail)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Kullanıcı aranırken hata oluştu.",
        error: error.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Mail veya şifre hatalı.",
      });
    }

    if (!user.is_user_active) {
      return res.status(403).json({
        success: false,
        message: "Bu kullanıcı hesabı aktif değil.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      rawPassword,
      user.password_hash,
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Mail veya şifre hatalı.",
      });
    }

    const safeUser = {
      user_id: user.user_id,
      user_name: user.user_name,
      user_mail: user.user_mail,
      user_phone: user.user_phone,
      user_created_at: user.user_created_at,
      is_user_active: user.is_user_active,
    };

    const token = createToken(safeUser);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
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
        message: "Kullanıcı bilgileri alınırken hata oluştu.",
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

module.exports = {
  register,
  login,
  getMe,
};
