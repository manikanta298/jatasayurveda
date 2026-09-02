const ApiError = require("../utils/ApiError");

// Keep CSRF origin validation aligned with app.js. The production JATA
// origins are always trusted; CLIENT_URL can add staging/development origins.
const defaultAllowedOrigins = [
  "https://jatasayurveda.com",
  "https://www.jatasayurveda.com",
];
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])]
  .map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      // A malformed CLIENT_URL entry (missing scheme, stray characters, etc.)
      // must not crash the whole server at boot — that would take down every
      // route, not just CORS, and show up as a 502 with no clear cause.
      console.warn(`[verifyOrigin] Ignoring invalid origin in CLIENT_URL: "${origin}"`);
      return null;
    }
  })
  .filter(Boolean);

/**
 * Because auth is accepted via cookie, CORS alone doesn't stop CSRF — a
 * malicious page can still cause the browser to send a cross-site request
 * with the cookie attached. This checks the Origin header on state-changing
 * requests and rejects anything that doesn't match our known frontend.
 *
 * Requests without an Origin header (server-to-server calls, ICICI callbacks,
 * health checks and some non-browser clients) are allowed through.
 */
module.exports = function verifyOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return next(new ApiError(403, "Invalid origin"));
  }

  next();
};
