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

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/v1/orders/payment-methods — public: which gateways checkout should offer right now.
const paymentMethods = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, listEnabledGateways());
});

// POST /api/v1/orders  — public checkout step 1: price the cart, create a
// pending Order + a matching gateway order for the frontend checkout step.
// `protectCustomer` middleware requires the buyer to be signed in — guest
// checkout is intentionally disabled, so req.customer is always set here.
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

      order.gatewayPaymentId = verified.gatewayPaymentId;
      order.gatewaySignature = verified.gatewaySignature;
      order.status = verified.finalStatus;
      if (verified.paid) order.paidAt = new Date();
      order.statusHistory.push({
        fromStatus: "created",
        toStatus: verified.finalStatus,
        note: verified.paid ? "Payment verified" : "Order confirmed (payment on delivery)",
      });
      await order.save({ session });

      // Decrement stock now that the order is confirmed, guarding against
      // overselling if stock ran out between checkout and confirmation.
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
    });

    return sendSuccess(res, 200, { orderNumber: result.orderNumber, status: result.status });
  } finally {
    session.endSession();
  }
});

// GET /api/v1/orders/:orderNumber — public order lookup (customer tracking page)
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
  const verified = Boolean(emailMatches || phoneMatches);

  const base = {
    orderNumber: order.orderNumber,
    status: order.status,
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

module.exports = {
  paymentMethods,
  createOrder,
  verifyPayment,
  getByOrderNumber,
  listOrders,
  getOrderById,
  updateOrderStatus,
};
