require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const ensureDefaultAdmin = require("./utils/ensureAdmin");

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
