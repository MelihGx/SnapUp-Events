const crypto = require("crypto");

const EVENT_CODE_LENGTH = 6;
const EVENT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EVENT_CODE_PATTERN = /^(?=.*[A-HJ-NP-Z])(?=.*[2-9])[A-HJ-NP-Z2-9]{6}$/;

function generateEventCode() {
  let code = "";

  do {
    code = "";

    for (let index = 0; index < EVENT_CODE_LENGTH; index += 1) {
      code += EVENT_CODE_ALPHABET[
        crypto.randomInt(0, EVENT_CODE_ALPHABET.length)
      ];
    }
  } while (!EVENT_CODE_PATTERN.test(code));

  return code;
}

function isSixCharacterEventCode(value) {
  return EVENT_CODE_PATTERN.test(String(value || "").trim().toUpperCase());
}

module.exports = {
  EVENT_CODE_ALPHABET,
  generateEventCode,
  isSixCharacterEventCode,
};
