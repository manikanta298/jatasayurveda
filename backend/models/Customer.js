const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deviceSchema = new mongoose.Schema(
  {
    label: String,
    ip: String,
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Free-form postal address, kept separate from `location` (the GPS-picked
// map point) since a customer may fill in one without the other.
const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// Coordinates + formatted label captured from the profile page's "use my
// location" picker, used for delivery accuracy and showing the customer's
// pin back to them.
const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
    formattedAddress: { type: String, trim: true, default: "" },
    placeId: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// Deliberately a separate collection from models/User.js (staff/admin
// accounts). Keeping the two apart means a bug in one auth system can never
// accidentally grant access to the other, and customers can never end up
// with staff roles (or vice versa) through a shared model.
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Optional: accounts created via "Continue with Google" have no
    // password at all — this is intentionally not required.
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
    // Set to true once the customer confirms the email OTP sent at
    // registration. Unverified accounts can be created but cannot log in
    // (see customerAuth.controller.js's login()).
    emailVerified: { type: Boolean, default: false },
    // Bumped on password reset to instantly invalidate every previously
    // issued session token (see utils/customerToken.js, middleware/customerAuth.js).
    tokenVersion: { type: Number, default: 0 },
    avatarUrl: String,
    address: { type: addressSchema, default: () => ({}) },
    location: { type: locationSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // Small rolling history of devices that have signed in, shown to the
    // customer for their own visibility. Signing in from a new device is
    // never blocked or given extra friction — that's what keeps "simple
    // logins when changing devices" simple.
    devices: { type: [deviceSchema], default: [] },
  },
  { timestamps: true }
);

customerSchema.methods.comparePassword = function (candidate) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

customerSchema.methods.recordDevice = function (userAgent, ip) {
  const label = String(userAgent || "Unknown device").slice(0, 200);
  this.devices = this.devices.filter((d) => d.label !== label);
  this.devices.unshift({ label, ip, lastUsedAt: new Date() });
  this.devices = this.devices.slice(0, 5);
};

customerSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

module.exports = mongoose.model("Customer", customerSchema);
