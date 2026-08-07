const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "flat"], required: true },
    discountValue: { type: Number, required: true }, // percent (0-100) or paise for flat
    minOrderPaise: { type: Number, default: 0 },
    maxDiscountPaise: { type: Number, default: null },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
