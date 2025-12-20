import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../database/models/user/user.model.js";
import { config } from "../../config/index.js";
import sendEmail from "../../utils/email.js";
import { forgotPasswordEmail } from "../../utils/forgotPasswordMailPage.js";
import { verifyEmailTemplate } from "../../utils/verifyEmailTemplate.js";

// Helper: Sign JWT
function signJwt(userId, role) {
  return jwt.sign({ sub: userId, role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
}

// 1. REGISTER
export const registerController = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const safeRole = ["user", "admin"].includes(role) ? role : "user";

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      phone,
      address,
    });

    const verifyToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${config.app.frontendUrl}/verify-email?token=${verifyToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email - Arabella Motor Inn",
      html: verifyEmailTemplate(verifyUrl, user.name),
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. VERIFY EMAIL
export const verifyEmailController = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    // Try finding user with raw token first (if saved raw)
    let user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    // If not found, try hashing it (if saved hashed)
    if (!user) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      user = await User.findOne({
        verificationToken: hashedToken,
        verificationExpires: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token invalid or expired" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const jwtToken = signJwt(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      token: jwtToken,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Verify Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 3. LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.validatePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email address before logging in.",
      });
    }

    const token = signJwt(user._id, user.role);
    return res.status(200).json({ success: true, data: user.toJSON(), token });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 4. FORGOT PASSWORD
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If account exists, password reset email will be sent",
      });
    }

    const resetToken = user.generatePasswordReset();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;

    console.log(`[DEV] RESET TOKEN for ${email}: ${resetToken}`);

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password - Arabella",
      html: forgotPasswordEmail(resetUrl, user.name),
    });

    return res.status(200).json({
      success: true,
      message: "If account exists, password reset email will be sent",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 5. RESET PASSWORD
export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token invalid or expired" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = signJwt(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You are now logged in.",
      token: jwtToken,
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
