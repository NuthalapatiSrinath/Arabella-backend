import express from "express";
import userRoomRoutes from "../routes/user/room.routes.js";
import userBookingRoutes from "../routes/user/booking.routes.js";
import adminRoomRoutes from "../routes/admin/roomManage.routes.js";
import { authenticate } from "../middleware/auth.js";
import { isAdmin } from "../middleware/admin.js";

const router = express.Router();

// Public User Routes
router.use("/rooms", userRoomRoutes);
router.use("/bookings", userBookingRoutes);

// Protected Admin Routes
router.use("/admin/rooms", authenticate, isAdmin, adminRoomRoutes);

export default router;
