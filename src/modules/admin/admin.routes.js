// src/modules/admin/admin.routes.js
import express from "express";
import { upload } from "../../middleware/upload.js"; // Import the Cloudinary upload middleware
import {
  getDashboardStats,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllBookings,
  updateBookingStatus,
  getAllUsers,
} from "./admin.controller.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", getDashboardStats);

// Manage Rooms (CRUD)
// ✅ Apply upload.array('images') to handle file uploads
// 'images' matches the key you use in Postman/Frontend form-data
router.post("/rooms", upload.array("images", 5), createRoom);
router.put("/rooms/:id", upload.array("images", 5), updateRoom);
router.delete("/rooms/:id", deleteRoom);

// Manage Bookings
router.get("/bookings", getAllBookings);
router.patch("/bookings/:id", updateBookingStatus);

// Manage Users
router.get("/users", getAllUsers);

export default router;
