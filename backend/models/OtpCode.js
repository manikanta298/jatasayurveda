const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES) || 10;
const MAX_ATTEMPTS = 5;

const otpCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ["register", "reset"], required: true },
    // Never store the raw code — only its bcrypt hash, same principle as passwords.
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: MongoDB auto-deletes the document once expiresAt passes, so
// expired codes don't linger and there's no cleanup job to maintain.
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpCodeSchema.index({ email: 1, purpose: 1 });

otpCodeSchema.methods.compareCode = function (candidate) {
  return bcrypt.compare(candidate, this.codeHash);
};

otpCodeSchema.statics.generateCode = function () {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
};

otpCodeSchema.statics.createFor = async function (email, purpose) {
  // Invalidate any previous unconsumed codes for this email+purpose so only
  // the most recently sent code is ever valid.
  await this.deleteMany({ email, purpose, consumedAt: null });

  const code = this.generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const record = await this.create({
    email,
    purpose,
    codeHash,
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000),
  });
  return { record, code };
};

module.exports = mongoose.model("OtpCode", otpCodeSchema);
