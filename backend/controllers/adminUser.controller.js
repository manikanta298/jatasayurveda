const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const User = require("../models/User");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

// GET /api/v1/users  (admin only)
const list = asyncHandler(async (req, res) => {
  const users = await User.find({}).sort("-createdAt");
  return sendSuccess(res, 200, users.map(publicUser));
});

// GET /api/v1/users/:id
const getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  return sendSuccess(res, 200, publicUser(user));
});

// POST /api/v1/users  { name, email, password, roles }
const create = asyncHandler(async (req, res) => {
  const { name, email, password, roles = [] } = req.body;
  if (!email || !password) throw new ApiError(400, "email and password are required");
  if (password.length < 8) throw new ApiError(400, "password must be at least 8 characters");

  const invalidRoles = roles.filter((r) => !User.ROLES.includes(r));
  if (invalidRoles.length) throw new ApiError(400, `Invalid roles: ${invalidRoles.join(", ")}`);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email: email.toLowerCase().trim(), passwordHash, roles });

  return sendSuccess(res, 201, publicUser(user));
});

// PATCH /api/v1/users/:id  { name, roles, isActive }
const update = asyncHandler(async (req, res) => {
  const { name, roles, isActive } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (isActive !== undefined) updates.isActive = isActive;
  if (roles !== undefined) {
    const invalidRoles = roles.filter((r) => !User.ROLES.includes(r));
    if (invalidRoles.length) throw new ApiError(400, `Invalid roles: ${invalidRoles.join(", ")}`);
    updates.roles = roles;
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, "User not found");
  return sendSuccess(res, 200, publicUser(user));
});

// DELETE /api/v1/users/:id
const remove = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot delete your own account");
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  return sendSuccess(res, 200, { deleted: true, id: req.params.id });
});

module.exports = { list, getOne, create, update, remove };
