// src/utils/jwt.util.js
// JWT helpers: sign, verify and decode using config values

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js'; // read secrets/expiry from config

const ACCESS_SECRET = config.jwt.accessSecret;   // access token secret
const REFRESH_SECRET = config.jwt.refreshSecret; // refresh token secret

// sign access token
export function signAccessToken(payload) {
  if (!ACCESS_SECRET) throw new Error('JWT access secret not configured');
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: config.jwt.accessExpires });
}

// verify access token (throws if invalid/expired)
export function verifyAccessToken(token) {
  if (!ACCESS_SECRET) throw new Error('JWT access secret not configured');
  return jwt.verify(token, ACCESS_SECRET);
}

// sign refresh token
export function signRefreshToken(payload) {
  if (!REFRESH_SECRET) throw new Error('JWT refresh secret not configured');
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: config.jwt.refreshExpires });
}

// verify refresh token
export function verifyRefreshToken(token) {
  if (!REFRESH_SECRET) throw new Error('JWT refresh secret not configured');
  return jwt.verify(token, REFRESH_SECRET);
}

// decode any token without verifying (useful only for inspection)
export function decodeToken(token) {
  return jwt.decode(token, { complete: true }); // returns header + payload
}

// convenience: generate both tokens
export function generateTokens(payload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}
