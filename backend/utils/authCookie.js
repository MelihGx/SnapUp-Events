function setAuthCookie(res, token) {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(secure ? "__Host-snapup_session" : "snapup_session", token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  const secure = process.env.NODE_ENV === "production";
  res.clearCookie(secure ? "__Host-snapup_session" : "snapup_session", {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  });
}

function readAuthCookie(req) {
  const cookies = String(req.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const [name, ...parts] = cookie.trim().split("=");
    if (name === "__Host-snapup_session" || name === "snapup_session") return decodeURIComponent(parts.join("="));
  }
  return "";
}

module.exports = { setAuthCookie, clearAuthCookie, readAuthCookie };
