import Booking from "../../database/models/Booking.js";
import sendEmail from "../../utils/email.js";

// --- HELPER: PROFESSIONAL EMAIL TEMPLATE ---
const getEmailTemplate = (
  guestName,
  status,
  invoiceNumber,
  customMessage = null
) => {
  // Color coding for statuses
  const statusColor =
    status === "Confirmed"
      ? "#059669" // Green
      : status === "Cancelled"
      ? "#dc2626" // Red
      : status === "CheckedIn"
      ? "#2563eb" // Blue
      : "#d97706"; // Yellow (Pending/Default)

  // Determine Main Content (Automatic Status Update vs Custom Message)
  // If customMessage exists, we show that. Otherwise, we show the status badge.
  const mainContent = customMessage
    ? `<p style="font-size: 16px; color: #374151; line-height: 1.6;">${customMessage}</p>`
    : `<p style="font-size: 16px; color: #374151;">Your booking status has been updated to:</p>
       <div style="background-color: ${statusColor}; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px; margin: 10px 0;">
          ${status ? status.toUpperCase() : "UPDATED"}
       </div>`;

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background-color: #111827; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">Arabella Motor Inn</h1>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Hello, ${guestName}</h2>
        
        ${mainContent}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
          <p style="color: #6b7280; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
          <p style="color: #111827; font-size: 20px; font-weight: 700; margin: 5px 0; font-family: monospace;">${invoiceNumber}</p>
        </div>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Arabella Motor Inn. All rights reserved.</p>
        <p style="margin: 5px 0 0;">Need help? Reply directly to this email.</p>
      </div>
    </div>
  `;
};

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

    // --- NOTIFICATION LOGIC (EMAIL ONLY) ---
    // If status changed (e.g., Pending -> Confirmed), send beautiful email
    if (updates.status && updates.status !== originalBooking.status) {
      // Generate Beautiful HTML
      const emailHtml = getEmailTemplate(
        updatedBooking.guestName,
        updates.status,
        updatedBooking.invoiceNumber
      );

      // Send Email
      await sendEmail({
        to: updatedBooking.email,
        subject: `Booking Update: ${updates.status} - Arabella Motor Inn`,
        html: emailHtml,
      });
    }

    res.json({
      success: true,
      message: "Booking updated & email notification sent",
      data: updatedBooking,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 LOGS ADDED TO DELETE CONTROLLER
export const deleteBooking = async (req, res) => {
  console.log(
    "🔥 [BACKEND] deleteBooking Request Received. ID:",
    req.params.id
  );

  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      console.warn("⚠️ [BACKEND] Booking NOT Found in DB:", req.params.id);
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log("✅ [BACKEND] Booking Deleted Successfully:", booking._id);
    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    console.error("❌ [BACKEND] Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
};
// --- 4. MANUAL NOTIFICATION (Custom Message - EMAIL ONLY) ---
export const sendManualNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { customMessage } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Generate Beautiful HTML for Custom Message
    // Note: We pass 'null' for status, so the template uses the customMessage logic
    const emailHtml = getEmailTemplate(
      booking.guestName,
      null,
      booking.invoiceNumber,
      customMessage
    );

    // Send Email
    await sendEmail({
      to: booking.email,
      subject: "Message from Arabella Motor Inn",
      html: emailHtml,
    });

    res.json({
      success: true,
      message: "Email notification sent successfully",
    });
  } catch (err) {
    console.error("Manual Notification Error:", err);
    res.status(500).json({ message: err.message });
  }
};
