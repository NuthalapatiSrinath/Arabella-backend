// src/modules/auth/auth.controller.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../database/models/user/user.model.js";
import { config } from "../../config/index.js"; // <-- FIXED path (from src/modules/auth)
import sendEmail from "../../utils/email.js"; // <-- relative: src/modules/auth -> src/utils
import { forgotPasswordEmail } from "../../utils/forgotPasswordMailPage.js";

function signJwt(payload) {
  // use config.jwt.* keys (access token)
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
}

// Register
// Register
export const registerController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing name/email/password" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    // Accept role from client but only allow known values; default to 'user'
    const safeRole = ["user", "admin"].includes(role) ? role : "user";

    // Create user (assumes model pre-save middleware hashes password)
    const user = await User.create({ name, email, password, role: safeRole });

    // Prepare response object without any password/hash fields
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.passwordHash;
    delete userObj.__v; // optional cleanup

    return res.status(201).json({ success: true, data: userObj });
  } catch (err) {
    console.error("registerController error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Login
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const isValid = await user.validatePassword(password);
    if (!isValid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = signJwt({ sub: user._id, role: user.role });
    return res.status(200).json({ success: true, data: user.toJSON(), token });
  } catch (err) {
    console.error("loginController error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// (rest of controllers — changePasswordController, forgotPasswordController, resetPasswordController)
// keep them as you have, but ensure they also import config from "../../config/index.js"

// Change password (authenticated route) - require oldPassword verify
export const changePasswordController = async (req, res) => {
  try {
    const userId = req.user.sub; // from auth middleware
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const user = await User.findById(userId).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const ok = await user.validatePassword(currentPassword);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Current password incorrect" });

    user.password = newPassword; // pre-save hook will hash
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Forgot password (request reset)
// Forgot password (request reset) - robust version for testing
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      // do not reveal existence
      console.info(
        `forgot-password requested for non-existing email: ${email}`
      );
      return res.status(200).json({
        success: true,
        message: "If account exists, password reset email will be sent",
      });
    }

    // generate token and save hashed token + expiry to DB
    const token = user.generatePasswordReset();
    await user.save({ validateBeforeSave: false });

    // For testing: print the plain token to server console (remove in prod)
    console.info(`Password reset token for ${email}: ${token}`);
    console.info(
      `Hashed token saved in DB (resetPasswordToken): ${user.resetPasswordToken}`
    );

    // send email in background — do NOT await (so SMTP errors do not return 500)
    setImmediate(async () => {
      try {
        const resetUrl = `http://192.168.8.111:3001?token=${token}`;
        await sendEmail({
          to: user.email,
          subject: "Password reset",
          text: `Reset your password: ${resetUrl}`,
          html: forgotPasswordEmail(resetUrl, "Srinath"),
        });
        console.info(`Reset email queued/sent to ${user.email}`);
      } catch (emailErr) {
        console.error("Failed to send reset email (background):", emailErr);
      }
    });

    return res.status(200).json({
      success: true,
      message: "If account exists, password reset email will be sent",
    });
  } catch (err) {
    // log full error to server console for debugging
    console.error("forgotPasswordController error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset password: user clicks link -> POST new password + token
export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "Missing token or password" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Token invalid or expired" });

    user.password = newPassword; // pre-save will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset success" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
