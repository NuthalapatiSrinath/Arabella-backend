import express from "express";
import authRoutes from "./../modules/auth/auth.routes.js";
import roomRoutes from "./../modules/room/room.routes.js"; // <-- Import Room routes
import bookingRoutes from "./../modules/booking/booking.routes.js"; // <-- Import Booking routes
import adminRoutes from "./../modules/admin/admin.routes.js"; // Assumes you have the admin routes from previous step
import { createPaymentIntent } from "../modules/payment/payment.controller.js";
import { authenticate } from "./../middleware/auth.js";
import { isAdmin } from "./../middleware/admin.js";

const router = express.Router();

// 1. Auth Routes
router.use("/auth", authRoutes);

// 2. Room Routes (Public - view rooms)
router.use("/rooms", roomRoutes);

// 3. Booking Routes (Protected - require login)
router.use("/bookings", bookingRoutes);

// 4. Admin Routes (Protected - require Admin role)
router.use("/admin", authenticate, isAdmin, adminRoutes);

router.post("/payment/create-intent", createPaymentIntent);
export default router;
