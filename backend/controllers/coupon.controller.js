const asyncHandler = require("express-async-handler");
const crudFactory = require("../utils/crudFactory");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const Coupon = require("../models/Coupon");

const crud = crudFactory(Coupon, {
  searchFields: ["code", "description"],
  filterableFields: ["isActive"],
  defaultSort: "-createdAt",
});

// POST /api/v1/coupons/validate  { code, subtotalPaise }
// Used by the checkout flow (public, no auth) to compute a discount before payment.
const validate = asyncHandler(async (req, res) => {
  const { code, subtotalPaise } = req.body;
  if (!code || typeof subtotalPaise !== "number") {
    throw new ApiError(400, "code and subtotalPaise are required");
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(404, "Invalid or inactive coupon code");

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) throw new ApiError(400, "Coupon is not active yet");
  if (coupon.validUntil && now > coupon.validUntil) throw new ApiError(400, "Coupon has expired");
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }
  if (subtotalPaise < coupon.minOrderPaise) {
    throw new ApiError(400, `Minimum order amount not met for this coupon`);
  }

  let discountPaise =
    coupon.discountType === "percent"
      ? Math.round((subtotalPaise * coupon.discountValue) / 100)
      : coupon.discountValue;

  if (coupon.maxDiscountPaise !== null) {
    discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
  }
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return sendSuccess(res, 200, {
    code: coupon.code,
    discountPaise,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });
});

module.exports = { ...crud, validate };
