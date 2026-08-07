const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");
const { readAuthCookie } = require("../utils/authCookie");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const bearer = authHeader?.startsWith("Bearer ") && authHeader !== "Bearer cookie"
      ? authHeader.slice(7)
      : "";
    const token = bearer || readAuthCookie(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Yetkisiz erişim. Token bulunamadı.",
      });
    }

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

    if (error || !user || !user.is_user_active ||
        Number(user.token_version || 0) !== Number(decoded.token_version || 0)) {
      return res.status(401).json({ success: false, message: "Session is no longer valid." });
    }

    req.user = {
      user_id: decoded.user_id,
      user_mail: user.user_mail,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Geçersiz veya süresi dolmuş token.",
    });
  }
};

module.exports = authMiddleware;
