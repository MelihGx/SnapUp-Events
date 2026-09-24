const { securityEvent } = require("./security");

function superAdminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required.",
      code: "AUTH_REQUIRED",
    });
  }

  if (req.user.user_role !== "super_admin") {
    securityEvent("super_admin_access_denied", req, {
      user_id: req.user.user_id,
      role: req.user.user_role,
    });

    return res.status(403).json({
      success: false,
      message: "Super admin permission is required.",
      code: "SUPER_ADMIN_REQUIRED",
    });
  }

  return next();
}

module.exports = superAdminMiddleware;
