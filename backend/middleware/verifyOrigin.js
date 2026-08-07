const ApiError = require("../utils/ApiError");

// Same normalization as app.js: strip any trailing slash so a copy-pasted
// CLIENT_URL with a trailing "/" doesn't cause every request to be rejected.
const clientUrl = (process.env.CLIENT_URL || "https://jatasayurveda.vercel.app").replace(/\/+$/, "");
const allowedOrigin = new URL(clientUrl).origin;

/**
 * Because auth is accepted via cookie, CORS alone doesn't stop CSRF — a
 * malicious page can still cause the browser to send a cross-site request
 * with the cookie attached. This checks the Origin header on state-changing
 * requests and rejects anything that doesn't match our known frontend.
 *
 * Requests without an Origin header (server-to-server calls, some non-browser
 * clients) are allowed through, since Origin spoofing there doesn't grant an
 * attacker anything a browser-based CSRF attack would.
 */
module.exports = function verifyOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  if (origin && origin !== allowedOrigin) {
    return next(new ApiError(403, "Invalid origin"));
  }

  next();
};
