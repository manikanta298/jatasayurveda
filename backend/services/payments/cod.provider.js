// Cash on Delivery: no online payment happens, so this adapter mostly just
// gives every order a consistent shape to flow through the same
// create -> verify -> finalize pipeline as the online gateways.
module.exports = {
  key: "cod",
  label: "Cash on Delivery",
  isEnabled() {
    return true;
  },

  async createOrder({ order }) {
    return {
      requiresClientAction: false,
      gatewayOrderId: `COD-${order.orderNumber}`,
      clientConfig: {},
      initialStatus: "processing",
    };
  },

  async verifyPayment() {
    // Nothing to verify online — the order is confirmed and cash is collected on delivery.
    return { gatewayPaymentId: null, gatewaySignature: null, paid: false, finalStatus: "processing" };
  },
};
