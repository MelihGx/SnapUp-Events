const test = require("node:test");
const assert = require("node:assert/strict");
const { validateFeedbackPayload } = require("../utils/feedbackValidation");

test("accepts a valid optional-email feedback payload", () => {
  assert.deepEqual(
    validateFeedbackPayload({
      category: "Suggestion",
      message: "  Please add a gallery search option.  ",
      contact_email: "USER@example.com",
      page_path: "/event-gallery.html",
      language_code: "tr",
    }),
    {
      category: "suggestion",
      message: "Please add a gallery search option.",
      contactEmail: "user@example.com",
      pagePath: "/event-gallery.html",
      languageCode: "tr",
    },
  );
});

test("accepts guest feedback without an email address", () => {
  const payload = validateFeedbackPayload({
    category: "bug",
    message: "The upload button stayed disabled.",
    page_path: "/event-detail.html",
    language_code: "pt-pt",
  });

  assert.equal(payload.contactEmail, null);
});

test("rejects unknown categories", () => {
  assert.throws(
    () =>
      validateFeedbackPayload({
        category: "spam",
        message: "This message is long enough.",
        page_path: "/",
        language_code: "en",
      }),
    { code: "INVALID_FEEDBACK_CATEGORY" },
  );
});

test("rejects short messages and invalid paths", () => {
  assert.throws(
    () =>
      validateFeedbackPayload({
        category: "other",
        message: "short",
        page_path: "/",
        language_code: "en",
      }),
    { code: "INVALID_INPUT" },
  );

  assert.throws(
    () =>
      validateFeedbackPayload({
        category: "other",
        message: "This message is long enough.",
        page_path: "https://example.com/private?token=secret",
        language_code: "en",
      }),
    { code: "INVALID_PAGE_PATH" },
  );
});
