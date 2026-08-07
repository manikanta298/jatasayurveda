const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const ContactMessage = require("../models/ContactMessage");
const Notification = require("../models/Notification");

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
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    throw new ApiError(400, "name, email and message are required");
  }

  const contact = await ContactMessage.create({ name, email, phone, subject, message });

  await Notification.create({
    type: "new_contact_message",
    title: "New contact message",
    message: `${name} sent a message${subject ? `: ${subject}` : ""}`,
    link: `/admin/contact/${contact._id}`,
    recipientRoles: ["admin", "order_manager"],
  });

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
