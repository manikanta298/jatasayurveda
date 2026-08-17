const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const ContactMessage = require("../models/ContactMessage");
const Notification = require("../models/Notification");
const SiteSetting = require("../models/SiteSetting");
const { sendMail } = require("../services/email");

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function consultationEmail({
  name,
  email,
  phone,
  age,
  gender,
  symptoms,
  symptomsDuration,
  medicalHistory,
  currentMedications,
  allergies,
  additionalDetails,
}) {
  const rows = [
    ["Name", name],
    ["Age", age ? String(age) : ""],
    ["Gender", gender],
    ["Email", email],
    ["Phone", phone],
    ["Symptoms / main concern", symptoms],
    ["Symptoms duration", symptomsDuration],
    ["Medical history / previous diagnosis", medicalHistory],
    ["Current medicines / supplements", currentMedications],
    ["Known allergies", allergies],
    ["Additional details", additionalDetails],
  ];

  const text = [
    "New JATA Ayurveda consultation request",
    "",
    ...rows.map(([label, value]) => `${label}: ${value || "Not provided"}`),
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d2a20">
      <h2 style="margin-bottom:8px">New consultation request</h2>
      <p style="margin-top:0;color:#5f6b62">A new patient consultation form was submitted on the JATA Ayurveda website.</p>
      <table style="border-collapse:collapse;width:100%;max-width:720px">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="padding:10px 12px;border:1px solid #dce5df;font-weight:600;width:34%;vertical-align:top">${escapeHtml(label)}</td>
            <td style="padding:10px 12px;border:1px solid #dce5df;white-space:pre-wrap;vertical-align:top">${escapeHtml(value || "Not provided")}</td>
          </tr>
        `).join("")}
      </table>
    </div>
  `;

  return {
    subject: `New consultation request — ${name}`,
    text,
    html,
  };
}

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
    subject,
    message,
    age,
    gender,
    symptoms,
    symptomsDuration,
    medicalHistory,
    currentMedications,
    allergies,
    additionalDetails,
  } = req.body;

  const normalizedName = clean(name);
  const normalizedEmail = clean(email).toLowerCase();
  const normalizedSymptoms = clean(symptoms) || clean(message);

  if (!normalizedName || !normalizedEmail || !normalizedSymptoms) {
    throw new ApiError(400, "Name, email and symptoms are required");
  }

  const numericAge = age === "" || age === null || age === undefined ? null : Number(age);
  if (numericAge !== null && (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120)) {
    throw new ApiError(400, "Age must be a whole number between 1 and 120");
  }

  const payload = {
    name: normalizedName,
    email: normalizedEmail,
    phone: clean(phone),
    subject: clean(subject) || "New consultation request",
    message: normalizedSymptoms,
    age: numericAge,
    gender: clean(gender),
    symptoms: normalizedSymptoms,
    symptomsDuration: clean(symptomsDuration),
    medicalHistory: clean(medicalHistory),
    currentMedications: clean(currentMedications),
    allergies: clean(allergies),
    additionalDetails: clean(additionalDetails),
  };

  const contact = await ContactMessage.create(payload);

  await Notification.create({
    type: "new_contact_message",
    title: "New consultation request",
    message: `${normalizedName} submitted a consultation request${payload.subject ? `: ${payload.subject}` : ""}`,
    link: `/admin/contact/${contact._id}`,
    recipientRoles: ["admin", "order_manager"],
  });

  const settings = await SiteSetting.findOne({ key: "contact" }).lean();
  const recipient = clean(process.env.CONSULTATION_RECIPIENT_EMAIL) || clean(settings?.value?.email) || clean(process.env.SMTP_USER);

  // The request is already persisted before the email is sent. If email is not
  // configured or a provider is temporarily unavailable, log the failure but
  // still return a successful form submission so the patient isn't asked to
  // resubmit a request that was already saved.
  if (recipient) {
    try {
      const emailContent = consultationEmail(payload);
      await sendMail({
        to: recipient,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
    } catch (err) {
      console.error(`[contact] Consultation email failed: ${err.message}`);
    }
  } else {
    console.warn("[contact] No consultation email recipient configured. Set CONSULTATION_RECIPIENT_EMAIL or contact.email in site settings.");
  }

  forwardContactToGoogleSheet(payload);

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
