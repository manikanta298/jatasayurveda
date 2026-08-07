const crypto = require("crypto");
const getRazorpay = require("../../config/razorpay");
const ApiError = require("../../utils/ApiError");

function isEnabled() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

module.exports = {
  key: "razorpay",
  label: "Razorpay (Cards, UPI, Netbanking, Wallets)",
  isEnabled,

  async createOrder({ order }) {
    const razorpay = getRazorpay();
    const rpOrder = await razorpay.orders.create({
      amount: order.totalPaise,
      currency: order.currency,
      receipt: order.orderNumber,
      notes: { orderId: String(order._id) },
    });
    return {
      requiresClientAction: true,
      gatewayOrderId: rpOrder.id,
      clientConfig: { keyId: process.env.RAZORPAY_KEY_ID, amount: rpOrder.amount, currency: rpOrder.currency },
      initialStatus: "created",
    };
  },

  // payload: { gatewayOrderId, gatewayPaymentId, gatewaySignature } from Razorpay Checkout's callback
  async verifyPayment({ order, payload }) {
    const { gatewayOrderId, gatewayPaymentId, gatewaySignature } = payload;
    if (!gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
      throw new ApiError(400, "Missing payment verification fields");
    }
    if (gatewayOrderId !== order.gatewayOrderId) {
      throw new ApiError(400, "Payment does not match this order");
    }
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest("hex");
    // Constant-time compare to avoid a timing side-channel on the signature check.
    const expectedBuf = Buffer.from(expected, "hex");
    const gotBuf = Buffer.from(String(gatewaySignature), "hex");
    if (expectedBuf.length !== gotBuf.length || !crypto.timingSafeEqual(expectedBuf, gotBuf)) {
      throw new ApiError(400, "Payment verification failed: signature mismatch");
    }
    return { gatewayPaymentId, gatewaySignature, paid: true, finalStatus: "paid" };
  },
};
