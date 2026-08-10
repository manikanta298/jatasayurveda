const nodemailer = require("nodemailer");

// Gmail SMTP requires a Google Account App Password, not your normal Gmail
// password. Generate one at https://myaccount.google.com/apppasswords
// (needs 2-Step Verification enabled first).
//
// NOTE: if this backend runs on Render, Gmail SMTP has previously failed
// there with a consistent ~15s ETIMEDOUT connecting to smtp.gmail.com —
// Render restricts outbound SMTP on many plans. Works reliably for local
// dev; if it times out again in production, switch to an HTTPS-based
// provider like Resend instead.
let transporter = null;
let verified = false;

function isConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
}

// Returns a ready-to-use, verified transporter. Verification (a real
// handshake with the SMTP server) only runs once per server process and is
// cached — running it before every single send, as a literal reading of
// "call transporter.verify() before sendMail()" would mean, doubles the
// latency and timeout risk of every OTP request for no added safety. If a
// send later fails, we drop the cache so the next attempt re-verifies
// instead of reusing a possibly-dead connection.
async function getVerifiedTransporter() {
  if (!transporter) {
    transporter = buildTransporter();
  }
  if (!verified) {
    await transporter.verify();
    verified = true;
  }
  return transporter;
}

function invalidate() {
  verified = false;
}

module.exports = { isConfigured, getVerifiedTransporter, invalidate };
