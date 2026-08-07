const Razorpay = require("razorpay");

// Lazily constructed so the whole server doesn't crash on boot if Razorpay
// keys aren't configured yet (e.g. while developing other parts of the API).
// The clear error only surfaces when an endpoint that actually needs payments is hit.
let instance = null;

function getRazorpay() {
  if (instance) return instance;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env"
    );
  }

  instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return instance;
}

module.exports = getRazorpay;
