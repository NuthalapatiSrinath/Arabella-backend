import express from "express";
import { createBooking, getUserBookings } from "./booking.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all booking routes
router.use(authenticate);

router.post("/", createBooking); // POST /api/bookings
router.get("/my-bookings", getUserBookings); // GET /api/bookings/my-bookings

export default router;
