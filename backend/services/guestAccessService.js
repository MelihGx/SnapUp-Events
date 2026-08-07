const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function hashGuestToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function issueGuestToken({ guestId, eventId, userId = null }) {
  return jwt.sign(
    { type: "guest", guest_id: guestId, event_id: eventId, user_id: userId },
    process.env.GUEST_JWT_SECRET || process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "12h", issuer: "snapup-events", audience: "snapup-guest" },
  );
}

function verifyGuestToken(token) {
  return jwt.verify(token, process.env.GUEST_JWT_SECRET || process.env.JWT_SECRET, {
    algorithms: ["HS256"], issuer: "snapup-events", audience: "snapup-guest",
  });
}

module.exports = { hashGuestToken, issueGuestToken, verifyGuestToken };
