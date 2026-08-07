const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  { question: String, answer: String },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory", default: null },
    categoryLabel: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    fullDescription: { type: String, default: "" },
    featuredImageUrl: { type: String, default: "" },
    images: { type: [imageSchema], default: [] },
    pricePaise: { type: Number, required: true, default: 0 },
    discountPricePaise: { type: Number, default: null },
    stockQuantity: { type: Number, default: 0 },
    sku: { type: String, default: "" },
    tags: { type: [String], default: [] },
    ingredients: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    usageInstructions: { type: String, default: "" },
    dosage: { type: String, default: "" },
    precautions: { type: String, default: "" },
    faqs: { type: [faqSchema], default: [] },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    isEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", shortDescription: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
