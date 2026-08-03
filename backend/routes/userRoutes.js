const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  getMyEvents,
  changeMyPassword,
  deleteMyAccount,
} = require("../controllers/userController");

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me/events", authMiddleware, getMyEvents);
router.put("/me/password", authMiddleware, changeMyPassword);
router.delete("/me", authMiddleware, deleteMyAccount);

module.exports = router;
