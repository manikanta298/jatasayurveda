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

  const commerceSettings = await SiteSetting.findOne({ key: "commerce" });
  const freeShippingOver = commerceSettings?.value?.free_shipping_over_paise ?? null;
  const configuredFlatShipping = commerceSettings?.value?.flat_shipping_paise ?? 0;

  // Current policy: shipping is FREE. Future shipping charges remain
  // configurable through commerce settings, but cannot accidentally become
  // active merely because an old/stale database value exists. Set
  // shipping_enabled=true when the business is ready to start charging.
  const shippingEnabled = commerceSettings?.value?.shipping_enabled === true;
  const flatShipping = Math.max(0, Number(configuredFlatShipping) || 0);
  const freeShippingThreshold = freeShippingOver === null ? null : Math.max(0, Number(freeShippingOver) || 0);
  const shippingPaise = !shippingEnabled
    ? 0
    : freeShippingThreshold !== null && subtotalPaise >= freeShippingThreshold
      ? 0
      : flatShipping;

  let discountPaise = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
    if (coupon) {
      discountPaise =
        coupon.discountType === "percent"
          ? Math.round((subtotalPaise * coupon.discountValue) / 100)
          : coupon.discountValue;
      if (coupon.maxDiscountPaise !== null) discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
      discountPaise = Math.min(discountPaise, subtotalPaise);
      appliedCoupon = coupon;
    }
  }

  const totalPaise = subtotalPaise + shippingPaise - discountPaise;

  return { items, subtotalPaise, shippingPaise, discountPaise, totalPaise, appliedCoupon };
}

module.exports = { priceOrder };
