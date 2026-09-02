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
  pincode: Joi.string().trim().allow("").max(20),
  country: Joi.string().trim().allow("").max(120),
}).unknown(true);

const cartItem = Joi.object({
  productId: Joi.string().trim(),
  product: Joi.string().trim(),
  quantity: Joi.number().integer().min(1).max(50).required(),
}).custom((value, helpers) => {
  if (!value.productId && !value.product) {
    return helpers.error("any.invalid", { message: "productId is required" });
  }
  return { ...value, productId: value.productId || value.product };
}).unknown(true);

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

// The browser verification endpoint is retained only for COD. ICICI Standard
// Mode is completed by the signed browser return / Payment Advice and a
// server-side STATUS check, so it must never be finalized through this API.
const verifyPayment = Joi.object({
  paymentMethod: Joi.string().valid("cod").required(),
  gatewayOrderId: Joi.string().trim().required(),
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
