const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    age: { type: Number, min: 1, max: 120, default: null },
    gender: { type: String, default: "", trim: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    symptoms: { type: String, default: "", trim: true },
    symptomsDuration: { type: String, default: "", trim: true },
    medicalHistory: { type: String, default: "", trim: true },
    currentMedications: { type: String, default: "", trim: true },
    allergies: { type: String, default: "", trim: true },
    additionalDetails: { type: String, default: "", trim: true },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
