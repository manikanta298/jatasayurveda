const express = require("express");
const rateLimit = require("express-rate-limit");
const { protectCustomer } = require("../middleware/customerAuth");
const validate = require("../middleware/validate");
const { requestOtp, customerRegister, customerLogin, customerResetPassword } = require("../validators/schemas");
const controller = require("../controllers/customerAuth.controller");
const profileController = require("../controllers/customerProfile.controller");

const router = express.Router();

// Brute-force protection, same pattern as the staff login limiter in app.js.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

// Tighter limit on OTP sends specifically — each one triggers an outbound
// email, separate from the general auth attempt limiter below.
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many codes requested. Please wait a few minutes and try again." },
});

router.post("/otp/send", otpLimiter, validate(requestOtp), controller.sendOtp);
router.post("/register", authLimiter, validate(customerRegister), controller.register);
router.post("/login", authLimiter, validate(customerLogin), controller.login);
router.post("/reset-password", authLimiter, validate(customerResetPassword), controller.resetPassword);
router.post("/google", authLimiter, controller.googleLogin);
router.post("/logout", controller.logout);
router.get("/me", protectCustomer, controller.me);
// Profile updates use a dedicated PATCH handler so partial address/name saves
// do not fail with a generic 400 when the UI intentionally updates only one field.
router.patch("/profile", protectCustomer, profileController.updateProfile);

module.exports = router;
