require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const ensureDefaultAdmin = require("./utils/ensureAdmin");
const { startAgenda } = require("./jobs/agenda");
require("./jobs/emailJobs"); // registers job definitions

const PORT = process.env.PORT || 5000;

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];

function checkRequiredEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`[server] Missing required environment variable(s): ${missing.join(", ")}`);
    console.error("[server] Set these in your hosting provider's environment settings (e.g. Render → Environment) and redeploy.");
    process.exit(1);
  }
}

async function start() {
  checkRequiredEnv();
  try {
    await connectDB();
    await ensureDefaultAdmin();
    await startAgenda();
    app.listen(PORT, () => {
      console.log(`[server] JATA Ayurveda API listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  }
}

start();

process.on("unhandledRejection", (err) => {
  console.error("[server] Unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  // A synchronous throw outside an Express request handler (module-load
  // code, a timer callback, an EventEmitter) isn't caught by
  // asyncHandler/Express's error middleware and otherwise kills the whole
  // process immediately — every route, not just one — which is what shows
  // up to users as a 502 Bad Gateway until the host restarts it. Logging
  // here leaves a diagnosable stack trace instead of a silent crash.
  // Exiting (rather than continuing) is intentional: process state after an
  // uncaught exception can't be trusted, so let the host's process manager
  // restart cleanly.
  console.error("[server] Uncaught exception:", err);
  process.exit(1);
});
