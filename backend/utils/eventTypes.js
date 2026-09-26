const EVENT_TYPE_CODES = new Set([
  "wedding",
  "engagement",
  "henna_night",
  "birthday",
  "graduation",
  "baby_shower",
  "anniversary",
  "corporate",
  "conference_seminar",
  "festival_concert",
  "party_celebration",
  "trip",
  "other"
]);

function normalizeEventTypeCode(value, { required = false } = {}) {
  const code = String(value || "").trim().toLowerCase();

  if (!code) {
    if (!required) return null;

    const error = new Error("Event type is required.");
    error.statusCode = 400;
    error.code = "EVENT_TYPE_REQUIRED";
    throw error;
  }

  if (!EVENT_TYPE_CODES.has(code)) {
    const error = new Error("A valid event type is required.");
    error.statusCode = 400;
    error.code = "INVALID_EVENT_TYPE";
    throw error;
  }

  return code;
}

module.exports = { EVENT_TYPE_CODES, normalizeEventTypeCode };
