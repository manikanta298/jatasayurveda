const mongoose = require("mongoose");

const researchItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    year: { type: String, required: true },
    documentUrl: { type: String, default: "" },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResearchItem", researchItemSchema);
