import express from "express";
import {
  initiateBooking,
  confirmBooking,
  getBookingInvoice,
} from "../../controllers/user/bookingController.js";
import { authenticate } from "../../middleware/auth.js"; // Optional: if you want to protect invoice

const router = express.Router();

router.post("/initiate", initiateBooking);
router.post("/confirm", confirmBooking);
router.get("/:id/invoice", getBookingInvoice); // New Route for Invoice Page

export default router;
