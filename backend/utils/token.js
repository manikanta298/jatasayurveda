const jwt = require("jsonwebtoken");

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// Frontend (vercel.app) and backend (onrender.com) are on different domains,
// so this is a cross-site deployment, not same-site. A cross-site cookie is
// ONLY sent back on XHR/fetch requests if it's issued with
// `SameSite=None; Secure`. Previously these flags were derived solely from
// `NODE_ENV === "production"` — if that env var isn't explicitly set on the
// host (Render does NOT set it automatically, unlike Heroku), the cookie
// silently falls back to `SameSite=Lax; Secure=false`, which the browser
// will store on login but then refuse to attach to the very next
// (cross-site) GET /auth/me call. That produced the "login 200, then
// immediate /me 401" symptom.
//
// Fix: derive the flag from whether the connection is actually HTTPS
// (req.secure, reliable once `trust proxy` is set — see app.js) OR
// NODE_ENV, so a missing env var can no longer silently downgrade cookie
// security. Local HTTP dev (`http://localhost`) still correctly gets
// `Secure=false; SameSite=Lax`, since `req.secure` is false there and
// NODE_ENV won't be "production" either.
function isCrossSiteSecureContext(req) {
  return req.secure || process.env.NODE_ENV === "production";
}

function setAuthCookie(res, token, req) {
  const cookieName = process.env.JWT_COOKIE_NAME || "jata_token";
  const secure = isCrossSiteSecureContext(req);
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

function clearAuthCookie(res, req) {
  const cookieName = process.env.JWT_COOKIE_NAME || "jata_token";
  const secure = isCrossSiteSecureContext(req);
  res.clearCookie(cookieName, { secure, sameSite: secure ? "none" : "lax", path: "/" });
}

module.exports = { signToken, setAuthCookie, clearAuthCookie };
