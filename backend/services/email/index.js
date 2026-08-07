// Render blocks/restricts outbound SMTP (port 587/465) on many plans, so
// connecting to smtp.gmail.com from there times out no matter what SMTP
// options are set (confirmed: consistent ~15s ETIMEDOUT in production).
// Resend's API runs over plain HTTPS, which Render allows normally, so we
// send through that instead of a raw SMTP connection.
const RESEND_API_URL = "https://api.resend.com/emails";

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

// sendMail({ to, subject, html, text }). In development, or whenever
// RESEND_API_KEY isn't set yet, this logs the email to the console instead
// of throwing, so local dev and a not-yet-configured deployment never
// hard-fail on email sends.
async function sendMail({ to, subject, html, text }) {
  if (!isConfigured()) {
    console.log(`[email:console] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { delivered: false, reason: "RESEND_API_KEY not configured" };
  }

  const fromName = process.env.SMTP_FROM_NAME || "JATA Ayurveda";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "onboarding@resend.dev";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Email provider timed out after 15s");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  return { delivered: true };
}

module.exports = { sendMail, isConfigured };
