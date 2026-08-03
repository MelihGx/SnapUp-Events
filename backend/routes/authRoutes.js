const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerificationEmail,
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  authMiddleware,
  resendVerificationEmail,
);
router.get("/me", authMiddleware, getMe);

module.exports = router;
