const Joi = require("joi");

// --- Admin auth -------------------------------------------------------
const adminLogin = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(1).required(),
});

// --- Customer auth ------------------------------------------------------
const requestOtp = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  purpose: Joi.string().valid("register", "reset").required(),
});

const customerRegister = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(),
  otp: Joi.string().trim().length(6).pattern(/^\d+$/).required(),
});

const customerLogin = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(1).required(),
  rememberMe: Joi.boolean().optional(),
});

const customerResetPassword = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  otp: Joi.string().trim().length(6).pattern(/^\d+$/).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

// --- Contact / Consultation form ----------------------------------------
const contactSubmit = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string().trim().min(6).max(20).required(),
  age: Joi.alternatives(Joi.number(), Joi.string().allow("")).optional(),
  gender: Joi.string().trim().allow("").optional(),
  symptoms: Joi.string().trim().allow("").max(2000).optional(),
  symptomDuration: Joi.string().trim().allow("").max(200).optional(),
  medicalHistory: Joi.string().trim().allow("").max(2000).optional(),
  currentMedicines: Joi.string().trim().allow("").max(2000).optional(),
  allergies: Joi.string().trim().allow("").max(2000).optional(),
  otherDetails: Joi.string().trim().allow("").max(2000).optional(),
  subject: Joi.string().trim().allow("").max(200).optional(),
  message: Joi.string().trim().min(1).max(5000).required(),
});

// --- Checkout -------------------------------------------------------------
const addressSchema = Joi.object({
  line1: Joi.string().trim().allow("").max(200),
  line2: Joi.string().trim().allow("").max(200),
  city: Joi.string().trim().allow("").max(120),
  state: Joi.string().trim().allow("").max(120),
  postalCode: Joi.string().trim().allow("").max(20),
  country: Joi.string().trim().allow("").max(120),
});

const cartItem = Joi.object({
  product: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).max(50).required(),
}).unknown(true); // pricing/name/etc. are re-derived server-side, so extra client fields are harmless

const createOrder = Joi.object({
  customerName: Joi.string().trim().min(1).max(120).required(),
  customerEmail: Joi.string().trim().lowercase().email().required(),
  customerPhone: Joi.string().trim().min(6).max(20).required(),
  shippingAddress: addressSchema.required(),
  cartItems: Joi.array().items(cartItem).min(1).required(),
  couponCode: Joi.string().trim().uppercase().allow("", null).optional(),
  notes: Joi.string().trim().allow("").max(1000).optional(),
  paymentMethod: Joi.string().trim().optional(),
});

const verifyPayment = Joi.object({
  paymentMethod: Joi.string().trim().required(),
  gatewayOrderId: Joi.string().trim().required(),
  gatewayPaymentId: Joi.string().trim().required(),
  gatewaySignature: Joi.string().trim().allow("").optional(),
});

module.exports = {
  adminLogin,
  requestOtp,
  customerRegister,
  customerLogin,
  customerResetPassword,
  contactSubmit,
  createOrder,
  verifyPayment,
};
