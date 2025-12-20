import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../../config/index.js";

const userSchema = new mongoose.Schema({
  // --- Basic Auth ---
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },

  // --- Profile Details (For Easy Payment) ---
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String, default: "India" },
  },

  // --- Email Verification ---
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, select: false },
  verificationExpires: { type: Date, select: false },

  // --- Password Reset ---
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },

  createdAt: { type: Date, default: Date.now },
});

// Hash Password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Validate Password
userSchema.methods.validatePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generate Verification Token
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token; // Send unhashed version to email
};

export default mongoose.model("User", userSchema);
