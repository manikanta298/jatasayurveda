const mongoose = require("mongoose");

const heroBannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroBanner", heroBannerSchema);
