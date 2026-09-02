const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, requireRole } = require("../middleware/auth");
const { protectCustomer, identifyCustomer } = require("../middleware/customerAuth");
const validate = require("../middleware/validate");
const { createOrder, verifyPayment } = require("../validators/schemas");
const controller = require("../controllers/order.controller");
const { iciciRedirect } = require("../controllers/icici.redirect.controller");

const router = express.Router();
const adminGuard = [protect, requireRole("admin", "order_manager")];
const checkoutLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.get("/payment-methods", controller.paymentMethods);
router.post("/", checkoutLimiter, protectCustomer, validate(createOrder), controller.createOrder);
router.post("/verify", checkoutLimiter, validate(verifyPayment), controller.verifyPayment);
router.get("/my", protectCustomer, controller.listMyOrders);

// Keep fixed admin paths before /:orderNumber so /admin/* is not interpreted
// as a customer order number.
router.get("/admin/all", ...adminGuard, controller.listOrders);
router.get("/admin/:id", ...adminGuard, controller.getOrderById);
router.patch("/admin/:id/status", ...adminGuard, controller.updateOrderStatus);
router.patch("/admin/:id/payment-status", ...adminGuard, controller.updatePaymentStatus);

// ICICI Standard Mode bridge: validates the per-order HMAC and redirects to
// {redirectURI}?tranCtx=... without exposing the ICICI secret.
router.post("/icici/start", checkoutLimiter, iciciRedirect);
router.post("/icici/return", controller.iciciReturn);
router.post("/icici/advice", controller.iciciAdvice);
router.get("/icici/diagnostics", ...adminGuard, controller.iciciDiagnostics);

router.get("/:orderNumber", identifyCustomer, controller.getByOrderNumber);

module.exports = router;
