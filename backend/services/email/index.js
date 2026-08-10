const nodemailer = require("nodemailer");

// Gmail SMTP requires a Google Account App Password, not your normal Gmail
// password. Generate one at https://myaccount.google.com/apppasswords
// (needs 2-Step Verification enabled first), then set:
//   SMTP_USER=youraddress@gmail.com
//   SMTP_PASS=the 16-character app password (no spaces)
//
// NOTE: if this backend runs on Render, Gmail SMTP has previously failed
// there with a consistent ~15s ETIMEDOUT connecting to smtp.gmail.com —
// Render's network blocks/restricts outbound SMTP on many plans. This
// setup works reliably for local development; if it times out again in
// production, that confirms the same infrastructure limitation and Resend
// (HTTPS-based, no SMTP port needed) is the more reliable fallback.
let transporter = null;

function isConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
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
  return transporter;
}

// sendMail({ to, subject, html, text }). In development, or whenever SMTP
// isn't configured yet, this logs the email to the console instead of
// throwing, so local dev and a not-yet-configured deployment never
// hard-fail on email sends.
async function sendMail({ to, subject, html, text }) {
  if (!isConfigured()) {
    console.log(`[email:console] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { delivered: false, reason: "SMTP not configured" };
  }

  await getTransporter().sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "JATA Ayurveda"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });

  return { delivered: true };
}

module.exports = { sendMail, isConfigured };
