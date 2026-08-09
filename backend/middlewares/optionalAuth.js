const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");
const { readAuthCookie } = require("../utils/authCookie");

module.exports = async function optionalAuth(req, _res, next) {
  const value = String(req.headers.authorization || "");
  const token = value.startsWith("Bearer ") && value !== "Bearer cookie" ? value.slice(7) : readAuthCookie(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "snapup-events",
      audience: "snapup-web",
    });

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, user_mail, is_user_active, token_version")
      .eq("user_id", decoded.user_id)
      .maybeSingle();

    if (
      !error &&
      user?.is_user_active &&
      Number(user.token_version || 0) === Number(decoded.token_version || 0)
    ) {
      req.user = { user_id: user.user_id, user_mail: user.user_mail };
    }
  } catch (_error) {
    // Public routes decide whether an authenticated user is required.
  }

  next();
};
