const ApiError = require("../../utils/ApiError");

// Registry of payment gateway adapters. Every adapter implements the same
// shape: { key, label, isEnabled(), createOrder({order}), verifyPayment({order, payload}) }.
// Adding a new gateway (Stripe, PayU, etc.) later is just: write a new
// adapter file matching this shape, add it to the map below. Nothing else
// in the app (Order model, controller, frontend) needs to know which
// gateways exist — it only talks to this registry.
const providers = {
  razorpay: require("./razorpay.provider"),
  cod: require("./cod.provider"),
  icici: require("./icici.provider"),
};

function getGateway(key) {
  const provider = providers[key];
  if (!provider) throw new ApiError(400, `Unsupported payment method: ${key}`);
  if (!provider.isEnabled()) throw new ApiError(400, `Payment method "${key}" is not currently available`);
  return provider;
}

// What the checkout page should offer right now (only configured/working gateways).
function listEnabledGateways() {
  return Object.values(providers)
    .filter((p) => p.isEnabled())
    .map((p) => ({ key: p.key, label: p.label }));
}

module.exports = { getGateway, listEnabledGateways };
