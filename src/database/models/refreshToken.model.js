// src/models/refreshToken.model.js
// Persistent refresh token model for rotation + revocation

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },   // token value (can be JWT or opaque)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // user ref
  expiresAt: { type: Date, required: true },               // expiry
  createdAt: { type: Date, default: Date.now },      // replacement token (for rotation)
  createdByIp: { type: String },                           // IP that created token
  revokedByIp: { type: String, default: null }             // IP that revoked token
});

// virtual property: whether token has expired
refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt.getTime();
});

// virtual property: whether token is active (not expired and not revoked)
refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revokedAt && !this.isExpired;
});

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
