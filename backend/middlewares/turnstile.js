const { securityEvent } = require("./security");
const {
  getAllowedHostnames,
  isTurnstileEnabled,
  validateTurnstileToken,
} = require("../services/turnstileService");

function requireTurnstile(expectedAction) {
  if (!/^[a-z0-9_-]{1,32}$/i.test(String(expectedAction || ""))) {
    throw new Error("A valid Turnstile action is required.");
  }

  return async function turnstileMiddleware(req, res, next) {
    if (!isTurnstileEnabled()) {
      return next();
    }

    const secretKey = String(process.env.TURNSTILE_SECRET_KEY || "").trim();
    const allowedHostnames = getAllowedHostnames();

    if (!secretKey || allowedHostnames.size === 0) {
      securityEvent("turnstile_configuration_error", req, {
        action: expectedAction,
      });
      return res.status(503).json({
        success: false,
        message: "Security verification is temporarily unavailable.",
        code: "TURNSTILE_NOT_CONFIGURED",
      });
    }

    const token = String(
      req.body?.turnstile_token ||
        req.body?.["cf-turnstile-response"] ||
        "",
    ).trim();

    if (req.body && typeof req.body === "object") {
      delete req.body.turnstile_token;
      delete req.body["cf-turnstile-response"];
    }

    if (!token || token.length > 2_048) {
      securityEvent("turnstile_missing", req, { action: expectedAction });
      return res.status(400).json({
        success: false,
        message: "Please complete the security verification.",
        code: "TURNSTILE_REQUIRED",
      });
    }

    const result = await validateTurnstileToken({
      token,
      remoteIp: req.ip,
    });

    if (result.unavailable) {
      securityEvent("turnstile_unavailable", req, {
        action: expectedAction,
        reason: result.reason,
      });
      return res.status(503).json({
        success: false,
        message: "Security verification is temporarily unavailable.",
        code: "TURNSTILE_UNAVAILABLE",
      });
    }

    const actionMatches = result.action === expectedAction;
    const hostnameMatches = allowedHostnames.has(result.hostname);

    if (!result.success || !actionMatches || !hostnameMatches) {
      securityEvent("turnstile_rejected", req, {
        action: expectedAction,
        verified_action: result.action || null,
        hostname: result.hostname || null,
        reason: !result.success
          ? "siteverify_failed"
          : !actionMatches
            ? "action_mismatch"
            : "hostname_mismatch",
        error_codes: result.errorCodes,
      });
      return res.status(403).json({
        success: false,
        message: "Security verification failed. Please try again.",
        code: "TURNSTILE_FAILED",
      });
    }

    req.turnstile = {
      action: result.action,
      hostname: result.hostname,
      challenge_ts: result.challengeTs,
    };

    return next();
  };
}

module.exports = requireTurnstile;
