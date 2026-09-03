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

function requestProtocol(req) {
  const forwarded = req.headers["x-forwarded-proto"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim().toLowerCase();
  }
  return String(req.protocol || "").toLowerCase();
}

function isSecureContext(req) {
  // Hostinger and other reverse proxies can terminate TLS before Node sees
  // the request. Prefer the trusted forwarded protocol when available so an
  // HTTPS production request never gets a non-Secure auth cookie just because
  // NODE_ENV or req.secure was not populated as expected.
  return Boolean(req.secure || requestProtocol(req) === "https" || process.env.NODE_ENV === "production");
}

function cookieOptions(req, rememberMe) {
  const secure = isSecureContext(req);
  const options = {
    httpOnly: true,
    secure,
    // The frontend and API may be on different origins in production, so use
    // SameSite=None whenever the cookie is Secure. Axios sends credentials.
    sameSite: secure ? "none" : "lax",
    maxAge: rememberMe ? LONG_MAX_AGE : SHORT_MAX_AGE,
    path: "/",
  };

  // Optional for deployments that intentionally serve the frontend and API
  // from sibling subdomains of the same parent domain (e.g. .jatasayurveda.com).
  // Leave unset by default so unrelated hosts can never receive the session.
  if (process.env.CUSTOMER_COOKIE_DOMAIN) {
    options.domain = process.env.CUSTOMER_COOKIE_DOMAIN.trim();
  }

  return options;
}

function setCustomerAuthCookie(res, token, req, rememberMe) {
  res.cookie(COOKIE_NAME, token, cookieOptions(req, rememberMe));
}

function clearCustomerAuthCookie(res, req) {
  res.clearCookie(COOKIE_NAME, cookieOptions(req, false));
}

module.exports = { COOKIE_NAME, signCustomerToken, setCustomerAuthCookie, clearCustomerAuthCookie };
