const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Dr. Meera Nair, BAMS, MD (Ayu)"
    role: { type: String, default: "" },
    bio: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
