const express = require("express");
const {
  getPublicTurnstileConfig,
} = require("../middlewares/turnstile");

const router = express.Router();

router.get("/turnstile", getPublicTurnstileConfig);

module.exports = router;
