const express = require("express");
const multer = require("multer");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  listEventInvitations,
  createEventInvitation,
  updateEventInvitation,
  deleteEventInvitation,
} = require("../controllers/invitationController");

const {
  createEvent,
  getEventByCode,
  getEventDetail,
  updateEventCover,
  removeEventCover,
  updateEventLocation,
  updateEventSettings,
  deleteEvent,
  getEventGuests,
  getPublicEventGallery,
  downloadEventMemoryBookV3,
  downloadPublicMemoryBook,
} = require("../controllers/eventController");

const eventCoverUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error(
        "Etkinlik fotoğrafı yalnız JPG, PNG veya WEBP olabilir.",
      );
      error.code = "INVALID_EVENT_COVER_TYPE";
      callback(error);
      return;
    }

    callback(null, true);
  },
}).single("event_cover");

function handleEventCoverUpload(req, res, next) {
  eventCoverUpload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Etkinlik fotoğrafı en fazla 8 MB olabilir.",
        code: "EVENT_COVER_TOO_LARGE",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Etkinlik fotoğrafı yüklenemedi.",
      code: error.code || "EVENT_COVER_UPLOAD_FAILED",
    });
  });
}

router.post("/", authMiddleware, handleEventCoverUpload, createEvent);

router.get("/detail/:eventId", authMiddleware, getEventDetail);
router.get("/detail/:eventId/guests", authMiddleware, getEventGuests);

router.get(
  "/detail/:eventId/invitations",
  authMiddleware,
  listEventInvitations,
);
router.post(
  "/detail/:eventId/invitations",
  authMiddleware,
  createEventInvitation,
);
router.put(
  "/detail/:eventId/invitations/:invitationId",
  authMiddleware,
  updateEventInvitation,
);
router.delete(
  "/detail/:eventId/invitations/:invitationId",
  authMiddleware,
  deleteEventInvitation,
);

router.get(
  "/detail/:eventId/memory-book-v3",
  authMiddleware,
  downloadEventMemoryBookV3,
);

router.put(
  "/detail/:eventId/cover",
  authMiddleware,
  handleEventCoverUpload,
  updateEventCover,
);
router.delete(
  "/detail/:eventId/cover",
  authMiddleware,
  removeEventCover,
);

router.put(
  "/detail/:eventId/location",
  authMiddleware,
  updateEventLocation,
);

router.put("/detail/:eventId/settings", authMiddleware, updateEventSettings);

router.delete("/detail/:eventId", authMiddleware, deleteEvent);

router.get("/:eventCode/memory-book", downloadPublicMemoryBook);

router.get("/:eventCode/gallery", getPublicEventGallery);

router.get("/:eventCode", getEventByCode);

module.exports = router;
