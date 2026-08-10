const mailer = require("../../config/mailer");

// sendMail({ to, subject, html, text }). In development, or whenever SMTP
// isn't configured yet, this logs the email to the console instead of
// throwing, so local dev and a not-yet-configured deployment never
// hard-fail on email sends.
async function sendMail({ to, subject, html, text }) {
  if (!mailer.isConfigured()) {
    console.log(`[email:console] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { delivered: false, reason: "SMTP not configured" };
  }

  let transporter;
  try {
    transporter = await mailer.getVerifiedTransporter();
  } catch (err) {
    mailer.invalidate();
    throw new Error(`SMTP verification failed: ${err.message}`);
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "JATA Ayurveda"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    mailer.invalidate();
    throw err;
  }

  return { delivered: true };
}

module.exports = { sendMail, isConfigured: mailer.isConfigured };
