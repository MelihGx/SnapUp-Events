const crypto = require("crypto");
const { rateLimit } = require("express-rate-limit");
const { signAssetUrls } = require("../services/cloudinaryDelivery");

function requestContext(req, res, next) {
  const requestId = String(
    req.get("x-request-id") || crypto.randomUUID(),
  ).slice(0, 128);
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    body = signAssetUrls(body);
    if (
      process.env.NODE_ENV === "production" &&
      body &&
      typeof body === "object"
    ) {
      const safeBody = { ...body };
      delete safeBody.error;
      delete safeBody.details;
      delete safeBody.uploaded_cloudinary;
      delete safeBody.cloudinary;
      if (res.statusCode >= 500) safeBody.request_id = requestId;
      return originalJson(safeBody);
    }
    return originalJson(body);
  };
  next();
}

function securityEvent(name, req, details = {}) {
  console.warn(
    JSON.stringify({
      level: "security",
      event: name,
      request_id: req.requestId,
      method: req.method,
      path: req.originalUrl?.split("?")[0],
      ip: req.ip,
      ...details,
    }),
  );
}

function makeLimiter({ windowMs, limit, keyGenerator, name }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator,
    handler(req, res, _next, options) {
      securityEvent("rate_limit", req, { limiter: name });
      res.setHeader("Retry-After", Math.ceil(options.windowMs / 1000));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        code: "RATE_LIMITED",
      });
    },
  });
}

const globalLimiter = makeLimiter({
  windowMs: 60_000,
  limit: 180,
  name: "global",
});
const authLimiter = makeLimiter({
  windowMs: 15 * 60_000,
  limit: 10,
  name: "auth",
});
const emailLimiter = makeLimiter({
  windowMs: 60 * 60_000,
  limit: 5,
  name: "email",
});
const eventCodeLimiter = makeLimiter({
  windowMs: 10 * 60_000,
  limit: 30,
  name: "event-code",
});
const guestLimiter = makeLimiter({
  windowMs: 10 * 60_000,
  limit: 20,
  name: "guest",
});
const uploadLimiter = makeLimiter({
  windowMs: 10 * 60_000,
  limit: 12,
  name: "upload",
});
const likeLimiter = makeLimiter({ windowMs: 60_000, limit: 30, name: "like" });
const pdfLimiter = makeLimiter({
  windowMs: 60 * 60_000,
  limit: 3,
  name: "pdf",
});
const feedbackLimiter = makeLimiter({
  windowMs: 30 * 60_000,
  limit: 5,
  name: "feedback",
});

module.exports = {
  requestContext,
  securityEvent,
  globalLimiter,
  authLimiter,
  emailLimiter,
  eventCodeLimiter,
  guestLimiter,
  uploadLimiter,
  likeLimiter,
  pdfLimiter,
  feedbackLimiter,
};
