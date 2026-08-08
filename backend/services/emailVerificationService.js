const crypto = require("node:crypto");
const supabase = require("../config/supabaseClient");
const {
  getEmailCopy,
  normalizeEmailLanguage,
} = require("./emailTranslations");

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function createRawVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashVerificationToken(rawToken) {
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

function formatEmailText(template, replacements = {}) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{{${key}}}`, String(value ?? "")),
    String(template || ""),
  );
}

function getVerificationUrl(rawToken, languageCode) {
  const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/+$/, "");

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL environment variable is missing.");
  }

  const language = normalizeEmailLanguage(languageCode);
  return `${frontendUrl}/verify-email.html?token=${encodeURIComponent(rawToken)}&lang=${encodeURIComponent(language)}`;
}

async function revokeActiveVerificationTokens(userId) {
  const { error } = await supabase
    .from("email_verification_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null)
    .is("revoked_at", null);

  if (error) {
    throw new Error(`Old verification tokens could not be revoked: ${error.message}`);
  }
}

async function createVerificationToken(userId, email) {
  const rawToken = createRawVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString();

  const { data: verificationToken, error } = await supabase
    .from("email_verification_tokens")
    .insert({
      user_id: userId,
      email_address: String(email).toLowerCase().trim(),
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("verification_id, expires_at, created_at")
    .single();

  if (error) {
    throw new Error(`Verification token could not be created: ${error.message}`);
  }

  return {
    rawToken,
    verificationToken,
  };
}

async function sendVerificationEmail({
  email,
  userName,
  rawToken,
  languageCode,
}) {
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

  const { language, metadata, copy } = getEmailCopy(languageCode);
  const verificationUrl = getVerificationUrl(rawToken, language);
  const displayName = userName || copy.common.fallbackName;
  const helloText = formatEmailText(copy.common.hello, { name: displayName });
  const safeHelloText = escapeHtml(helloText);
  const safeVerificationUrl = escapeHtml(verificationUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: copy.verification.subject,
      text: [
        helloText,
        "",
        copy.verification.textWelcome,
        "",
        verificationUrl,
        "",
        copy.verification.textExpires,
        copy.verification.textIgnore,
      ].join("\n"),
      html: `
        <!doctype html>
        <html lang="${language}" dir="${metadata.direction}">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="color-scheme" content="light dark" />
            <meta name="supported-color-schemes" content="light dark" />
            <title>${escapeHtml(copy.verification.documentTitle)}</title>
          </head>
          <body dir="${metadata.direction}" style="margin:0;padding:0;background-color:#0d0720;color:#171226;font-family:Arial,Helvetica,sans-serif;direction:${metadata.direction};">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              ${escapeHtml(copy.verification.preheader)}
            </div>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#0d0720;background-image:linear-gradient(135deg,#0d0720 0%,#1b1034 52%,#30152f 100%);">
              <tr>
                <td align="center" style="padding:42px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;">
                    <tr>
                      <td style="padding:0 4px 18px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td valign="middle">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td width="42" height="42" align="center" valign="middle" style="width:42px;height:42px;border-radius:50%;background-color:#19112d;border:1px solid #4f386f;color:#ffffff;font-size:18px;font-weight:800;">
                                    ◎
                                  </td>
                                  <td style="padding-left:12px;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">
                                    SnapUp<span style="color:#ff4f8b;">Events</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td align="right" valign="middle" style="color:#cbbfe1;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
                              ${escapeHtml(copy.verification.headerLabel)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="background-color:#fffaf6;border:1px solid #4a335f;border-radius:28px;box-shadow:0 28px 70px rgba(0,0,0,.32);overflow:hidden;">
                        <div style="height:7px;background-color:#9a35ed;background-image:linear-gradient(90deg,#9336ef 0%,#ed2f77 55%,#ff6544 100%);font-size:0;line-height:0;">&nbsp;</div>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="padding:42px 42px 20px;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td width="64" height="64" align="center" valign="middle" style="width:64px;height:64px;border-radius:20px;background-color:#efe5fa;border:1px solid #dec8f3;color:#7336ef;font-size:30px;line-height:64px;">
                                    ✉
                                  </td>
                                </tr>
                              </table>

                              <p style="margin:26px 0 8px;color:#ee3d76;font-size:12px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase;">
                                ${escapeHtml(copy.verification.eyebrow)}
                              </p>

                              <h1 style="margin:0;color:#171226;font-size:36px;line-height:1.12;letter-spacing:-1.2px;font-weight:900;">
                                ${escapeHtml(copy.verification.heading)}
                              </h1>

                              <p style="margin:22px 0 0;color:#4e465c;font-size:16px;line-height:1.75;">
                                ${safeHelloText}
                              </p>

                              <p style="margin:10px 0 0;color:#6b6275;font-size:16px;line-height:1.75;">
                                ${escapeHtml(copy.verification.introduction)}
                              </p>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:8px 42px 14px;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td align="center" style="border-radius:16px;background-color:#9336ef;background-image:linear-gradient(90deg,#9336ef 0%,#ed2f77 55%,#ff6544 100%);box-shadow:0 16px 32px rgba(194,45,137,.28);">
                                    <a href="${safeVerificationUrl}" target="_blank" style="display:block;padding:17px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:900;line-height:1.2;border-radius:16px;">
                                      ${escapeHtml(copy.verification.button)}
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:10px 42px 38px;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3edf7;border:1px solid #e4d7ec;border-radius:18px;">
                                <tr>
                                  <td style="padding:18px 20px;color:#655b70;font-size:13px;line-height:1.65;">
                                    <strong style="color:#2b2037;">${escapeHtml(copy.verification.secureLabel)}</strong> ${escapeHtml(copy.verification.secureText)}
                                  </td>
                                </tr>
                              </table>

                              <p style="margin:24px 0 8px;color:#8a8094;font-size:12px;line-height:1.6;">
                                ${escapeHtml(copy.common.buttonFallback)}
                              </p>
                              <p style="margin:0;word-break:break-all;color:#7441c8;font-size:12px;line-height:1.55;">
                                <a href="${safeVerificationUrl}" style="color:#7441c8;text-decoration:underline;">${safeVerificationUrl}</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding:22px 18px 0;color:#a99bbb;font-size:12px;line-height:1.6;">
                        SnapUp Events · ${escapeHtml(copy.common.footerTagline)}<br />
                        ${escapeHtml(copy.common.footerSecurity)}
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
      result?.message || result?.error?.message || "Verification email could not be sent.",
    );
  }

  return result;
}

async function issueAndSendVerificationEmail({
  userId,
  email,
  userName,
  languageCode,
}) {
  await revokeActiveVerificationTokens(userId);
  const { rawToken, verificationToken } = await createVerificationToken(
    userId,
    email,
  );

  try {
    const emailResult = await sendVerificationEmail({
      email,
      userName,
      rawToken,
      languageCode,
    });

    return {
      emailResult,
      expiresAt: verificationToken.expires_at,
    };
  } catch (error) {
    await supabase
      .from("email_verification_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("verification_id", verificationToken.verification_id);

    throw error;
  }
}

module.exports = {
  RESEND_COOLDOWN_MS,
  hashVerificationToken,
  issueAndSendVerificationEmail,
  revokeActiveVerificationTokens,
};
