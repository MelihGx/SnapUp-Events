const jwt = require("jsonwebtoken");
const { readAuthCookie } = require("../utils/authCookie");

module.exports = function optionalAuth(req, _res, next) {
  const value = String(req.headers.authorization || "");
  const token = value.startsWith("Bearer ") && value !== "Bearer cookie" ? value.slice(7) : readAuthCookie(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "snapup-events",
      audience: "snapup-web",
    });
    req.user = { user_id: decoded.user_id, user_mail: decoded.user_mail };
  } catch (_error) {
    // Public routes decide whether an authenticated user is required.
  }
  next();
};
