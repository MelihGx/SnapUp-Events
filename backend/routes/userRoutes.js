const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  getMyEvents,
  changeMyPassword,
} = require("../controllers/userController");

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me/events", authMiddleware, getMyEvents);
router.put("/me/password", authMiddleware, changeMyPassword);

module.exports = router;
