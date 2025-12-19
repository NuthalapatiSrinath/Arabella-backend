import Booking from "../../database/models/Booking.js";
import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const generateInvoiceId = () =>
  `ARA-${Math.floor(10000 + Math.random() * 90000)}X`;

// STEP 1: INITIATE (Create Razorpay Order)
export const initiateBooking = async (req, res) => {
  try {
    const { roomTypeId, ratePlanId, checkIn, checkOut, adults, children } =
      req.body;

    const room = await RoomType.findById(roomTypeId);
    const rate = await RatePlan.findById(ratePlanId);

    if (!room || !rate)
      return res.status(404).json({ message: "Invalid Room/Rate" });

    // --- Calculate Nights ---
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

    // --- Calculate Price ---
    let nightlyPrice = room.basePrice * rate.priceMultiplier + rate.flatPremium;

    // Extra Guest Logic
    const totalGuests = Number(adults) + Number(children);
    if (totalGuests > room.baseCapacity) {
      nightlyPrice += (totalGuests - room.baseCapacity) * 20;
    }

    const roomTotal = Math.round(nightlyPrice * nights);
    const cityTax = 25;
    const finalTotal = roomTotal + cityTax;

    // --- Create Razorpay Order ---
    const options = {
      amount: finalTotal * 100, // Amount in smallest currency unit (paise/cents)
      currency: "INR", // Use "INR" for India, or "EUR" if your Razorpay account supports it
      receipt: `receipt_${Date.now()}`,
      notes: {
        roomName: room.name,
        checkIn: checkIn,
        checkOut: checkOut,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: finalTotal,
      currency: options.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Send key to frontend
      breakdown: {
        roomTotal,
        cityTax,
        finalTotal,
      },
    });
  } catch (err) {
    console.error("Initiate Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// STEP 2: CONFIRM (Verify Signature & Save)
export const confirmBooking = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      guestDetails,
      bookingDetails,
      financials,
    } = req.body;

    // 1. Verify Signature (Security Check)
    const body = razorpayOrderId + "|" + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Payment Signature" });
    }

    // 2. Save to DB
    const newBooking = await Booking.create({
      guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
      email: guestDetails.email,
      phone: guestDetails.phone,
      address: guestDetails.address,

      roomType: bookingDetails.roomTypeId,
      ratePlan: bookingDetails.ratePlanId,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      adults: bookingDetails.adults,
      children: bookingDetails.children,

      invoiceNumber: generateInvoiceId(),
      roomPriceTotal: financials.roomTotal,
      cityTax: financials.cityTax,
      totalPrice: financials.finalTotal,

      paymentStatus: "Paid",
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
    });

    res.status(201).json({ success: true, booking: newBooking });
  } catch (err) {
    console.error("Confirm Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
