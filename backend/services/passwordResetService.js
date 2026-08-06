const crypto = require("node:crypto");
const supabase = require("../config/supabaseClient");

const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;
const DEFAULT_EMAIL_LOGO_URL =
  "https://snapupevents.com/icon/snapup-brand-mark-fixed-v3.png";

function createRawPasswordResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashPasswordResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

function getPasswordResetUrl(rawToken) {
  const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/+$/, "");

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL environment variable is missing.");
  }

  return `${frontendUrl}/reset-password.html?token=${encodeURIComponent(rawToken)}`;
}

function getEmailLogoUrl() {
  return String(process.env.EMAIL_LOGO_URL || DEFAULT_EMAIL_LOGO_URL).trim();
}

async function revokeActivePasswordResetTokens(userId) {
  const { error } = await supabase
    .from("password_reset_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null)
    .is("revoked_at", null);

  if (error) {
    throw new Error(`Old password reset tokens could not be revoked: ${error.message}`);
  }
}

async function createPasswordResetToken(userId, email) {
  const rawToken = createRawPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_TTL_MS,
  ).toISOString();

  const { data: resetToken, error } = await supabase
    .from("password_reset_tokens")
    .insert({
      user_id: userId,
      email_address: String(email).toLowerCase().trim(),
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("reset_id, expires_at, created_at")
    .single();

  if (error) {
    throw new Error(`Password reset token could not be created: ${error.message}`);
  }

  return {
    rawToken,
    resetToken,
  };
}

async function sendPasswordResetEmail({ email, userName, rawToken }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is missing.");
  }

  if (!from) {
    throw new Error("EMAIL_FROM environment variable is missing.");
  }

  if (typeof fetch !== "function") {
    throw new Error("This backend requires Node.js 18 or newer for email sending.");
  }

  const resetUrl = getPasswordResetUrl(rawToken);
  const safeUserName = escapeHtml(userName || "there");
  const safeResetUrl = escapeHtml(resetUrl);
  const safeLogoUrl = escapeHtml(getEmailLogoUrl());

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your password — SnapUp Events",
      text: [
        `Hello ${userName || "there"},`,
        "",
        "We received a request to reset your SnapUp Events password.",
        "",
        resetUrl,
        "",
        "This reset link expires in 30 minutes and can only be used once.",
        "If you did not request a password reset, you can safely ignore this email.",
      ].join("\n"),
      html: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="color-scheme" content="light only" />
            <meta name="supported-color-schemes" content="light" />
            <title>Reset your SnapUp Events password</title>
            <style>
              @media only screen and (max-width: 620px) {
                .email-shell { padding: 20px 10px !important; }
                .email-card { border-radius: 22px !important; }
                .email-header { padding: 22px 22px !important; }
                .email-body { padding: 30px 22px 26px !important; }
                .email-title { font-size: 31px !important; line-height: 1.12 !important; }
                .email-button { padding: 16px 18px !important; }
                .brand-text { font-size: 20px !important; }
              }
            </style>
          </head>
          <body style="margin:0;padding:0;background-color:#0b071c;color:#201a35;font-family:Inter,Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              Use this secure, single-use link to reset your SnapUp Events password.
            </div>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#0b071c;background-image:linear-gradient(135deg,#0b071c 0%,#1b0d3a 48%,#32152d 100%);">
              <tr>
                <td class="email-shell" align="center" style="padding:46px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:590px;">
                    <tr>
                      <td class="email-card" style="overflow:hidden;background-color:#fffaf6;border:1px solid rgba(255,255,255,.14);border-radius:30px;box-shadow:0 28px 80px rgba(0,0,0,.36);">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="height:7px;background-color:#ec4899;background-image:linear-gradient(90deg,#7c3aed 0%,#ec4899 42%,#ff6b4a 78%,#22d3c5 100%);font-size:0;line-height:0;">&nbsp;</td>
                          </tr>

                          <tr>
                            <td class="email-header" style="padding:26px 34px;background-color:#17122b;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td valign="middle">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                      <tr>
                                        <td width="48" height="48" valign="middle" style="width:48px;height:48px;">
                                          <img src="${safeLogoUrl}" width="48" height="48" alt="SnapUp Events" style="display:block;width:48px;height:48px;border:0;border-radius:50%;" />
                                        </td>
                                        <td class="brand-text" valign="middle" style="padding-left:13px;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-.8px;white-space:nowrap;">
                                          SnapUp<span style="color:#ec4899;">Events</span>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td align="right" valign="middle" style="color:#bdb4d2;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;">
                                    Account security
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td class="email-body" style="padding:40px 42px 36px;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td style="padding:8px 13px;border-radius:999px;background-color:#f8e9f1;color:#db2777;font-size:11px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;">
                                    Password recovery
                                  </td>
                                </tr>
                              </table>

                              <h1 class="email-title" style="margin:22px 0 0;color:#201a35;font-size:38px;line-height:1.08;letter-spacing:-1.5px;font-weight:900;">
                                Reset your password.
                              </h1>

                              <p style="margin:20px 0 0;color:#514a60;font-size:16px;line-height:1.7;">
                                Hello <strong style="color:#201a35;">${safeUserName}</strong>,
                              </p>
                              <p style="margin:8px 0 0;color:#6f687b;font-size:16px;line-height:1.7;">
                                We received a request to create a new password for your SnapUp Events account.
                              </p>

                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                                <tr>
                                  <td align="center" style="border-radius:16px;background-color:#ec4899;background-image:linear-gradient(90deg,#7c3aed 0%,#ec4899 52%,#ff6b4a 100%);box-shadow:0 16px 34px rgba(236,72,153,.28);">
                                    <a class="email-button" href="${safeResetUrl}" target="_blank" style="display:block;padding:17px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:900;line-height:1.2;border-radius:16px;">
                                      Create a new password
                                    </a>
                                  </td>
                                </tr>
                              </table>

                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;background-color:#f1f8f7;border:1px solid #cfe9e5;border-radius:18px;">
                                <tr>
                                  <td width="5" style="width:5px;background-color:#22d3c5;border-radius:18px 0 0 18px;font-size:0;line-height:0;">&nbsp;</td>
                                  <td style="padding:17px 18px;color:#5c5968;font-size:13px;line-height:1.65;">
                                    <strong style="color:#201a35;">Secure, single-use link.</strong>
                                    It expires in 30 minutes. If you did not request this change, your current password remains unchanged.
                                  </td>
                                </tr>
                              </table>

                              <p style="margin:24px 0 7px;color:#8a8492;font-size:12px;line-height:1.6;">
                                Button not working? Copy and paste this address into your browser:
                              </p>
                              <p style="margin:0;word-break:break-all;color:#7c3aed;font-size:12px;line-height:1.55;">
                                <a href="${safeResetUrl}" style="color:#7c3aed;text-decoration:underline;">${safeResetUrl}</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding:22px 18px 0;color:#a9a0bb;font-size:12px;line-height:1.7;">
                        <strong style="color:#ffffff;">SnapUp Events</strong><br />
                        Every guest. Every moment. One shared album.<br />
                        This is an automated account-security email.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error?.message ||
        "Password reset email could not be sent.",
    );
  }

  return result;
}

async function issueAndSendPasswordResetEmail({ userId, email, userName }) {
  await revokeActivePasswordResetTokens(userId);
  const { rawToken, resetToken } = await createPasswordResetToken(userId, email);

  try {
    const emailResult = await sendPasswordResetEmail({
      email,
      userName,
      rawToken,
    });

    return {
      emailResult,
      expiresAt: resetToken.expires_at,
    };
  } catch (error) {
    await supabase
      .from("password_reset_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("reset_id", resetToken.reset_id);

    throw error;
  }
}

module.exports = {
  PASSWORD_RESET_COOLDOWN_MS,
  hashPasswordResetToken,
  issueAndSendPasswordResetEmail,
  revokeActivePasswordResetTokens,
};
