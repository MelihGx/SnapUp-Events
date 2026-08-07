const crypto = require("crypto");

const EVENT_CODE_SPACE = 1_000_000;

function generateEventCode() {
  return crypto
    .randomInt(0, EVENT_CODE_SPACE)
    .toString()
    .padStart(6, "0");
}

function isSixDigitEventCode(value) {
  return /^\d{6}$/.test(String(value || ""));
}

module.exports = {
  generateEventCode,
  isSixDigitEventCode,
};
