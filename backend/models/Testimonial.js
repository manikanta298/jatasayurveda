const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" }, // e.g. "Bengaluru · 14-day Panchakarma"
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    imageUrl: { type: String, default: "" },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
