const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const ContactMessage = require("../models/ContactMessage");
const Notification = require("../models/Notification");
const { agenda } = require("../jobs/agenda");

// Best-effort: the message is already saved to MongoDB and the admin is
// already notified before this runs, so a Google Sheets/Apps Script hiccup
// (rate limit, script redeployed, network blip) should never turn into a
// "submission failed" error for the customer — it just logs and moves on.
async function forwardContactToGoogleSheet(payload) {
  if (!process.env.GOOGLE_SCRIPT_URL) return;
  try {
    const res = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[contact] Google Sheet forward failed: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[contact] Google Sheet forward failed: ${err.message}`);
  }
}

// POST /api/v1/contact — public
const submit = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    age,
    gender,
    symptoms,
    symptomDuration,
    medicalHistory,
    currentMedicines,
    allergies,
    otherDetails,
    subject,
    message,
  } = req.body;

  if (!name || !email || !message) {
    throw new ApiError(400, "name, email and message are required");
  }

  const contact = await ContactMessage.create({
    name,
    email,
    phone,
    age: age === "" || age == null ? null : Number(age),
    gender,
    symptoms,
    symptomDuration,
    medicalHistory,
    currentMedicines,
    allergies,
    otherDetails,
    subject,
    message,
  });

  await Notification.create({
    type: "new_contact_message",
    title: "New contact message",
    message: `${name} sent a message${subject ? `: ${subject}` : ""}`,
    link: `/admin/contact/${contact._id}`,
    recipientRoles: ["admin", "order_manager"],
  });

  const recipient =
    process.env.CONSULTATION_RECIPIENT_EMAIL ||
    process.env.CONTACT_RECIPIENT_EMAIL ||
    process.env.SMTP_USER;

  if (recipient) {
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = [
      ["Name", name],
      ["Age", age],
      ["Gender", gender],
      ["Phone", phone],
      ["Email", email],
      ["Symptoms", symptoms],
      ["Symptom duration", symptomDuration],
      ["Medical history", medicalHistory],
      ["Current medicines / supplements", currentMedicines],
      ["Allergies", allergies],
      ["Other details", otherDetails],
    ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");

    const htmlRows = rows
      .map(([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`
      )
      .join("");

    const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n\n");

    const isConsultation = subject === "New Book Consultation request";
    const emailSubject = isConsultation ? `Book Consultation — ${name}` : `Customer Details — ${name}`;
    const emailHeading = isConsultation ? "Book Consultation" : "Customer Details";

    // Offloaded to the background job queue (Agenda) instead of awaited
    // inline: the ContactMessage is already saved and the in-app
    // Notification already created above, so the customer's response
    // doesn't need to wait on an SMTP round-trip. A failed send is logged
    // by agenda's "fail" handler; the admin still sees the message in the
    // dashboard either way.
    try {
      await agenda.now("send-contact-notification-email", {
        to: recipient,
        subject: emailSubject,
        text,
        html: `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#1f2937"><h2 style="color:#1f5c43;">${emailHeading}</h2><p>A new consultation form was submitted on the JATAS Ayurveda website.</p><table style="width:100%;border-collapse:collapse;">${htmlRows}</table></div>`,
      });
    } catch (queueError) {
      // Only scheduling the job failed (e.g. Mongo hiccup) — the message is
      // still saved, so this is logged, not surfaced as a customer error.
      console.error("[contact] failed to queue notification email:", queueError.message);
    }
  } else {
    console.warn("[contact] No consultation recipient configured; submission was saved without email delivery.");
  }

  // Fire-and-forget: don't let a Sheets outage delay or fail the customer's response.
  forwardContactToGoogleSheet({ name, email, phone, subject, message });

  return sendSuccess(res, 201, { received: true, id: contact._id });
});

// GET /api/v1/contact/admin/all — admin
const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    ContactMessage.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    ContactMessage.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, items, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

// PATCH /api/v1/contact/admin/:id — admin, update status (new/read/resolved)
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["new", "read", "resolved"].includes(status)) {
    throw new ApiError(400, "status must be one of: new, read, resolved");
  }
  const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!doc) throw new ApiError(404, "Contact message not found");
  return sendSuccess(res, 200, doc);
});

module.exports = { submit, list, updateStatus };
