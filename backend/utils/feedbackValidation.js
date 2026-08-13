const { cleanText, normalizeEmail } = require("./validation");

const FEEDBACK_CATEGORIES = new Set([
  "bug",
  "suggestion",
  "complaint",
  "other",
]);

function validateCategory(value) {
  const category = String(value || "")
    .trim()
    .toLowerCase();

  if (!FEEDBACK_CATEGORIES.has(category)) {
    const error = new Error("A valid feedback category is required.");
    error.statusCode = 400;
    error.code = "INVALID_FEEDBACK_CATEGORY";
    throw error;
  }

  return category;
}

function validateMessage(value) {
  return cleanText(value, {
    min: 10,
    max: 2_000,
    field: "feedback_message",
  });
}

function validateContactEmail(value) {
  const email = String(value || "").trim();
  return email ? normalizeEmail(email) : null;
}

function validatePagePath(value) {
  const path = cleanText(value || "/", {
    min: 1,
    max: 500,
    field: "page_path",
  });

  if (!path.startsWith("/") || /[\u0000-\u001f\u007f]/.test(path)) {
    const error = new Error("A valid page path is required.");
    error.statusCode = 400;
    error.code = "INVALID_PAGE_PATH";
    throw error;
  }

  return path;
}

function validateLanguageCode(value) {
  const language = String(value || "en")
    .trim()
    .toLowerCase();

  if (!/^[a-z]{2,3}(?:-[a-z]{2})?$/.test(language)) {
    const error = new Error("A valid language code is required.");
    error.statusCode = 400;
    error.code = "INVALID_LANGUAGE_CODE";
    throw error;
  }

  return language;
}

function validateFeedbackPayload(payload = {}) {
  return {
    category: validateCategory(payload.category),
    message: validateMessage(payload.message),
    contactEmail: validateContactEmail(payload.contact_email),
    pagePath: validatePagePath(payload.page_path),
    languageCode: validateLanguageCode(payload.language_code),
  };
}

module.exports = {
  FEEDBACK_CATEGORIES,
  validateFeedbackPayload,
};
