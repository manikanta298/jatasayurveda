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

// Render (and most PaaS hosts) terminate TLS at a reverse proxy and forward
// requests to this process over plain HTTP, setting `X-Forwarded-Proto:
// https`. Without `trust proxy`, Express ignores that header and `req.secure`
// is always false — which would make our cross-site cookie logic in
// utils/token.js think every request is insecure. `1` trusts exactly one hop
// (the platform's proxy), which is the correct setting for Render/Vercel-style
// single-proxy deployments.
app.set("trust proxy", 1);

// Normalize configured frontend origins. CLIENT_URL may be a comma-separated
// list, and browser Origin headers never contain a trailing slash.
const allowedOrigins = (process.env.CLIENT_URL || "https://jatasayurveda.com,https://www.jatasayurveda.com")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Strips any request keys starting with "$" or containing "." from body,
// query, and params — the two characters MongoDB uses for operators — so a
// crafted payload like { "email": { "$ne": null } } can never be used to
// bypass a findOne() filter (NoSQL injection).
app.use(mongoSanitize());

// API responses are always dynamic — never let a browser, proxy, or CDN
// cache them. Without this, "I saved a change but the list still shows the
// old data" bugs can happen if anything between the browser and this server
// decides a GET response is cacheable.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Rate limits on the endpoints most exposed to abuse: brute-forcing login
// and spamming the contact form. Checkout-specific limits live in
// routes/order.routes.js so they don't also throttle admin order management.
app.use(
  "/api/v1/auth/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false })
);
app.use(
  "/api/v1/contact",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })
);

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
