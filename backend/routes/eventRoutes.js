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
  downloadEventSlideshow,
} = require("../controllers/eventController");

router.post("/", authMiddleware, createEvent);

router.get("/detail/:eventId", authMiddleware, getEventDetail);
router.get("/detail/:eventId/guests", authMiddleware, getEventGuests);
router.get(
  "/detail/:eventId/slideshow",
  authMiddleware,
  downloadEventSlideshow,
);

router.put("/detail/:eventId/settings", authMiddleware, updateEventSettings);

router.delete("/detail/:eventId", authMiddleware, deleteEvent);

router.get("/:eventCode/gallery", getPublicEventGallery);

router.get("/:eventCode", getEventByCode);

module.exports = router;
