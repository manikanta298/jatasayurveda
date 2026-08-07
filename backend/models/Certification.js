const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "GMP Certified Manufacturing"
    iconUrl: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certification", certificationSchema);
