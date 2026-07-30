const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const mediaRoutes = require("./routes/mediaRoutes");

const app = express();

app.use(
  cors({
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
  });
});

app.use((error, req, res, next) => {
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
