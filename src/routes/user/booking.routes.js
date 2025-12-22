import express from "express";
import {
  initiateBooking,
  confirmBooking,
  getBookingInvoice,
  getUserBookings, // ✅ Import the new function
} from "../../controllers/user/bookingController.js";
import { authenticate } from "../../middleware/auth.js"; // ✅ Import Auth Middleware

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (No Login Required)
// ==========================================

// POST /api/bookings/initiate
// Used to calculate price and create Razorpay order
router.post("/initiate", initiateBooking);

// POST /api/bookings/confirm
// Used to verify payment and save booking to DB
router.post("/confirm", confirmBooking);

// GET /api/bookings/:id/invoice
// Used to view the HTML Invoice in a new tab
router.get("/:id/invoice", getBookingInvoice);

// ==========================================
// 2. PROTECTED ROUTES (Login Required)
// ==========================================

// GET /api/bookings/
// Used by "My Bookings" page to get list of user's bookings
// ✅ Added 'authenticate' so req.user is populated
router.get("/", authenticate, getUserBookings);

export default router;
