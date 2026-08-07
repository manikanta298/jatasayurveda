const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

// Verifies JWT and attaches req.user. Token can arrive via httpOnly cookie or Bearer header.
const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies[process.env.JWT_COOKIE_NAME || "jata_token"]) {
    token = req.cookies[process.env.JWT_COOKIE_NAME || "jata_token"];
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authenticated. Please log in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Session expired or invalid. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, "Account not found or deactivated.");
  }

  req.user = user;
  next();
});

// Restricts route to users holding at least one of the given roles.
// Usage: requireRole('admin', 'content_manager')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Not authenticated.");
  }
  if (!req.user.hasRole(...roles)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  next();
};

module.exports = { protect, requireRole };
