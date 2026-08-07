const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");
const { cleanText, normalizeEmail, validatePassword } = require("../utils/validation");
const { setAuthCookie } = require("../utils/authCookie");
const {
  RESEND_COOLDOWN_MS,
  hashVerificationToken,
  issueAndSendVerificationEmail,
  revokeActiveVerificationTokens,
} = require("../services/emailVerificationService");

const createToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      user_mail: user.user_mail,
      token_version: Number(user.token_version) || 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      algorithm: "HS256",
      issuer: "snapup-events",
      audience: "snapup-web",
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

    const validatedPassword = validatePassword(rawPassword);
    const normalizedMail = normalizeEmail(user_mail);
    const cleanName = cleanText(user_name, { min: 1, max: 100, field: "user_name" });
    const cleanPhone = user_phone ? cleanText(user_phone, { max: 32, field: "user_phone" }) : null;

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

    const passwordHash = await bcrypt.hash(validatedPassword, 12);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          user_name: cleanName,
          user_mail: normalizedMail,
          user_phone: cleanPhone,
          password_hash: passwordHash,
          is_user_active: true,
          is_email_verified: false,
          email_verified_at: null,
        },
      ])
      .select(
        "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active, is_email_verified, email_verified_at",
      )
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        message: "Kayıt oluşturulurken hata oluştu.",
        error: insertError.message,
      });
    }

    let verificationEmailSent = false;

    try {
      await issueAndSendVerificationEmail({
        userId: newUser.user_id,
        email: newUser.user_mail,
        userName: newUser.user_name,
      });
      verificationEmailSent = true;
    } catch (error) {
      console.error("Verification email could not be sent:", error.message);
    }

    const token = createToken(newUser);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: verificationEmailSent
        ? "Account created. Please verify your email."
        : "Account created, but the verification email could not be sent. You can resend it from your account.",
      token: process.env.NODE_ENV === "production" ? "cookie" : token,
      user: newUser,
      requires_email_verification: true,
      verification_email_sent: verificationEmailSent,
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

    const normalizedMail = normalizeEmail(user_mail);

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "user_id, user_name, user_mail, user_phone, password_hash, user_created_at, is_user_active, is_email_verified, email_verified_at, token_version",
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
      is_email_verified: user.is_email_verified,
      email_verified_at: user.email_verified_at,
      token_version: Number(user.token_version) || 0,
    };

    const token = createToken(safeUser);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: process.env.NODE_ENV === "production" ? "cookie" : token,
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
        "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active, is_email_verified, email_verified_at",
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

const verifyEmail = async (req, res) => {
  try {
    const rawToken = String(req.body?.token || "").trim();

    if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
      return res.status(400).json({
        success: false,
        message: "Doğrulama bağlantısı geçersiz.",
        code: "INVALID_VERIFICATION_TOKEN",
      });
    }

    const tokenHash = hashVerificationToken(rawToken);

    const { data: verificationToken, error: tokenError } = await supabase
      .from("email_verification_tokens")
      .select(
        "verification_id, user_id, email_address, expires_at, used_at, revoked_at, created_at",
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (tokenError) {
      return res.status(500).json({
        success: false,
        message: "Doğrulama bağlantısı kontrol edilemedi.",
        error: tokenError.message,
      });
    }

    if (!verificationToken || verificationToken.revoked_at) {
      return res.status(400).json({
        success: false,
        message: "Doğrulama bağlantısı geçersiz veya iptal edilmiş.",
        code: "INVALID_VERIFICATION_TOKEN",
      });
    }

    if (verificationToken.used_at) {
      return res.status(409).json({
        success: false,
        message: "Bu doğrulama bağlantısı daha önce kullanılmış.",
        code: "VERIFICATION_TOKEN_ALREADY_USED",
      });
    }

    if (new Date(verificationToken.expires_at).getTime() <= Date.now()) {
      await supabase
        .from("email_verification_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("verification_id", verificationToken.verification_id);

      return res.status(410).json({
        success: false,
        message: "Doğrulama bağlantısının süresi dolmuş.",
        code: "VERIFICATION_TOKEN_EXPIRED",
      });
    }

    const { data: tokenUser, error: tokenUserError } = await supabase
      .from("users")
      .select("user_id, user_mail")
      .eq("user_id", verificationToken.user_id)
      .maybeSingle();

    if (tokenUserError) {
      return res.status(500).json({
        success: false,
        message: "Kullanıcı bilgileri kontrol edilemedi.",
        error: tokenUserError.message,
      });
    }

    if (
      !tokenUser ||
      tokenUser.user_mail.toLowerCase().trim() !==
        verificationToken.email_address.toLowerCase().trim()
    ) {
      await supabase
        .from("email_verification_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("verification_id", verificationToken.verification_id);

      return res.status(400).json({
        success: false,
        message: "E-posta adresi değiştiği için bu bağlantı artık geçerli değil.",
        code: "VERIFICATION_EMAIL_CHANGED",
      });
    }

    const verifiedAt = new Date().toISOString();

    const { data: verifiedUser, error: userUpdateError } = await supabase
      .from("users")
      .update({
        is_email_verified: true,
        email_verified_at: verifiedAt,
      })
      .eq("user_id", verificationToken.user_id)
      .select(
        "user_id, user_name, user_mail, is_email_verified, email_verified_at",
      )
      .single();

    if (userUpdateError) {
      return res.status(500).json({
        success: false,
        message: "E-posta doğrulama durumu güncellenemedi.",
        error: userUpdateError.message,
      });
    }

    const { error: tokenUpdateError } = await supabase
      .from("email_verification_tokens")
      .update({ used_at: verifiedAt })
      .eq("verification_id", verificationToken.verification_id)
      .is("used_at", null);

    if (tokenUpdateError) {
      console.error("Verification token could not be marked as used:", tokenUpdateError.message);
    }

    await revokeActiveVerificationTokens(verificationToken.user_id);

    return res.status(200).json({
      success: true,
      message: "E-posta adresiniz başarıyla doğrulandı.",
      user: verifiedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
      error: error.message,
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, user_name, user_mail, is_email_verified")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({
        success: false,
        message: "Kullanıcı bilgileri alınamadı.",
        error: userError.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    if (user.is_email_verified) {
      return res.status(200).json({
        success: true,
        message: "E-posta adresiniz zaten doğrulanmış.",
        already_verified: true,
      });
    }

    const { data: latestToken, error: latestTokenError } = await supabase
      .from("email_verification_tokens")
      .select("created_at")
      .eq("user_id", userId)
      .is("used_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestTokenError) {
      return res.status(500).json({
        success: false,
        message: "Doğrulama maili gönderim süresi kontrol edilemedi.",
        error: latestTokenError.message,
      });
    }

    if (latestToken) {
      const elapsedMs = Date.now() - new Date(latestToken.created_at).getTime();

      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil(
          (RESEND_COOLDOWN_MS - elapsedMs) / 1000,
        );

        return res.status(429).json({
          success: false,
          message: `Yeni bir doğrulama maili için ${retryAfterSeconds} saniye bekleyin.`,
          code: "VERIFICATION_EMAIL_COOLDOWN",
          retry_after_seconds: retryAfterSeconds,
        });
      }
    }

    const result = await issueAndSendVerificationEmail({
      userId: user.user_id,
      email: user.user_mail,
      userName: user.user_name,
    });

    return res.status(200).json({
      success: true,
      message: "Doğrulama maili yeniden gönderildi.",
      expires_at: result.expiresAt,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Doğrulama maili gönderilemedi.",
      code: "VERIFICATION_EMAIL_SEND_FAILED",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerificationEmail,
};
