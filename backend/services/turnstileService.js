const crypto = require("crypto");

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_TOKEN_LENGTH = 2_048;

function isTurnstileEnabled() {
  return /^(1|true|yes|on)$/i.test(
    String(process.env.TURNSTILE_ENABLED || "").trim(),
  );
}

function getAllowedHostnames() {
  const configured = String(process.env.TURNSTILE_ALLOWED_HOSTNAMES || "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    configured.push("localhost", "127.0.0.1");
  }

  return new Set(configured);
}

function getPublicTurnstileConfig() {
  const enabled = isTurnstileEnabled();
  const siteKey = String(process.env.TURNSTILE_SITE_KEY || "").trim();

  return {
    enabled,
    siteKey: enabled ? siteKey : "",
    ready: !enabled || Boolean(siteKey),
  };
}

function getVerificationTimeoutMs() {
  const configured = Number(process.env.TURNSTILE_VERIFY_TIMEOUT_MS);

  if (!Number.isFinite(configured)) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(Math.max(configured, 2_000), 15_000);
}

async function requestSiteverify({ token, remoteIp, idempotencyKey }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    getVerificationTimeoutMs(),
  );
  const body = new URLSearchParams({
    secret: String(process.env.TURNSTILE_SECRET_KEY || "").trim(),
    response: token,
    idempotency_key: idempotencyKey,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`Turnstile Siteverify returned ${response.status}.`);
      error.temporary = response.status >= 500;
      throw error;
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateTurnstileToken({ token, remoteIp }) {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) {
    return {
      success: false,
      reason: "invalid_token_format",
      errorCodes: ["invalid-input-response"],
    };
  }

  const idempotencyKey = crypto.randomUUID();
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await requestSiteverify({
        token,
        remoteIp,
        idempotencyKey,
      });
      const errorCodes = Array.isArray(result?.["error-codes"])
        ? result["error-codes"]
        : [];

      if (
        attempt === 0 &&
        result?.success !== true &&
        errorCodes.includes("internal-error")
      ) {
        continue;
      }

      return {
        success: result?.success === true,
        hostname: String(result?.hostname || "").toLowerCase(),
        action: String(result?.action || ""),
        challengeTs: result?.challenge_ts || null,
        errorCodes,
      };
    } catch (error) {
      lastError = error;

      if (attempt === 0 && (error?.temporary || error?.name === "AbortError")) {
        continue;
      }
    }
  }

  return {
    success: false,
    unavailable: true,
    reason: lastError?.name === "AbortError" ? "timeout" : "network_error",
    errorCodes: ["internal-error"],
  };
}

module.exports = {
  getAllowedHostnames,
  getPublicTurnstileConfig,
  isTurnstileEnabled,
  validateTurnstileToken,
};
