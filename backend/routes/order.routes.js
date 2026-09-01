const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, requireRole } = require("../middleware/auth");
const { protectCustomer, identifyCustomer } = require("../middleware/customerAuth");
const validate = require("../middleware/validate");
const { createOrder, verifyPayment } = require("../validators/schemas");
const controller = require("../controllers/order.controller");

const router = express.Router();

const adminGuard = [protect, requireRole("admin", "order_manager")];

// Only the public checkout endpoints are limited here, so admin order
// management (list/detail/status updates) is unaffected.
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// Checkout requires a signed-in customer account (protectCustomer) — guest
// checkout was intentionally removed. The order is always linked to
// req.customer.
router.get("/payment-methods", controller.paymentMethods);
router.post("/", checkoutLimiter, protectCustomer, validate(createOrder), controller.createOrder);
router.post("/verify", checkoutLimiter, validate(verifyPayment), controller.verifyPayment);
router.get("/my", protectCustomer, controller.listMyOrders);
router.post("/icici/start", identifyCustomer, controller.iciciStart);
router.post("/icici/return", controller.iciciReturn);
router.post("/icici/advice", controller.iciciAdvice);
router.get("/:orderNumber", identifyCustomer, controller.getByOrderNumber);

// Admin management
router.get("/admin/all", ...adminGuard, controller.listOrders);
router.get("/admin/:id", ...adminGuard, controller.getOrderById);
router.patch("/admin/:id/status", ...adminGuard, controller.updateOrderStatus);
router.patch("/admin/:id/payment-status", ...adminGuard, controller.updatePaymentStatus);

module.exports = router;
