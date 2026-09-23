const { securityEvent } = require("./security");

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required.",
      code: "AUTH_REQUIRED",
    });
  }

  if (!req.user.is_email_verified) {
    securityEvent("admin_access_denied", req, {
      reason: "email_not_verified",
      user_id: req.user.user_id,
    });

    return res.status(403).json({
      success: false,
      message: "Admin accounts must have a verified email address.",
      code: "ADMIN_EMAIL_VERIFICATION_REQUIRED",
    });
  }

  if (!ADMIN_ROLES.has(req.user.user_role)) {
    securityEvent("admin_access_denied", req, {
      reason: "insufficient_role",
      user_id: req.user.user_id,
      role: req.user.user_role,
    });

    return res.status(403).json({
      success: false,
      message: "Admin access is not allowed for this account.",
      code: "ADMIN_ACCESS_DENIED",
    });
  }

  return next();
}

module.exports = adminMiddleware;
