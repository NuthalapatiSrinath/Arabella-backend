import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // --- 1. Customer Details ---
    guestName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    // --- 2. Reservation Details ---
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },
    ratePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RatePlan",
      required: true,
    },

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    adults: { type: Number, required: true },
    children: { type: Number, default: 0 },

    // --- 3. Financials ---
    invoiceNumber: { type: String, unique: true },
    roomPriceTotal: { type: Number, required: true },
    cityTax: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true }, // Final Amount

    // --- 4. Payment & Status ---
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    // RAZORPAY FIELDS
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "CheckedIn"],
      default: "Confirmed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
