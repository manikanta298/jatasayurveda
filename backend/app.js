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

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser/server-to-server requests (including ICICI callbacks)
      // have no Origin header and must not be rejected by CORS.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[cors] Rejected origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
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
