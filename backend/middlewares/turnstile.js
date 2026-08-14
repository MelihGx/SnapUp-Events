const crypto = require("crypto");
const { securityEvent } = require("./security");

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;
const MAX_TOKEN_LENGTH = 2_048;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(
    String(value || "").trim().toLowerCase(),
  );
}

function normalizeHostname(value) {
  let hostname = String(value || "").trim().toLowerCase();
  if (!hostname) return "";

  try {
    if (hostname.includes("://")) {
      hostname = new URL(hostname).hostname;
    } else {
      hostname = hostname.split("/")[0];
      if (hostname.startsWith("[")) {
        const closingBracket = hostname.indexOf("]");
        hostname = closingBracket > 0
          ? hostname.slice(1, closingBracket)
          : hostname;
      } else {
        hostname = hostname.split(":")[0];
      }
    }
  } catch (_error) {
    return "";
  }

  return hostname.replace(/\.$/, "");
}

function getAllowedHostnames() {
  return new Set(
    String(process.env.TURNSTILE_ALLOWED_HOSTNAMES || "")
      .split(",")
      .map(normalizeHostname)
      .filter(Boolean),
  );
}

function isLocalHostname(value) {
  return LOCAL_HOSTNAMES.has(normalizeHostname(value));
}

function isTurnstileRequired() {
  return isTruthy(process.env.TURNSTILE_ENABLED);
}

function hasTurnstileConfiguration() {
  return Boolean(
    String(process.env.TURNSTILE_SITE_KEY || "").trim() &&
      String(process.env.TURNSTILE_SECRET_KEY || "").trim(),
  );
}

function getTurnstileToken(req) {
  return String(
    req.body?.turnstile_token ||
      req.body?.["cf-turnstile-response"] ||
      req.get("x-turnstile-token") ||
      "",
  ).trim();
}

async function requestSiteverify({ token, remoteIp, idempotencyKey }) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const payload = {
        secret: String(process.env.TURNSTILE_SECRET_KEY || "").trim(),
        response: token,
        idempotency_key: idempotencyKey,
      };

      if (remoteIp) payload.remoteip = remoteIp;

      const response = await fetch(SITEVERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TURNSTILE_SITEVERIFY_HTTP_${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("TURNSTILE_SITEVERIFY_UNAVAILABLE");
}

function getPublicTurnstileConfig(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!isTurnstileRequired(req)) {
    return res.status(200).json({ success: true, enabled: false });
  }

  if (!hasTurnstileConfiguration()) {
    securityEvent("turnstile_configuration_error", req);
    return res.status(503).json({
      success: false,
      message: "Security verification is temporarily unavailable.",
      code: "BOT_PROTECTION_NOT_CONFIGURED",
    });
  }

  return res.status(200).json({
    success: true,
    enabled: true,
    site_key: String(process.env.TURNSTILE_SITE_KEY).trim(),
  });
}

function verifyTurnstile(expectedAction) {
  const normalizedExpectedAction = String(expectedAction || "").trim();

  return async function turnstileMiddleware(req, res, next) {
    if (!isTurnstileRequired(req)) return next();

    if (!hasTurnstileConfiguration()) {
      securityEvent("turnstile_configuration_error", req, {
        action: normalizedExpectedAction,
      });
      return res.status(503).json({
        success: false,
        message: "Security verification is temporarily unavailable.",
        code: "BOT_PROTECTION_NOT_CONFIGURED",
      });
    }

    const token = getTurnstileToken(req);
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      securityEvent("turnstile_token_missing", req, {
        action: normalizedExpectedAction,
      });
      return res.status(400).json({
        success: false,
        message: "Please complete the security verification.",
        code: "BOT_VERIFICATION_REQUIRED",
      });
    }

    let result;
    try {
      result = await requestSiteverify({
        token,
        remoteIp: req.ip,
        idempotencyKey: crypto.randomUUID(),
      });
    } catch (error) {
      securityEvent("turnstile_siteverify_unavailable", req, {
        action: normalizedExpectedAction,
        reason: error?.name === "AbortError" ? "timeout" : "network_error",
      });
      return res.status(503).json({
        success: false,
        message: "Security verification is temporarily unavailable. Please try again.",
        code: "BOT_VERIFICATION_UNAVAILABLE",
      });
    }

    const responseHostname = normalizeHostname(result?.hostname);
    const allowedHostnames = getAllowedHostnames();
    const actionMatches =
      !normalizedExpectedAction || result?.action === normalizedExpectedAction;
    const isLocalVerification =
      isLocalHostname(req.hostname || req.get("host")) &&
      isLocalHostname(responseHostname);
    const hostnameMatches =
      allowedHostnames.size === 0 ||
      allowedHostnames.has(responseHostname) ||
      isLocalVerification;

    if (result?.success !== true || !actionMatches || !hostnameMatches) {
      securityEvent("turnstile_rejected", req, {
        action: normalizedExpectedAction,
        returned_action: String(result?.action || "").slice(0, 64),
        hostname: responseHostname,
        error_codes: Array.isArray(result?.["error-codes"])
          ? result["error-codes"].slice(0, 8)
          : [],
      });
      return res.status(403).json({
        success: false,
        message: "Security verification failed. Please try again.",
        code: "BOT_VERIFICATION_FAILED",
      });
    }

    req.turnstile = {
      action: result.action,
      hostname: responseHostname,
      challengeTimestamp: result.challenge_ts,
    };

    return next();
  };
}

module.exports = {
  getPublicTurnstileConfig,
  verifyTurnstile,
};
