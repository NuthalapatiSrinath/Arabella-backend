import express from "express";
import {
  initiateBooking,
  confirmBooking,
  getBookingInvoice,
  getUserBookings,
} from "../../controllers/user/bookingController.js";
import { authenticate } from "../../middleware/auth.js"; //

const router = express.Router();

// 1. Initiate (Public)
router.post("/initiate", initiateBooking);

// 2. Confirm (PROTECTED - MUST HAVE 'authenticate')
// 🔴 CRITICAL FIX: Added 'authenticate' here.
// Without this, req.user is undefined, and booking saves as "Guest" (User: null)
router.post("/confirm", authenticate, confirmBooking);

// 3. Invoice (Public)
router.get("/:id/invoice", getBookingInvoice);

// 4. My Bookings (Protected)
// This was missing in your uploaded file!
router.get("/", authenticate, getUserBookings);

export default router;
