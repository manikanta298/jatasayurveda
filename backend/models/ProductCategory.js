const mongoose = require("mongoose");

const productCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory", default: null },
    sortOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductCategory", productCategorySchema);
