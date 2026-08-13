const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const { requestContext, globalLimiter } = require("./middlewares/security");
const {
  getPublicTurnstileConfig,
} = require("./services/turnstileService");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const productionOrigins = new Set([
  "https://snapupevents.com",
  "https://www.snapupevents.com",
  ...configuredOrigins,
]);
const developmentOrigins = new Set([
  ...productionOrigins,
  "https://snapup-events.pages.dev",
  "https://snapup-events.netlify.app",
]);

function isAllowedOrigin(origin) {
  // Postman, curl and server-to-server requests usually do not send Origin.
  if (!origin) {
    return true;
  }

  const allowedOrigins = process.env.NODE_ENV === "production"
    ? productionOrigins
    : developmentOrigins;

  if (allowedOrigins.has(origin)) {
    return true;
  }

  if (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true;
  }

  // Allow Cloudflare Pages preview deployment addresses such as:
  // https://a09a7da4.snapup-events.pages.dev
  return process.env.NODE_ENV !== "production" &&
    /^https:\/\/[a-z0-9-]+\.snapup-events\.pages\.dev$/i.test(origin);
}

app.use(requestContext);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer" },
  strictTransportSecurity: process.env.NODE_ENV === "production"
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,
}));
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  next();
});
app.use(globalLimiter);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      const corsError = new Error(`CORS blocked origin: ${origin}`);
      corsError.code = "CORS_ORIGIN_NOT_ALLOWED";
      return callback(corsError);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Guest-Token", "X-Like-Key", "X-Request-Id"],
    exposedHeaders: [
      "Content-Disposition",
      "X-SnapUp-PDF-Engine",
      "X-SnapUp-PDF-Design",
      "X-Memory-Book-Photos",
      "X-Memory-Book-Skipped",
    ],
    credentials: true,
  }),
);
app.use((req, res, next) => {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const cookieAuth = /(?:^|;\s*)(?:__Host-)?snapup_session=/.test(String(req.headers.cookie || ""));
  const origin = req.get("origin");
  if (unsafe && cookieAuth && (!origin || !isAllowedOrigin(origin))) {
    return res.status(403).json({ success: false, message: "Request origin is not allowed.", code: "CSRF_ORIGIN_REJECTED" });
  }
  next();
});
app.use(express.json({ limit: "256kb", strict: true }));

app.get("/api/security/turnstile-config", (_req, res) => {
  const config = getPublicTurnstileConfig();

  res.setHeader("Cache-Control", "no-store");

  if (!config.ready) {
    return res.status(503).json({
      success: false,
      message: "Security verification is not configured.",
      code: "TURNSTILE_NOT_CONFIGURED",
    });
  }

  return res.status(200).json({
    success: true,
    enabled: config.enabled,
    site_key: config.siteKey,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/feedback", feedbackRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SnapUp Backend çalışıyor",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
  });
});

app.use((error, req, res, next) => {
  if (error?.code === "CORS_ORIGIN_NOT_ALLOWED") {
    return res.status(403).json({
      success: false,
      message: "Bu kaynaktan gelen isteğe izin verilmiyor.",
      code: "CORS_ORIGIN_NOT_ALLOWED",
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Gönderilen davetiye taslağı çok büyük.",
      code: "INVITATION_PAYLOAD_TOO_LARGE",
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Gönderilen JSON verisi geçersiz.",
      code: "INVALID_JSON_BODY",
    });
  }

  console.error(JSON.stringify({
    level: "error",
    request_id: req.requestId,
    message: error?.message || "Unhandled error",
    code: error?.code,
  }));
  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.statusCode && error.statusCode < 500
      ? error.message
      : "Unexpected server error.",
    code: error?.code || "INTERNAL_ERROR",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route bulunamadı.",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
