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
} = require("../controllers/eventController");

router.post("/", authMiddleware, createEvent);

router.get("/detail/:eventId", authMiddleware, getEventDetail);

router.put("/detail/:eventId/settings", authMiddleware, updateEventSettings);

router.delete("/detail/:eventId", authMiddleware, deleteEvent);

router.get("/:eventCode/gallery", getPublicEventGallery);

router.get("/:eventCode", getEventByCode);

router.get("/detail/:eventId/guests", authMiddleware, getEventGuests);

module.exports = router;
