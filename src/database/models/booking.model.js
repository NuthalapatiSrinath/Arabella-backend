const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    guestName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "Confirmed" }, // Pending, Confirmed, Cancelled
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
