const crypto = require("crypto");
const ApiError = require("../../utils/ApiError");

// Generic adapter for ICICI Bank's payment gateway (e.g. their Eazypay /
// merchant Payment Gateway product). ICICI's actual integration requires
// merchant onboarding with them and their own request/response field names
// and hashing scheme, documented in the merchant integration kit they send
// you on signup — this adapter implements the common shape most Indian bank
// gateways use (redirect to a hosted payment page with an HMAC-signed
// request, verify an HMAC-signed callback) so wiring in the exact field
// names is a small, contained change once you have ICICI's kit, rather than
// a new gateway built from scratch.
//
// Disabled (isEnabled() === false) until ICICI_MERCHANT_ID and
// ICICI_SECRET_KEY are set, exactly like Razorpay is disabled until its own
// keys are set — so it never appears as a broken option to customers.
function isEnabled() {
  return Boolean(process.env.ICICI_MERCHANT_ID && process.env.ICICI_SECRET_KEY);
}

function assertConfigured() {
  if (!isEnabled()) {
    throw new ApiError(
      503,
      "ICICI Bank gateway is not configured. Set ICICI_MERCHANT_ID and ICICI_SECRET_KEY (and optionally ICICI_GATEWAY_URL) in your .env — see backend/.env.example."
    );
  }
}

module.exports = {
  key: "icici",
  label: "ICICI Bank Payment Gateway",
  isEnabled,

  async createOrder({ order }) {
    assertConfigured();
    // The merchant reference and amount are HMAC-signed so the redirect
    // request can't be tampered with in transit or by the browser.
    const payload = `${order.orderNumber}|${order.totalPaise}|${process.env.ICICI_MERCHANT_ID}`;
    const requestHash = crypto.createHmac("sha256", process.env.ICICI_SECRET_KEY).update(payload).digest("hex");
    return {
      requiresClientAction: true,
      gatewayOrderId: order.orderNumber,
      clientConfig: {
        merchantId: process.env.ICICI_MERCHANT_ID,
        requestHash,
        redirectUrl: process.env.ICICI_GATEWAY_URL || "https://eazypay.icicibank.com/EazyPG",
        amount: order.totalPaise,
        currency: order.currency,
      },
      initialStatus: "created",
    };
  },

  // payload: { gatewayPaymentId, gatewaySignature } from ICICI's callback —
  // rename these to whatever field names ICICI's kit actually returns once you have it.
  async verifyPayment({ order, payload }) {
    assertConfigured();
    const { gatewayPaymentId, gatewaySignature } = payload;
    if (!gatewayPaymentId || !gatewaySignature) {
      throw new ApiError(400, "Missing payment verification fields");
    }
    const expected = crypto
      .createHmac("sha256", process.env.ICICI_SECRET_KEY)
      .update(`${order.orderNumber}|${gatewayPaymentId}`)
      .digest("hex");
    const expectedBuf = Buffer.from(expected, "hex");
    const gotBuf = Buffer.from(String(gatewaySignature), "hex");
    if (expectedBuf.length !== gotBuf.length || !crypto.timingSafeEqual(expectedBuf, gotBuf)) {
      throw new ApiError(400, "Payment verification failed: signature mismatch");
    }
    return { gatewayPaymentId, gatewaySignature, paid: true, finalStatus: "paid" };
  },
};
