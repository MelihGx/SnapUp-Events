const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  createEvent,
  getEventByCode,
  getEventDetail,
  updateEventSettings,
  deleteEvent,
  getEventGuests,
  getPublicEventGallery,
  downloadEventMemoryBookV3,
  downloadPublicMemoryBook,
} = require("../controllers/eventController");

router.post("/", authMiddleware, createEvent);

router.get("/detail/:eventId", authMiddleware, getEventDetail);
router.get("/detail/:eventId/guests", authMiddleware, getEventGuests);

router.get(
  "/detail/:eventId/memory-book-v3",
  authMiddleware,
  downloadEventMemoryBookV3,
);

router.put("/detail/:eventId/settings", authMiddleware, updateEventSettings);

router.delete("/detail/:eventId", authMiddleware, deleteEvent);

router.get("/:eventCode/memory-book", downloadPublicMemoryBook);

router.get("/:eventCode/gallery", getPublicEventGallery);

router.get("/:eventCode", getEventByCode);

module.exports = router;
