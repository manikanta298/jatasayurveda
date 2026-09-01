const crypto = require("crypto");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Notification = require("../models/Notification");
const iciciProvider = require("../services/payments/icici.provider");

function getFrontendUrl() {
  return (process.env.ICICI_FRONTEND_URL || process.env.CLIENT_URL || "https://jatasayurveda.com")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
}

function bridgeHash(order) {
  return crypto
    .createHmac("sha256", process.env.ICICI_SECRET_KEY)
    .update(`${order.gatewayOrderId}|${order.gatewayTranCtx}`, "utf8")
    .digest("hex");
}

function hashesMatch(expected, received) {
  if (!expected || !received || !/^[0-9a-f]+$/i.test(String(received))) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(String(received), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function finalizeVerifiedPayment({ order, verified, session }) {
  if (order.status !== "created") return order;

  order.gatewayPaymentId = verified.gatewayPaymentId;
  order.gatewaySignature = verified.gatewaySignature;
  order.status = verified.finalStatus;
  if (verified.paid) {
    order.paidAt = new Date();
    order.paymentStatus = "paid";
  }
  order.statusHistory.push({
    fromStatus: "created",
    toStatus: verified.finalStatus,
    note: verified.paid ? "ICICI Bank payment verified" : "ICICI Bank payment rejected/pending",
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

function successRedirect(orderNumber) {
  return `${getFrontendUrl()}/order/${encodeURIComponent(orderNumber)}?payment=success`;
}

function failureRedirect(orderNumber) {
  return `${getFrontendUrl()}/order/${encodeURIComponent(orderNumber)}?payment=failed`;
}

/**
 * Browser-side bridge used by the existing checkout page. The checkout submits
 * orderNumber + requestHash to this endpoint. We verify the one-time transaction
 * context hash, then redirect to ICICI's documented {redirectURI}?tranCtx=...
 * hosted payment page. No ICICI secret or tranCtx is exposed to the browser.
 */
const iciciRedirect = asyncHandler(async (req, res) => {
  const { orderNumber, requestHash } = req.body || {};
  if (!orderNumber || !requestHash) throw new ApiError(400, "Invalid ICICI redirect request");

  const order = await Order.findOne({ orderNumber, paymentMethod: "icici" });
  if (!order || !order.gatewayRedirectUrl || !order.gatewayTranCtx) {
    throw new ApiError(404, "ICICI payment session not found");
  }
  if (!hashesMatch(bridgeHash(order), requestHash)) {
    throw new ApiError(400, "Invalid ICICI redirect signature");
  }
  if (order.status !== "created") {
    return res.redirect(successRedirect(order.orderNumber));
  }

  const url = new URL(order.gatewayRedirectUrl);
  url.searchParams.set("tranCtx", order.gatewayTranCtx);
  return res.redirect(303, url.toString());
});

/** ICICI browser return: application/x-www-form-urlencoded POST. */
const iciciReturn = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.merchantTxnNo) throw new ApiError(400, "Missing ICICI merchant transaction reference");

  const order = await Order.findOne({ paymentMethod: "icici", gatewayOrderId: payload.merchantTxnNo });
  if (!order) throw new ApiError(404, "ICICI order not found");

  if (["paid", "processing", "shipped", "delivered"].includes(order.status)) {
    return res.redirect(successRedirect(order.orderNumber));
  }

  try {
    const verified = await iciciProvider.verifyPayment({ order, payload });
    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        const current = await Order.findById(order._id).session(session);
        if (!current) throw new ApiError(404, "ICICI order not found");
        return finalizeVerifiedPayment({ order: current, verified, session });
      });

      if (result.status === "paid") return res.redirect(successRedirect(result.orderNumber));
      if (result.status === "cancelled") return res.redirect(failureRedirect(result.orderNumber));
      return res.redirect(`${getFrontendUrl()}/order/${encodeURIComponent(result.orderNumber)}?payment=pending`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("[icici] return processing failed", {
      merchantTxnNo: payload.merchantTxnNo,
      message: error.message,
    });
    return res.redirect(`${getFrontendUrl()}/order/${encodeURIComponent(order.orderNumber)}?payment=pending`);
  }
});

/** ICICI Payment Advice: accepts either form-encoded or JSON payloads. */
const iciciAdvice = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.merchantTxnNo) return res.sendStatus(200);

  const order = await Order.findOne({ paymentMethod: "icici", gatewayOrderId: payload.merchantTxnNo });
  if (!order) return res.sendStatus(200);
  if (!iciciProvider.verifySecureHash(payload)) {
    console.warn("[icici] rejected advice with invalid secureHash", { merchantTxnNo: payload.merchantTxnNo });
    return res.sendStatus(400);
  }

  if (["paid", "processing", "shipped", "delivered"].includes(order.status)) return res.sendStatus(200);

  const verified = await iciciProvider.verifyPayment({ order, payload });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await Order.findById(order._id).session(session);
      if (!current || current.status !== "created") return;
      await finalizeVerifiedPayment({ order: current, verified, session });
    });
  } finally {
    await session.endSession();
  }

  console.info("[icici] payment advice processed", {
    merchantTxnNo: payload.merchantTxnNo,
    paid: verified.paid,
  });
  return res.sendStatus(200);
});

module.exports = { iciciRedirect, iciciReturn, iciciAdvice, finalizeVerifiedPayment };
