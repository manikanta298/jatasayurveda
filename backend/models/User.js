const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = [
  "admin",
  "content_manager",
  "product_manager",
  "order_manager",
  "marketing_manager",
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [{ type: String, enum: ROLES }],
      default: [],
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.hasRole = function (...roles) {
  return this.roles.some((r) => roles.includes(r));
};

userSchema.statics.ROLES = ROLES;

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
