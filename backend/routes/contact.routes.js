const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { contactSubmit } = require("../validators/schemas");
const controller = require("../controllers/contact.controller");

const router = express.Router();

// This endpoint is public and now also triggers an outbound call to Google
// Apps Script, so it's rate-limited the same way the customer auth/checkout
// endpoints are.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many messages sent. Please try again later." },
});

router.post("/", contactLimiter, validate(contactSubmit), controller.submit);
router.get("/admin/all", protect, requireRole("admin", "order_manager"), controller.list);
router.patch("/admin/:id", protect, requireRole("admin", "order_manager"), controller.updateStatus);

module.exports = router;
