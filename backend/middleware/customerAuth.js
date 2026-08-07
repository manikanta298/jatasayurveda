const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Customer = require("../models/Customer");
const { COOKIE_NAME } = require("../utils/customerToken");

function extractToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  if (req.headers.authorization?.startsWith("Bearer ")) return req.headers.authorization.split(" ")[1];
  return null;
}

// Requires a signed-in customer. Rejects staff tokens (aud check) so a
// staff session can never be replayed as a customer session.
const protectCustomer = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, "Please sign in to continue.");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Session expired or invalid. Please sign in again.");
  }
  if (decoded.aud !== "customer") throw new ApiError(401, "Invalid session.");

  const customer = await Customer.findById(decoded.id);
  if (!customer || !customer.isActive) throw new ApiError(401, "Account not found or deactivated.");
  if ((decoded.tv || 0) !== (customer.tokenVersion || 0)) {
    throw new ApiError(401, "Session expired or invalid. Please sign in again.");
  }

  req.customer = customer;
  next();
});

// Optional variant: attaches req.customer if a valid session is present,
// otherwise continues as a guest. Used at checkout so guests can still buy
// without an account, but logged-in customers get their order linked to them.
const identifyCustomer = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.aud !== "customer") return next();
    const customer = await Customer.findById(decoded.id);
    if (customer && customer.isActive && (decoded.tv || 0) === (customer.tokenVersion || 0)) {
      req.customer = customer;
    }
  } catch {
    // Invalid/expired token on an optional route — proceed as guest instead of failing checkout.
  }
  next();
});

module.exports = { protectCustomer, identifyCustomer };
