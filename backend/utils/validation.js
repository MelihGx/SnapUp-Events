const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}$/;

function cleanText(value, { min = 0, max, field = "value" } = {}) {
  const text = String(value ?? "").trim();
  if (text.length < min || (max && text.length > max)) {
    const error = new Error(`${field} must be between ${min} and ${max} characters.`);
    error.statusCode = 400;
    error.code = "INVALID_INPUT";
    throw error;
  }
  return text;
}

function normalizeEmail(value) {
  const email = cleanText(value, { min: 3, max: 254, field: "email" }).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    const error = new Error("A valid email address is required.");
    error.statusCode = 400;
    error.code = "INVALID_EMAIL";
    throw error;
  }
  return email;
}

function validatePassword(value) {
  const password = String(value ?? "");
  const bytes = Buffer.byteLength(password, "utf8");
  if (password.length < 12 || bytes > 72) {
    const error = new Error("Password must be at least 12 characters and at most 72 UTF-8 bytes.");
    error.statusCode = 400;
    error.code = "INVALID_PASSWORD";
    throw error;
  }
  return password;
}

function boundedInteger(value, { min, max, field }) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    const error = new Error(`${field} must be an integer between ${min} and ${max}.`);
    error.statusCode = 400;
    error.code = "INVALID_INPUT";
    throw error;
  }
  return number;
}

module.exports = { cleanText, normalizeEmail, validatePassword, boundedInteger };
