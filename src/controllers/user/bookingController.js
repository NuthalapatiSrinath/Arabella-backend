import Booking from "../../database/models/Booking.js";
import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const generateInvoiceId = () =>
  `ARA-${Math.floor(100000 + Math.random() * 900000)}`;

// 1. INITIATE (Calculate Discount & Create Order)
export const initiateBooking = async (req, res) => {
  try {
    const { roomTypeId, ratePlanId, checkIn, checkOut, adults, children } =
      req.body;

    const room = await RoomType.findById(roomTypeId);
    const rate = await RatePlan.findById(ratePlanId);

    if (!room || !rate)
      return res.status(404).json({ message: "Invalid Room/Rate" });

    // --- Date Logic ---
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

    // ==========================================
    // 💰 DISCOUNT SECTION (Auto-Discount Logic)
    // ==========================================

    // 1. Base Price (Before any offer)
    let originalNightlyPrice = room.basePrice + rate.flatPremium;

    // 2. Extra Guest Charge
    const totalGuests = Number(adults) + Number(children);
    if (totalGuests > room.baseCapacity) {
      originalNightlyPrice += (totalGuests - room.baseCapacity) * 500; // ₹500 per extra person
    }

    // 3. Calculate Totals
    const subTotal = originalNightlyPrice * nights; // Price before discount

    // 4. Apply Discount (Multiplier < 1 means discount)
    // Example: If priceMultiplier is 0.9, discount is 10%
    const discountedNightlyPrice = Math.round(
      originalNightlyPrice * rate.priceMultiplier
    );
    const roomPriceTotal = discountedNightlyPrice * nights;

    const discountAmount = subTotal - roomPriceTotal; // The "You Saved" amount

    const cityTax = 150 * nights; // Example: Fixed tax
    const finalTotal = roomPriceTotal + cityTax;

    // --- Razorpay Order ---
    const options = {
      amount: finalTotal * 100, // Paise
      currency: "INR",
      receipt: `rec_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: finalTotal,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      breakdown: {
        baseRatePerNight: originalNightlyPrice,
        subTotal,
        discountAmount, // Show this on frontend "You Save ₹XXX"
        roomPriceTotal,
        cityTax,
        finalTotal,
      },
    });
  } catch (err) {
    console.error("Initiate Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 2. CONFIRM (Verify UPI/Card & Save Invoice)
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

    // Signature Check (Security)
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // Uncomment this for Production Security
    /*
    if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
    }
    */

    const newBooking = await Booking.create({
      guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
      email: guestDetails.email,
      phone: guestDetails.phone,
      address: guestDetails.address,

      user: req.user ? req.user.sub : null, // Link if logged in
      roomType: bookingDetails.roomTypeId,
      ratePlan: bookingDetails.ratePlanId,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      nights: bookingDetails.nights, // Make sure to send this from frontend
      adults: bookingDetails.adults,
      children: bookingDetails.children,

      invoiceNumber: generateInvoiceId(),

      // Save all financial details
      baseRatePerNight: financials.baseRatePerNight,
      subTotal: financials.subTotal,
      discountAmount: financials.discountAmount,
      roomPriceTotal: financials.roomPriceTotal,
      cityTax: financials.cityTax,
      totalPrice: financials.finalTotal,

      paymentStatus: "Paid",
      razorpayOrderId,
      razorpayPaymentId,
    });

    res.status(201).json({ success: true, booking: newBooking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// 3. GET INVOICE (New)
export const getBookingInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("roomType", "name")
      .populate("ratePlan", "name");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json({ success: true, invoice: booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
