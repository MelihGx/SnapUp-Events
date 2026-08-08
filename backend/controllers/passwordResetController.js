const bcrypt = require("bcryptjs");
const supabase = require("../config/supabaseClient");
const { validatePassword } = require("../utils/validation");
const {
  PASSWORD_RESET_COOLDOWN_MS,
  hashPasswordResetToken,
  issueAndSendPasswordResetEmail,
  revokeActivePasswordResetTokens,
} = require("../services/passwordResetService");

const GENERIC_REQUEST_MESSAGE =
  "If an active account exists for this email address, a password reset link has been sent.";

function normalizeEmail(value) {
  return String(value || "").toLowerCase().trim();
}

function isValidRawToken(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || "").trim());
}

async function getUsableResetToken(rawToken) {
  const tokenHash = hashPasswordResetToken(rawToken);

  const { data: resetToken, error } = await supabase
    .from("password_reset_tokens")
    .select(
      "reset_id, user_id, email_address, expires_at, used_at, revoked_at, created_at",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(`Password reset token could not be checked: ${error.message}`);
  }

  if (!resetToken || resetToken.revoked_at || resetToken.used_at) {
    return { valid: false, code: "INVALID_PASSWORD_RESET_TOKEN" };
  }

  if (new Date(resetToken.expires_at).getTime() <= Date.now()) {
    await supabase
      .from("password_reset_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("reset_id", resetToken.reset_id);

    return { valid: false, code: "PASSWORD_RESET_TOKEN_EXPIRED" };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("user_id, user_name, user_mail, is_user_active")
    .eq("user_id", resetToken.user_id)
    .maybeSingle();

  if (userError) {
    throw new Error(`Password reset user could not be checked: ${userError.message}`);
  }

  if (
    !user ||
    !user.is_user_active ||
    normalizeEmail(user.user_mail) !== normalizeEmail(resetToken.email_address)
  ) {
    await supabase
      .from("password_reset_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("reset_id", resetToken.reset_id);

    return { valid: false, code: "INVALID_PASSWORD_RESET_TOKEN" };
  }

  return { valid: true, resetToken, user };
}

const requestPasswordReset = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.user_mail || req.body?.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
        code: "EMAIL_REQUIRED",
      });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, user_name, user_mail, is_user_active")
      .eq("user_mail", email)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({
        success: false,
        message: "Password reset request could not be processed.",
        code: "PASSWORD_RESET_REQUEST_FAILED",
      });
    }

    if (!user || !user.is_user_active) {
      return res.status(200).json({
        success: true,
        message: GENERIC_REQUEST_MESSAGE,
      });
    }

    const { data: latestToken, error: latestTokenError } = await supabase
      .from("password_reset_tokens")
      .select("created_at")
      .eq("user_id", user.user_id)
      .is("used_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestTokenError) {
      console.error(
        "Password reset cooldown could not be checked:",
        latestTokenError.message,
      );
    } else if (latestToken) {
      const elapsedMs = Date.now() - new Date(latestToken.created_at).getTime();

      if (elapsedMs < PASSWORD_RESET_COOLDOWN_MS) {
        return res.status(200).json({
          success: true,
          message: GENERIC_REQUEST_MESSAGE,
        });
      }
    }

    try {
      await issueAndSendPasswordResetEmail({
        userId: user.user_id,
        email: user.user_mail,
        userName: user.user_name,
        languageCode:
          req.body?.language_code || req.get("Accept-Language") || "en",
      });
    } catch (error) {
      console.error("Password reset email could not be sent:", error.message);
    }

    return res.status(200).json({
      success: true,
      message: GENERIC_REQUEST_MESSAGE,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password reset request could not be processed.",
      code: "PASSWORD_RESET_REQUEST_FAILED",
    });
  }
};

const validatePasswordResetToken = async (req, res) => {
  try {
    const rawToken = String(req.body?.token || "").trim();

    if (!isValidRawToken(rawToken)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Password reset link is invalid.",
        code: "INVALID_PASSWORD_RESET_TOKEN",
      });
    }

    const result = await getUsableResetToken(rawToken);

    if (!result.valid) {
      const expired = result.code === "PASSWORD_RESET_TOKEN_EXPIRED";

      return res.status(expired ? 410 : 400).json({
        success: false,
        valid: false,
        message: expired
          ? "Password reset link has expired."
          : "Password reset link is invalid or has already been used.",
        code: result.code,
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      expires_at: result.resetToken.expires_at,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Password reset link could not be checked.",
      code: "PASSWORD_RESET_TOKEN_CHECK_FAILED",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const rawToken = String(req.body?.token || "").trim();
    const newPassword = String(
      req.body?.new_password || req.body?.password || "",
    );

    if (!isValidRawToken(rawToken)) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid.",
        code: "INVALID_PASSWORD_RESET_TOKEN",
      });
    }

    validatePassword(newPassword);

    const result = await getUsableResetToken(rawToken);

    if (!result.valid) {
      const expired = result.code === "PASSWORD_RESET_TOKEN_EXPIRED";

      return res.status(expired ? 410 : 400).json({
        success: false,
        message: expired
          ? "Password reset link has expired."
          : "Password reset link is invalid or has already been used.",
        code: result.code,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const { data: resetResult, error: passwordUpdateError } = await supabase.rpc(
      "consume_password_reset",
      { p_token_hash: hashPasswordResetToken(rawToken), p_password_hash: passwordHash },
    );

    if (passwordUpdateError || resetResult !== true) {
      return res.status(500).json({
        success: false,
        message: "Password could not be updated.",
        code: "PASSWORD_UPDATE_FAILED",
      });
    }

    await revokeActivePasswordResetTokens(result.user.user_id);

    return res.status(200).json({
      success: true,
      message: "Your password has been updated successfully.",
    });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400 ? error.message : "Password could not be updated.",
      code:
        statusCode === 400 ? error.code : "PASSWORD_UPDATE_FAILED",
    });
  }
};

module.exports = {
  requestPasswordReset,
  validatePasswordResetToken,
  resetPassword,
};
