import express from "express";
import {
  initiateBooking,
  confirmBooking,
  getBookingInvoice,
} from "../../controllers/user/bookingController.js";
// import { authenticate } from "../../middleware/auth.js"; // Optional: Uncomment to protect

const router = express.Router();

// 1. Calculate Price & Get Payment ID
// matches POST /api/bookings/initiate
router.post("/initiate", initiateBooking);

// 2. Confirm Payment & Save Booking
// matches POST /api/bookings/confirm
router.post("/confirm", confirmBooking);

// 3. Get Invoice Data
// matches GET /api/bookings/:id/invoice
router.get("/:id/invoice", getBookingInvoice);

export default router;
