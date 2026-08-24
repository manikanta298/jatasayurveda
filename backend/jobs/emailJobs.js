const { agenda } = require("./agenda");
const { sendMail } = require("../services/email");

// Contact/consultation notification emails go to the admin inbox — the
// customer-facing submission has already succeeded and been saved to
// MongoDB by this point (see contact.controller.js), so sending the email
// here, off the request thread, doesn't cost the customer any wait time.
// A hard SMTP failure here is just logged (via agenda's "fail" event in
// agenda.js) since the ContactMessage + in-app Notification created at
// submit time are already the source of truth for the admin.
agenda.define("send-contact-notification-email", async (job) => {
  const { to, subject, text, html } = job.attrs.data;
  await sendMail({ to, subject, text, html });
});

module.exports = agenda;
