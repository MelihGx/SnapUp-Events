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

const {
  requestPasswordReset,
  validatePasswordResetToken,
  resetPassword,
} = require("../controllers/passwordResetController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", requestPasswordReset);
router.post("/validate-reset-token", validatePasswordResetToken);
router.post("/reset-password", resetPassword);
router.post(
  "/resend-verification",
  authMiddleware,
  resendVerificationEmail,
);
router.get("/me", authMiddleware, getMe);

module.exports = router;
