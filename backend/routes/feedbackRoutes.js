const express = require("express");
const { submitFeedback } = require("../controllers/feedbackController");
const optionalAuth = require("../middlewares/optionalAuth");
const { feedbackLimiter } = require("../middlewares/security");
const requireTurnstile = require("../middlewares/turnstile");

const router = express.Router();

router.post(
  "/",
  feedbackLimiter,
  requireTurnstile("feedback"),
  optionalAuth,
  submitFeedback,
);

module.exports = router;
