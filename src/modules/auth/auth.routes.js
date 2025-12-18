import express from "express";
import {
  changePasswordController,
  loginController,
  registerController,
  forgotPasswordController,
  resetPasswordController,
} from "./auth.controller.js";

import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// PUBLIC ROUTES
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

// PROTECTED ROUTE
router.post("/changePassword", authenticate, changePasswordController);

export default router;
