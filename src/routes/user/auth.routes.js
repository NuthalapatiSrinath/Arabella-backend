import express from "express";
import {
  registerController,
  loginController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordController,
} from "../../controllers/user/authController.js";

const router = express.Router();

// --- Registration & Verification ---
router.post("/register", registerController);
router.post("/verify-email", verifyEmailController);

// --- Login ---
router.post("/login", loginController);

// --- Password Management ---
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

export default router;
