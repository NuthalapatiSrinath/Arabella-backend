import express from "express";
import {
  getAllBookings,
  updateBooking,
  deleteBooking,
  sendManualNotification,
} from "../../controllers/admin/bookingManageController.js";

const router = express.Router();

// Get All
router.get("/", getAllBookings);

// Update (Status, Dates, Details) - Auto triggers notifications on status change
router.put("/:id", updateBooking);

// Delete
router.delete("/:id", deleteBooking);

// Send Manual Custom Message
router.post("/:id/notify", sendManualNotification);

export default router;
