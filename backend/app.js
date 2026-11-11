const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const routes = require("./routes");
const verifyOrigin = require("./middleware/verifyOrigin");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);

// Keep all known production/staging frontend origins trusted. CLIENT_URL can
// still add additional trusted origins as a comma-separated list.
const defaultAllowedOrigins = [
  "https://jatasayurveda.com",
  "https://www.jatasayurveda.com",
  "https://darkcyan-bee-958045.hostingersite.com",
];
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];

// ICICI validates the Referer/origin domain, so helmet's default "no-referrer" would trigger "DOMAIN VALIDATION FAIL".
app.use(helmet({ referrerPolicy: { policy: "strict-origin-when-cross-origin" } }));
const corsMiddleware = cors({
  origin(origin, callback) {
    // Server-to-server / non-browser requests carry no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`[cors] Rejected origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
});

// ICICI sends the customer's browser back to /icici/return (form POST from the
// ICICI domain) and calls /icici/advice server-to-server. These are not
// cross-origin XHR calls, so CORS must not apply. They are authenticated by
// verifying the ICICI response signature plus a server-side STATUS check, not
// by cookies, so skipping CORS here is safe and scoped to these two routes.
const ICICI_CALLBACK_PATH = /^\/api\/v1\/orders\/icici\/(return|advice)\/?$/;
app.use((req, res, next) =>
  ICICI_CALLBACK_PATH.test(req.path) ? next() : corsMiddleware(req, res, next)
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(
  "/api/v1/auth/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false })
);
app.use(
  "/api/v1/contact",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })
);

// Browsers request this automatically. A missing favicon is not an API error
// and should not pollute production logs.
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "JATA Ayurveda Backend API is running successfully",
  });
});

app.use("/api/v1", verifyOrigin, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
