import express from "express";
import {
  initiateBooking,
  confirmBooking,
} from "../../controllers/user/bookingController.js";
const router = express.Router();

router.post("/initiate", initiateBooking); // Step 1: Calculate & Get Secret
router.post("/confirm", confirmBooking); // Step 2: Save Booking

export default router;
