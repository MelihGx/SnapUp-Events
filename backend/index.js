const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const mediaRoutes = require("./routes/mediaRoutes");

const app = express();

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "https://snapupevents.com",
  "https://www.snapupevents.com",
  "https://snapup-events.pages.dev",
  "https://snapup-events.netlify.app",
  ...configuredOrigins,
]);

function isAllowedOrigin(origin) {
  // Postman, curl and server-to-server requests usually do not send Origin.
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Allow local frontend development on any localhost port.
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true;
  }

  // Allow Cloudflare Pages preview deployment addresses such as:
  // https://a09a7da4.snapup-events.pages.dev
  return /^https:\/\/[a-z0-9-]+\.snapup-events\.pages\.dev$/i.test(origin);
}

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
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "Content-Disposition",
      "X-SnapUp-PDF-Engine",
      "X-SnapUp-PDF-Design",
      "X-Memory-Book-Photos",
      "X-Memory-Book-Skipped",
    ],
  }),
);
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/media", mediaRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SnapUp Backend çalışıyor",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend bağlantısı başarılı",
    project: "SnapUp Events",
    pdf_engine: "memory-book-v3",
    invitation_drafts: "v4-delete-popup-limit-3",
    event_cover: "v4-owner-change-remove-account-card",
    location_details: "v2-map-pin-owner-edit",
    event_delete_feedback: "v1-success-popup",
    email_verification: "v1-resend-token-hash",
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

  return next(error);
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
