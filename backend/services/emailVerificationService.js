const crypto = require("node:crypto");
const supabase = require("../config/supabaseClient");

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

function getVerificationUrl(rawToken) {
  const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/+$/, "");

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL environment variable is missing.");
  }

  return `${frontendUrl}/verify-email.html?token=${encodeURIComponent(rawToken)}`;
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

async function sendVerificationEmail({ email, userName, rawToken }) {
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

  const verificationUrl = getVerificationUrl(rawToken);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Verify your SnapUp Events email",
      html: `
        <!doctype html>
        <html lang="en">
          <body style="margin:0;background:#f5efe6;font-family:Arial,sans-serif;color:#17120f;">
            <div style="max-width:600px;margin:0 auto;padding:32px 18px;">
              <div style="background:#fffaf3;border:1px solid rgba(23,18,15,.10);border-radius:24px;padding:32px;box-shadow:0 18px 50px rgba(23,18,15,.10);">
                <p style="margin:0 0 12px;color:#ff5a36;font-size:13px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;">SnapUp Events</p>
                <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;">Verify your email</h1>
                <p style="margin:0 0 12px;line-height:1.65;">Hello ${escapeHtml(userName)},</p>
                <p style="margin:0 0 24px;line-height:1.65;color:rgba(23,18,15,.70);">Confirm your email address to create and manage events on SnapUp Events.</p>
                <a href="${verificationUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#ff5a36;color:#ffffff;text-decoration:none;font-weight:800;">Verify Email</a>
                <p style="margin:24px 0 0;line-height:1.55;color:rgba(23,18,15,.58);font-size:13px;">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
              </div>
            </div>
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

async function issueAndSendVerificationEmail({ userId, email, userName }) {
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
