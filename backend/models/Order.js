const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    slug: String,
    image: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPricePaise: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: String,
    toStatus: { type: String, required: true },
    note: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

function generateOrderNumber() {
  return "JATA-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, default: generateOrderNumber },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    items: { type: [orderItemSchema], required: true },
    subtotalPaise: { type: Number, required: true },
    shippingPaise: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    couponCode: { type: String, default: null },
    status: {
      type: String,
      enum: ["created", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "created",
    },
    paymentMethod: { type: String, enum: ["cod", "icici"], default: "icici" },
    gatewayOrderId: { type: String, unique: true, sparse: true },
    gatewayPaymentId: { type: String, unique: true, sparse: true },
    gatewaySignature: { type: String },
    gatewayRedirectUrl: { type: String },
    gatewayTranCtx: { type: String },
    gatewayRequestHash: { type: String },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    paymentStatus: { type: String, enum: ["pending", "paid", "collected"], default: "pending" },
    paidAt: { type: Date },
    collectedAt: { type: Date },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ customerEmail: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ customer: 1 });

module.exports = mongoose.model("Order", orderSchema);
