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
const requireTurnstile = require("../middlewares/turnstile");
const { authLimiter, emailLimiter } = require("../middlewares/security");
const { clearAuthCookie } = require("../utils/authCookie");

const {
  requestPasswordReset,
  validatePasswordResetToken,
  resetPassword,
} = require("../controllers/passwordResetController");

router.post("/register", authLimiter, requireTurnstile("register"), register);
router.post("/login", authLimiter, requireTurnstile("login"), login);
router.post("/verify-email", authLimiter, verifyEmail);
router.post(
  "/forgot-password",
  emailLimiter,
  requireTurnstile("password_reset"),
  requestPasswordReset,
);
router.post("/validate-reset-token", authLimiter, validatePasswordResetToken);
router.post("/reset-password", authLimiter, resetPassword);
router.post(
  "/resend-verification",
  emailLimiter,
  authMiddleware,
  resendVerificationEmail,
);
router.get("/me", authMiddleware, getMe);
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true });
});

module.exports = router;
