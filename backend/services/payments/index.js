const ApiError = require("../../utils/ApiError");

// Registry of payment gateway adapters. Every adapter implements the same
// shape: { key, label, isEnabled(), createOrder({order}), verifyPayment({order, payload}) }.
// Adding a new gateway later is just: write a new adapter file matching this
// shape. Nothing else in the app needs to know which gateways exist.
const providers = {
  icici: require("./icici.provider"),
  cod: require("./cod.provider"),
};

function getGateway(key) {
  const provider = providers[key];
  if (!provider) throw new ApiError(400, `Unsupported payment method: ${key}`);
  if (!provider.isEnabled()) throw new ApiError(400, `Payment method "${key}" is not currently available`);
  return provider;
}

function listEnabledGateways() {
  return Object.values(providers)
    .filter((p) => p.isEnabled())
    .map((p) => ({ key: p.key, label: p.label }));
}

module.exports = { getGateway, listEnabledGateways };
