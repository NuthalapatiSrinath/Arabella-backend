const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Customer Info
    guestName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },

    // Booking Details
    roomType: { type: mongoose.Schema.Types.ObjectId, ref: "RoomType" },
    ratePlan: { type: mongoose.Schema.Types.ObjectId, ref: "RatePlan" }, // Which offer they chose

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    // Guest Breakdown
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 },

    // Payment
    totalPrice: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    stripePaymentIntentId: { type: String },

    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "CheckedIn"],
      default: "Confirmed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
