const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/token");
const User = require("../models/User");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
  };
}

// POST /api/v1/auth/login  { email, password }
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.warn(`[auth] login rejected: missing ${!email ? "email" : "password"}`);
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user) {
    console.warn(`[auth] login failed: no account for "${normalizedEmail}"`);
    throw new ApiError(401, "Invalid credentials");
  }
  if (!user.isActive) {
    console.warn(`[auth] login failed: account "${normalizedEmail}" is deactivated`);
    throw new ApiError(401, "Invalid credentials");
  }

  const match = await user.comparePassword(password);
  if (!match) {
    console.warn(`[auth] login failed: wrong password for "${normalizedEmail}"`);
    throw new ApiError(401, "Invalid credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);
  setAuthCookie(res, token, req);

  console.log(`[auth] login succeeded: "${normalizedEmail}"`);
  return sendSuccess(res, 200, { user: publicUser(user), token });
});

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res, req);
  return sendSuccess(res, 200, { loggedOut: true });
});

// GET /api/v1/auth/me
const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, publicUser(req.user));
});

// PATCH /api/v1/auth/me/password  { currentPassword, newPassword }
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "currentPassword and newPassword are required");
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "newPassword must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+passwordHash");
  const match = await user.comparePassword(currentPassword);
  if (!match) throw new ApiError(401, "Current password is incorrect");

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  return sendSuccess(res, 200, { updated: true });
});

module.exports = { login, logout, me, changePassword };
