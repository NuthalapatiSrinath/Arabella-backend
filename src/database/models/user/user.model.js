// src/database/models/user/user.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../../../config/index.js"; // from src/database/models/user -> src/config

const userSchema = new mongoose.Schema({
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
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String, select: false, index: true },
  resetPasswordExpires: { type: Date, select: false },
});

// Pre-save hash
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const rounds = config.security.bcryptSaltRounds ?? 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.methods.validatePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generatePasswordReset = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = token;
  this.resetPasswordExpires =
    Date.now() + (config.auth.resetTokenExpiryMs ?? 3600000);
  return token;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export default mongoose.model("User", userSchema);
