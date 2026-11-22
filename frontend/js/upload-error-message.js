// English source phrases are translated by the existing UI/i18n layer.
const quotaMessages = new Map([
  ["GUEST_UPLOAD_LIMIT_EXCEEDED", "You have reached the upload count limit."],
  ["GUEST_STORAGE_QUOTA_EXCEEDED", "You have reached the storage space limit."],
  ["EVENT_STORAGE_QUOTA_EXCEEDED", "This event has reached its storage space limit."],
]);

export function getUploadErrorMessage(response, data, fallbackMessage) {
  // A stable code also covers the precheck: no count is exposed as structured
  // data, so use the fixed phrase rather than parsing the server's English.
  if (quotaMessages.has(data.code)) return quotaMessages.get(data.code);
  if (data.code === "MESSAGE_SAVE_FAILED" ||
      (fallbackMessage === "Message could not be sent." && response.status >= 500)) {
    return "Message could not be sent.";
  }
  return data.message || data.error || fallbackMessage;
}
