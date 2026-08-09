"use strict";

function createAccessError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function assertRegisteredUserAccess({
  onlyUsers,
  currentUser,
  guestSecurity,
  guestClaims,
}) {
  if (!onlyUsers) return;

  const currentUserId = currentUser?.user_id;
  if (!currentUserId) {
    throw createAccessError(
      "A registered user session is required.",
      401,
      "REGISTERED_USERS_ONLY",
    );
  }

  const matchesGuest =
    String(guestSecurity?.user_id || "") === String(currentUserId);
  const matchesToken =
    String(guestClaims?.user_id || "") === String(currentUserId);

  if (!matchesGuest || !matchesToken) {
    throw createAccessError(
      "The guest session does not belong to the signed-in user.",
      403,
      "REGISTERED_USER_SESSION_MISMATCH",
    );
  }
}

module.exports = { assertRegisteredUserAccess };
