const jwt = require("jsonwebtoken");

// Deliberately a different cookie name than the staff session (jata_token)
// so the two sessions can never collide or be confused by a shared browser.
const COOKIE_NAME = process.env.CUSTOMER_JWT_COOKIE_NAME || "jata_customer_token";

const SHORT_MAX_AGE = 1 * 24 * 60 * 60 * 1000; // 1 day (default)
const LONG_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days ("remember me")
// The long-lived option is what makes signing in from a new device simple:
// the session just keeps working afterwards instead of expiring quickly and
// forcing a re-login every time someone switches phone/laptop/browser.

function signCustomerToken(customerId, rememberMe, tokenVersion = 0) {
  // aud: "customer" lets middleware reject a staff-issued token (or vice
  // versa) even if it were ever replayed against the wrong cookie/header —
  // defense in depth on top of the two systems already using separate
  // cookies and separate DB collections. tokenVersion lets a password reset
  // instantly invalidate every previously issued token for this customer,
  // even ones on other devices that are still within their expiry window.
  return jwt.sign({ id: customerId, aud: "customer", tv: tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "30d" : "1d",
  });
}

function isSecureContext(req) {
  return req.secure || process.env.NODE_ENV === "production";
}

function setCustomerAuthCookie(res, token, req, rememberMe) {
  const secure = isSecureContext(req);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge: rememberMe ? LONG_MAX_AGE : SHORT_MAX_AGE,
    path: "/",
  });
}

function clearCustomerAuthCookie(res, req) {
  const secure = isSecureContext(req);
  res.clearCookie(COOKIE_NAME, { secure, sameSite: secure ? "none" : "lax", path: "/" });
}

module.exports = { COOKIE_NAME, signCustomerToken, setCustomerAuthCookie, clearCustomerAuthCookie };
