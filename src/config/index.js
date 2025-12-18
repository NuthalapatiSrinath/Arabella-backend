import dotenv from "dotenv";
dotenv.config();

import { appConfig } from "./app.config.js";
import { dbConfig } from "./db.config.js";

export const config = {
  app: {
    ...appConfig,
    frontendUrl: process.env.FRONTEND_URL || "http://192.168.8.111:3001",
  },

  db: dbConfig,

  // -----------------------------
  // JWT / Token Configuration
  // -----------------------------
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,

    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",

    refreshCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken",

    refreshCookieSecure:
      process.env.REFRESH_COOKIE_SECURE === "true" ? true : false,
  },

  // -----------------------------
  // Security Configuration
  // -----------------------------
  security: {
    bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS
      ? Number(process.env.BCRYPT_SALT_ROUNDS)
      : 100,

    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS
      ? Number(process.env.RATE_LIMIT_WINDOW_MS)
      : 60_000,

    rateLimitMax: process.env.RATE_LIMIT_MAX
      ? Number(process.env.RATE_LIMIT_MAX)
      : 100,
  },

  // -----------------------------
  // Email Configuration
  // -----------------------------
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    user: process.env.EMAIL_USER || "devakarthik8899@gmail.com",
    pass: process.env.EMAIL_PASS || "emse yvcn clnh xqqv",

    // Default "from" address
    from: process.env.EMAIL_FROM || "devakarthik8899@gmail.com",
  },

  // -----------------------------
  // Password Reset Token Settings
  // -----------------------------
  auth: {
    resetTokenExpiryMs: process.env.RESET_TOKEN_EXPIRY_MS
      ? Number(process.env.RESET_TOKEN_EXPIRY_MS)
      : 3600_000, // 1 hour default

    // (Optional) Enable email verification later
    emailVerificationExpiryMs: process.env.EMAIL_VERIFY_EXPIRY_MS
      ? Number(process.env.EMAIL_VERIFY_EXPIRY_MS)
      : 3600_000, // 1 hour
  },
};
