const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const Customer = require("../models/Customer");
const OtpCode = require("../models/OtpCode");
const { sendMail } = require("../services/email");
const {
  signCustomerToken,
  setCustomerAuthCookie,
  clearCustomerAuthCookie,
} = require("../utils/customerToken");

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
const ADDRESS_FIELDS = ["line1", "line2", "city", "state", "postalCode", "country"];

function publicCustomer(customer) {
  return {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    emailVerified: Boolean(customer.emailVerified),
    avatarUrl: customer.avatarUrl || null,
    address: customer.address || {},
    location: customer.location || {},
    devices: (customer.devices || []).map((d) => ({ label: d.label, lastUsedAt: d.lastUsedAt })),
  };
}

function clientIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
}

function otpEmail(code) {
  return {
    subject: "Your JATA Ayurveda verification code",
    text: `Your verification code is ${code}. It expires in ${Number(process.env.OTP_TTL_MINUTES) || 10} minutes.`,
    html: `<p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>It expires in ${Number(process.env.OTP_TTL_MINUTES) || 10} minutes. If you didn't request this, you can ignore this email.</p>`,
  };
}

// POST /api/v1/customers/auth/otp/send  { email, purpose }
// purpose: "register" (new account activation) or "reset" (forgot password).
const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  if (!email || !["register", "reset"].includes(purpose)) {
    throw new ApiError(400, "A valid email and purpose ('register' or 'reset') are required");
  }
  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await Customer.findOne({ email: normalizedEmail });
  if (purpose === "register" && existing?.emailVerified) {
    throw new ApiError(409, "An account with this email already exists. Try logging in instead.");
  }
  if (purpose === "reset" && !existing) {
    // Don't reveal whether the email has an account — respond the same way either way.
    return sendSuccess(res, 200, { sent: true });
  }

  const { code } = await OtpCode.createFor(normalizedEmail, purpose);
  const { subject, text, html } = otpEmail(code);
  await sendMail({ to: normalizedEmail, subject, text, html });

  return sendSuccess(res, 200, { sent: true });
});

// POST /api/v1/customers/auth/register  { name, email, password, otp }
const register = asyncHandler(async (req, res) => {
  const { name, email, password, otp } = req.body;
  if (!name || !email || !password || !otp) {
    throw new ApiError(400, "Name, email, password and the verification code are required");
  }
  if (String(password).length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const normalizedEmail = String(email).toLowerCase().trim();

  const otpRecord = await OtpCode.findOne({ email: normalizedEmail, purpose: "register", consumedAt: null });
  if (!otpRecord) throw new ApiError(400, "No pending verification code for this email. Please request a new one.");
  if (otpRecord.attempts >= 5) throw new ApiError(429, "Too many incorrect attempts. Please request a new code.");

  const validCode = await otpRecord.compareCode(String(otp));
  if (!validCode) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new ApiError(400, "Incorrect verification code");
  }
  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  let customer = await Customer.findOne({ email: normalizedEmail });
  const passwordHash = await Customer.hashPassword(password);

  if (customer) {
    if (customer.emailVerified) throw new ApiError(409, "An account with this email already exists.");
    customer.name = String(name).trim();
    customer.passwordHash = passwordHash;
    customer.emailVerified = true;
  } else {
    customer = new Customer({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: true,
    });
  }

  customer.recordDevice(req.headers["user-agent"], clientIp(req));
  customer.lastLoginAt = new Date();
  await customer.save();

  const token = signCustomerToken(customer._id, true, customer.tokenVersion);
  setCustomerAuthCookie(res, token, req, true);

  return sendSuccess(res, 201, { customer: publicCustomer(customer) });
});

// POST /api/v1/customers/auth/login  { email, password, rememberMe }
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const normalizedEmail = String(email).toLowerCase().trim();
  // Same error message for "no account", "wrong password", and "not
  // verified" so the endpoint can't be used to enumerate accounts — except
  // unverified accounts get a distinct, actionable message since that's not
  // sensitive information and the customer needs to know what to do next.
  const customer = await Customer.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!customer || !customer.isActive || !(await customer.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!customer.emailVerified) {
    throw new ApiError(403, "Please verify your email first — check the code we sent when you registered.");
  }

  customer.recordDevice(req.headers["user-agent"], clientIp(req));
  customer.lastLoginAt = new Date();
  await customer.save();

  const token = signCustomerToken(customer._id, Boolean(rememberMe), customer.tokenVersion);
  setCustomerAuthCookie(res, token, req, Boolean(rememberMe));

  return sendSuccess(res, 200, { customer: publicCustomer(customer) });
});

// POST /api/v1/customers/auth/reset-password  { email, otp, newPassword }
// Requires an OTP sent with purpose "reset" (POST /otp/send). Unlike
// register, this never creates an account — only resets the password of an
// existing one, and only after the code is verified.
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, verification code and a new password are required");
  }
  if (String(newPassword).length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const normalizedEmail = String(email).toLowerCase().trim();

  const otpRecord = await OtpCode.findOne({ email: normalizedEmail, purpose: "reset", consumedAt: null });
  if (!otpRecord) throw new ApiError(400, "No pending reset code for this email. Please request a new one.");
  if (otpRecord.attempts >= 5) throw new ApiError(429, "Too many incorrect attempts. Please request a new code.");

  const validCode = await otpRecord.compareCode(String(otp));
  if (!validCode) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new ApiError(400, "Incorrect verification code");
  }
  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  const customer = await Customer.findOne({ email: normalizedEmail });
  if (!customer || !customer.isActive) {
    // The OTP step already avoided confirming whether this email has an
    // account, so keep the same non-committal response here too.
    throw new ApiError(400, "Could not reset the password for this email.");
  }

  customer.passwordHash = await Customer.hashPassword(newPassword);
  // A password reset via a verified inbox code is itself proof of ownership.
  customer.emailVerified = true;
  // Instantly invalidates every previously issued token for this customer —
  // including ones on other devices that are still within their expiry
  // window — since protectCustomer compares this against each token's `tv`
  // claim. A reset usually means "I think someone else might have access,"
  // so this is the actual security-relevant part of a password reset, not
  // just changing the password hash.
  customer.tokenVersion = (customer.tokenVersion || 0) + 1;
  await customer.save();

  clearCustomerAuthCookie(res, req);

  return sendSuccess(res, 200, { reset: true });
});

// POST /api/v1/customers/auth/google  { credential }
// `credential` is the ID token returned by Google Identity Services on the frontend.
const googleLogin = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw new ApiError(503, "Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the backend.");
  }
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, "Missing Google credential");

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Google sign-in verification failed");
  }
  if (!payload?.email_verified) throw new ApiError(401, "Google account email is not verified");

  const normalizedEmail = payload.email.toLowerCase().trim();
  let customer = await Customer.findOne({ $or: [{ googleId: payload.sub }, { email: normalizedEmail }] });

  if (!customer) {
    customer = await Customer.create({
      name: payload.name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      googleId: payload.sub,
      avatarUrl: payload.picture,
    });
  } else {
    if (!customer.isActive) throw new ApiError(401, "This account has been deactivated");
    if (!customer.googleId) customer.googleId = payload.sub;
    if (!customer.avatarUrl && payload.picture) customer.avatarUrl = payload.picture;
  }

  customer.recordDevice(req.headers["user-agent"], clientIp(req));
  customer.lastLoginAt = new Date();
  await customer.save();

  // Google sign-in stays signed in (like most sites do), so this always uses the long-lived cookie.
  const token = signCustomerToken(customer._id, true, customer.tokenVersion);
  setCustomerAuthCookie(res, token, req, true);

  return sendSuccess(res, 200, { customer: publicCustomer(customer) });
});

// POST /api/v1/customers/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearCustomerAuthCookie(res, req);
  return sendSuccess(res, 200, { loggedOut: true });
});

// GET /api/v1/customers/auth/me
const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, publicCustomer(req.customer));
});

// PATCH /api/v1/customers/auth/profile  { name, address, location }
// Requires protectCustomer — req.customer is the signed-in customer's own record.
const updateProfile = asyncHandler(async (req, res) => {
  const { name, address, location } = req.body;
  const customer = req.customer;

  if (name !== undefined) {
    if (!String(name).trim()) throw new ApiError(400, "Name cannot be empty");
    customer.name = String(name).trim();
  }

  if (address && typeof address === "object") {
    customer.address = customer.address || {};
    for (const field of ADDRESS_FIELDS) {
      if (address[field] !== undefined) customer.address[field] = String(address[field]).trim();
    }
  }

  if (location && typeof location === "object") {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    customer.location = {
      lat: Number.isFinite(lat) ? lat : customer.location?.lat,
      lng: Number.isFinite(lng) ? lng : customer.location?.lng,
      formattedAddress:
        location.formattedAddress !== undefined
          ? String(location.formattedAddress).trim()
          : customer.location?.formattedAddress || "",
      placeId: location.placeId !== undefined ? String(location.placeId).trim() : customer.location?.placeId || "",
    };
  }

  await customer.save();
  return sendSuccess(res, 200, publicCustomer(customer));
});

module.exports = { sendOtp, register, login, resetPassword, googleLogin, logout, me, updateProfile };
