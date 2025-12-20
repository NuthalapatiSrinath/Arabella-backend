import Booking from "../../database/models/Booking.js";
import sendEmail from "../../utils/email.js";
import { sendSMS } from "../../utils/sms.js";

// --- 1. GET ALL BOOKINGS ---
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("roomType", "name") // Get Room Name
      .populate("ratePlan", "name") // Get Rate Name
      .populate("user", "name email") // Get User Details if linked
      .sort({ createdAt: -1 }); // Newest first

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 2. UPDATE BOOKING & STATUS ---
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // Contains status, guestName, checkIn, etc.

    // Find original booking to check for status changes
    const originalBooking = await Booking.findById(id);
    if (!originalBooking)
      return res.status(404).json({ message: "Booking not found" });

    // Perform Update
    const updatedBooking = await Booking.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate("roomType", "name");

    // --- NOTIFICATION LOGIC ---
    // If status changed (e.g., Pending -> Confirmed), send alerts
    if (updates.status && updates.status !== originalBooking.status) {
      const message = `Dear ${
        updatedBooking.guestName
      }, your booking status at Arabella Motor Inn has been updated to: ${updates.status.toUpperCase()}.`;

      // 1. Send Email
      await sendEmail({
        to: updatedBooking.email,
        subject: `Booking Update: ${updates.status}`,
        html: `<p>${message}</p><p>Ref: ${updatedBooking.invoiceNumber}</p>`,
      });

      // 2. Send SMS
      await sendSMS({
        to: updatedBooking.phone,
        body: message,
      });
    }

    res.json({
      success: true,
      message: "Booking updated & notifications sent",
      data: updatedBooking,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 3. DELETE BOOKING ---
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 4. MANUAL NOTIFICATION (Custom Message) ---
export const sendManualNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageType, customMessage } = req.body; // messageType: 'email' or 'sms' or 'both'

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (messageType === "email" || messageType === "both") {
      await sendEmail({
        to: booking.email,
        subject: "Message from Arabella Motor Inn",
        html: `<p>${customMessage}</p>`,
      });
    }

    if (messageType === "sms" || messageType === "both") {
      await sendSMS({
        to: booking.phone,
        body: customMessage,
      });
    }

    res.json({ success: true, message: "Notification sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
