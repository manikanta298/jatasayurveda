const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. "new_order", "low_stock", "new_contact_message"
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    recipientRoles: { type: [String], default: ["admin"] },
  },
  { timestamps: true }
);

notificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
