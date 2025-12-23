import express from "express";
import {
  registerController,
  loginController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordController,
  getProfile,
} from "../../controllers/user/authController.js";
import { authenticate } from "../../middleware/auth.js";
const router = express.Router();

// --- Registration & Verification ---
router.post("/register", registerController);
router.post("/verify-email", verifyEmailController);

// --- Login ---
router.post("/login", loginController);

// --- Password Management ---
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
// ✅ NEW ROUTE: Get Profile
router.get("/me", authenticate, getProfile);
export default router;
