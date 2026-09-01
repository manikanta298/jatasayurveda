const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Notification = require("../models/Notification");
const { priceOrder } = require("../services/order.service");
const { getGateway, listEnabledGateways } = require("../services/payments");
const iciciProvider = require("../services/payments/icici.provider");

async function finalizeOrderPayment({ order, verified, session }) {
  if (!verified.paid && verified.finalStatus === "created") {
    order.gatewayPaymentId = verified.gatewayPaymentId;
    order.gatewaySignature = verified.gatewaySignature;
    await order.save({ session });
    return order;
  }

  order.status = verified.finalStatus;
  if (verified.paid) {
    order.paidAt = new Date();
    order.paymentStatus = "paid";
  }
  order.statusHistory.push({
    fromStatus: "created",
    toStatus: verified.finalStatus,
    note: verified.paid ? "Payment verified" : "Payment rejected by ICICI Bank",
  });
  await order.save({ session });

  if (!verified.paid) return order;

  for (const item of order.items) {
    const updated = await Product.updateOne(
      { _id: item.product, stockQuantity: { $gte: item.quantity } },
      { $inc: { stockQuantity: -item.quantity } },
      { session }
    );
    if (!updated.modifiedCount) {
      throw new ApiError(409, `Insufficient stock for ${item.name}`);
    }
  }

  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } }, { session });
  }

  await Notification.create(
    [
      {
        type: "new_order",
        title: `New order ${order.orderNumber}`,
        message: `${order.customerName} placed an order for ₹${(order.totalPaise / 100).toFixed(2)}`,
        link: `/admin/orders/${order._id}`,
        recipientRoles: ["admin", "order_manager"],
      },
    ],
    { session }
  );

  return order;
}

function getFrontendUrl() {
  return (process.env.ICICI_FRONTEND_URL || process.env.CLIENT_URL || "https://jatasayurveda.com")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/v1/orders/payment-methods — public: which gateways checkout should offer right now.
const paymentMethods = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, listEnabledGateways());
});

// POST /api/v1/orders — public checkout step 1: price the cart, create a
// pending Order + a matching gateway order for the frontend checkout step.
const createOrder = asyncHandler(async (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, cartItems, couponCode, notes, paymentMethod } =
    req.body;

  if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
    throw new ApiError(400, "Customer and shipping details are required");
  }

  const gateway = getGateway(paymentMethod || "razorpay");

  const { items, subtotalPaise, shippingPaise, discountPaise, totalPaise, appliedCoupon } = await priceOrder({
    cartItems,
    couponCode,
  });

  const order = await Order.create({
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    subtotalPaise,
    shippingPaise,
    discountPaise,
    totalPaise,
    couponCode: appliedCoupon?.code || null,
    notes,
    paymentMethod: gateway.key,
    customer: req.customer?._id || null,
    status: "created",
    paymentStatus: "pending",
    statusHistory: [{ toStatus: "created", note: "Order created, awaiting payment" }],
  });

  const gatewayResult = await gateway.createOrder({ order });
  order.gatewayOrderId = gatewayResult.gatewayOrderId;
  await order.save();

  return sendSuccess(res, 201, {
    orderNumber: order.orderNumber,
    totalPaise: order.totalPaise,
    currency: order.currency,
    paymentMethod: gateway.key,
    requiresClientAction: gatewayResult.requiresClientAction,
    gatewayOrderId: gatewayResult.gatewayOrderId,
    gatewayConfig: gatewayResult.clientConfig,
  });
});

// POST /api/v1/orders/verify — public checkout step 2: verify the payment
// (or finalize immediately for offline methods like COD), then mark the order paid/processing.
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentMethod, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;
  if (!paymentMethod || !gatewayOrderId) {
    throw new ApiError(400, "paymentMethod and gatewayOrderId are required");
  }

  const gateway = getGateway(paymentMethod);

  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const order = await Order.findOne({ gatewayOrderId, paymentMethod: gateway.key }).session(session);
      if (!order) throw new ApiError(404, "Order not found for this payment");

      // Idempotency guard: if this order was already finalized (e.g. a
      // duplicate/replayed callback), don't redo the stock decrement,
      // coupon increment, or notification.
      if (order.status !== "created") {
        return order;
      }

      const verified = await gateway.verifyPayment({
        order,
        payload: { gatewayOrderId, gatewayPaymentId, gatewaySignature },
      });

      return finalizeOrderPayment({ order, verified, session });
    });

    return sendSuccess(res, 200, { orderNumber: result.orderNumber, status: result.status });
  } finally {
    session.endSession();
  }
});

// POST /api/v1/orders/icici/start — bridge used by the existing checkout form.
const iciciStart = asyncHandler(async (req, res) => {
  const orderNumber = String(req.body?.orderNumber || "").trim();
  if (!orderNumber) throw new ApiError(400, "Missing ICICI order reference");

  const order = await Order.findOne({ orderNumber, paymentMethod: "icici", status: "created" });
  if (!order) throw new ApiError(404, "ICICI order not found");

  if (req.customer && order.customer && String(req.customer._id) !== String(order.customer)) {
    throw new ApiError(403, "Order does not belong to the signed-in customer");
  }
  if (!order.gatewayRedirectUrl || !order.gatewayTranCtx) {
    throw new ApiError(409, "ICICI payment session is unavailable; please restart checkout");
  }

  const redirectUrl = new URL(order.gatewayRedirectUrl);
  redirectUrl.searchParams.set("tranCtx", order.gatewayTranCtx);
  console.info("[icici] redirecting customer to hosted payment page", { merchantTxnNo: order.gatewayOrderId });
  return res.redirect(redirectUrl.toString());
});

// POST /api/v1/orders/icici/return — ICICI browser POST callback.
const iciciReturn = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.merchantTxnNo) throw new ApiError(400, "Missing ICICI merchant transaction reference");

  const order = await Order.findOne({ paymentMethod: "icici", gatewayOrderId: payload.merchantTxnNo });
  if (!order) throw new ApiError(404, "ICICI order not found");

  if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
    return res.redirect(`${getFrontendUrl()}/order/${encodeURIComponent(order.orderNumber)}?payment=success`);
  }

  const verified = await iciciProvider.verifyPayment({ order, payload });
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const current = await Order.findById(order._id).session(session);
      if (!current) throw new ApiError(404, "ICICI order not found");
      if (current.status !== "created") return current;
      return finalizeOrderPayment({ order: current, verified, session });
    });

    const paymentState = result.status === "paid" ? "success" : result.status === "cancelled" ? "failed" : "pending";
    console.info("[icici] browser return processed", { merchantTxnNo: payload.merchantTxnNo, paymentState });
    return res.redirect(`${getFrontendUrl()}/order/${encodeURIComponent(result.orderNumber)}?payment=${paymentState}`);
  } finally {
    session.endSession();
  }
});

// POST /api/v1/orders/icici/advice — ICICI server-to-server Payment Advice.
const iciciAdvice = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.merchantTxnNo) return res.sendStatus(200);

  const order = await Order.findOne({ paymentMethod: "icici", gatewayOrderId: payload.merchantTxnNo });
  if (!order) return res.sendStatus(200);
  if (!iciciProvider.verifySecureHash(payload)) {
    console.warn("[icici] rejected advice with invalid secureHash", { merchantTxnNo: payload.merchantTxnNo });
    return res.sendStatus(400);
  }

  const verified = await iciciProvider.verifyPayment({ order, payload });
  if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
    return res.sendStatus(200);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await Order.findById(order._id).session(session);
      if (!current || current.status !== "created") return;
      await finalizeOrderPayment({ order: current, verified, session });
    });
  } finally {
    session.endSession();
  }

  console.info("[icici] payment advice processed", { merchantTxnNo: payload.merchantTxnNo, paid: verified.paid });
  return res.sendStatus(200);
});

// GET /api/v1/orders/:orderNumber — public order lookup (customer tracking page).
// Anyone who has (or guesses) the order number can check status, but full
// customer details (name, email, phone, shipping address) are only returned
// if the caller also supplies the matching email or phone — this prevents a
// leaked/guessed order number alone from exposing PII.
const getByOrderNumber = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber }).populate(
    "items.product",
    "name slug featuredImageUrl"
  );
  if (!order) throw new ApiError(404, "Order not found");

  const { email, phone } = req.query;
  const emailMatches = email && order.customerEmail?.toLowerCase() === String(email).toLowerCase();
  const phoneMatches = phone && order.customerPhone === String(phone);
  const customerMatches = req.customer && order.customer && String(req.customer._id) === String(order.customer);
  const verified = Boolean(emailMatches || phoneMatches || customerMatches);

  const base = {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    items: order.items,
    totalPaise: order.totalPaise,
    currency: order.currency,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };

  if (!verified) {
    return sendSuccess(res, 200, base);
  }

  return sendSuccess(res, 200, {
    ...base,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    subtotalPaise: order.subtotalPaise,
    shippingPaise: order.shippingPaise,
  });
});

// GET /api/v1/orders/my — authenticated customer's order history
const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.customer._id })
    .sort("-createdAt")
    .select("orderNumber createdAt status paymentStatus paymentMethod totalPaise currency items.name items.quantity items.image paidAt collectedAt shippingAddress");
  return sendSuccess(res, 200, orders);
});

// GET /api/v1/orders/admin/all — admin/order_manager
const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const q = String(req.query.q).trim().slice(0, 64);
    const regex = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ orderNumber: regex }, { customerEmail: regex }, { customerName: regex }];
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, items, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

// GET /api/v1/orders/admin/:id — admin/order_manager
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product", "name slug featuredImageUrl");
  if (!order) throw new ApiError(404, "Order not found");
  return sendSuccess(res, 200, order);
});

// PATCH /api/v1/orders/admin/:id/status  { status, note } — admin/order_manager
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ["created", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `status must be one of: ${validStatuses.join(", ")}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  order.statusHistory.push({ fromStatus: order.status, toStatus: status, note, changedBy: req.user._id });
  order.status = status;
  await order.save();

  return sendSuccess(res, 200, order);
});

// PATCH /api/v1/orders/admin/:id/payment-status { paymentStatus: "collected" }
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  if (paymentStatus !== "collected") throw new ApiError(400, "Only COD collection can be manually marked as Collected");
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentMethod !== "cod") throw new ApiError(400, "Only Cash on Delivery orders can be marked Collected");
  order.paymentStatus = "collected";
  order.collectedAt = new Date();
  order.collectedBy = req.user._id;
  await order.save();
  return sendSuccess(res, 200, order);
});

module.exports = {
  paymentMethods,
  createOrder,
  verifyPayment,
  iciciStart,
  iciciReturn,
  iciciAdvice,
  getByOrderNumber,
  listOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  listMyOrders,
};
