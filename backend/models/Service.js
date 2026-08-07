const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  { url: String, alt: String, sortOrder: { type: Number, default: 0 } },
  { _id: false }
);

const faqSchema = new mongoose.Schema({ question: String, answer: String }, { _id: false });

const treatmentStepSchema = new mongoose.Schema(
  { title: String, description: String, order: { type: Number, default: 0 } },
  { _id: false }
);

const ctaButtonSchema = new mongoose.Schema(
  { label: String, href: String, style: String },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "" },
    fullDescription: { type: String, default: "" },
    bannerImageUrl: { type: String, default: "" },
    images: { type: [imageSchema], default: [] },
    symptoms: { type: [String], default: [] },
    causes: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    treatmentProcess: { type: [treatmentStepSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    ctaButtons: { type: [ctaButtonSchema], default: [] },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    isEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
