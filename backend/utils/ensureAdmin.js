const crypto = require("crypto");
const User = require("../models/User");

// Runs once at server boot, after the DB connection is established. Creates
// a default admin account only if no admin-role user exists yet — safe to
// leave in place permanently, it's a no-op on every subsequent boot once an
// admin exists.
async function ensureDefaultAdmin() {
  const existingAdmin = await User.findOne({ roles: "admin" });
  if (existingAdmin) {
    console.log(`[bootstrap] Admin account already exists (${existingAdmin.email}) — skipping.`);
    return;
  }

  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  if (!email) {
    console.warn(
      "[bootstrap] No admin account exists and SEED_ADMIN_EMAIL is not set — " +
        "set SEED_ADMIN_EMAIL (and optionally SEED_ADMIN_PASSWORD) in your environment and redeploy."
    );
    return;
  }

  // If a user with this email already exists but isn't an admin (e.g. was
  // created via the admin panel with a different role), promote it instead
  // of creating a duplicate account for the same email.
  const existingByEmail = await User.findOne({ email });
  if (existingByEmail) {
    existingByEmail.roles = Array.from(new Set([...existingByEmail.roles, "admin"]));
    await existingByEmail.save();
    console.log(`[bootstrap] Promoted existing account "${email}" to admin.`);
    return;
  }

  // Use SEED_ADMIN_PASSWORD if explicitly set; otherwise generate a random
  // one and print it once — but only outside production, since printing a
  // real credential to logs is risky if log access isn't tightly controlled.
  const usingGeneratedPassword = !process.env.SEED_ADMIN_PASSWORD;

  if (usingGeneratedPassword && process.env.NODE_ENV === "production") {
    throw new Error(
      "[bootstrap] SEED_ADMIN_PASSWORD must be set in production — refusing to generate and log a password."
    );
  }

  const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");

  const passwordHash = await User.hashPassword(password);
  await User.create({ name: "Admin", email, passwordHash, roles: ["admin"] });

  console.log("=".repeat(70));
  console.log("[bootstrap] Created default admin account:");
  console.log(`[bootstrap]   email:    ${email}`);
  if (usingGeneratedPassword) {
    console.log(`[bootstrap]   password: ${password}`);
    console.log("[bootstrap]   (SEED_ADMIN_PASSWORD was not set, so this was generated randomly.)");
    console.log("[bootstrap]   SAVE THIS NOW — it is only ever printed this one time in these logs.");
    console.log("[bootstrap]   Log in and change it immediately via the admin panel.");
  } else {
    console.log("[bootstrap]   password: (the value you set in SEED_ADMIN_PASSWORD)");
  }
  console.log("=".repeat(70));
}

module.exports = ensureDefaultAdmin;
