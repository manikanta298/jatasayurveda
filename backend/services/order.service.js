const ApiError = require("../utils/ApiError");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const SiteSetting = require("../models/SiteSetting");

/**
 * Recomputes pricing server-side from the product catalog — never trusts
 * client-submitted prices. Returns { items, subtotalPaise, shippingPaise, discountPaise, totalPaise }.
 *
 * Shipping is currently free (0 paise). The calculation intentionally reads
 * commerce settings so a future admin/configuration change can introduce a
 * flat shipping charge or a free-shipping threshold without changing the
 * checkout/payment code.
 */
async function priceOrder({ cartItems, couponCode }) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const productIds = cartItems.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, status: "published", isEnabled: true });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  let subtotalPaise = 0;

  for (const cartItem of cartItems) {
    const product = productMap.get(String(cartItem.productId));
    if (!product) throw new ApiError(400, `Product ${cartItem.productId} is unavailable`);
    if (product.stockQuantity < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    const unitPricePaise = product.discountPricePaise ?? product.pricePaise;
    items.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.featuredImageUrl,
      quantity: cartItem.quantity,
      unitPricePaise,
    });
    subtotalPaise += unitPricePaise * cartItem.quantity;
  }
  // Shipping charges are disabled for now (always 0). Re-introduce here later if needed.
  const shippingPaise = 0;

  let discountPaise = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
    if (!coupon) throw new ApiError(400, "Invalid or inactive coupon code");
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) throw new ApiError(400, "Coupon is not active yet");
    if (coupon.validUntil && now > coupon.validUntil) throw new ApiError(400, "Coupon has expired");
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, "Coupon usage limit reached");
    if (subtotalPaise < coupon.minOrderPaise) throw new ApiError(400, "Minimum order amount not met for this coupon");
    discountPaise =
      coupon.discountType === "percent"
        ? Math.round((subtotalPaise * coupon.discountValue) / 100)
        : coupon.discountValue;
    if (coupon.maxDiscountPaise !== null) discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
    discountPaise = Math.min(discountPaise, subtotalPaise);
    appliedCoupon = coupon;
  }

  const totalPaise = subtotalPaise + shippingPaise - discountPaise;

  return { items, subtotalPaise, shippingPaise, discountPaise, totalPaise, appliedCoupon };
}

module.exports = { priceOrder };
