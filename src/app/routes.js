import express from "express";
import userRoomRoutes from "../routes/user/room.routes.js";
import userBookingRoutes from "../routes/user/booking.routes.js";
import adminRoomRoutes from "../routes/admin/roomManage.routes.js";
import adminBookingRoutes from "../routes/admin/bookingManage.routes.js";
// 1. Import Auth Routes
import adminDashboardRoutes from "../routes/admin/dashboard.routes.js";
import authRoutes from "../routes/user/auth.routes.js";

import { authenticate } from "../middleware/auth.js";
import { isAdmin } from "../middleware/admin.js";

const router = express.Router();

// 2. Use Auth Routes (Login/Register)
router.use("/auth", authRoutes);

// Public User Routes
router.use("/rooms", userRoomRoutes);
router.use("/bookings", userBookingRoutes);

// ADMIN ROUTES
router.use("/admin/rooms", authenticate, isAdmin, adminRoomRoutes);
router.use("/admin/bookings", authenticate, isAdmin, adminBookingRoutes);
// ADD THIS LINE:
router.use("/admin/dashboard", authenticate, isAdmin, adminDashboardRoutes);
export default router;
