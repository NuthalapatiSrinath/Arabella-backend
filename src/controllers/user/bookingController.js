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

// ==========================================
// 1. INITIATE BOOKING (Calculate Price)
// ==========================================
export const initiateBooking = async (req, res) => {
  try {
    const {
      roomTypeId,
      ratePlanId,
      checkIn,
      checkOut,
      adults,
      children,
      selectedAmenities, // Array of names e.g. ["Candle Light Dinner"]
    } = req.body;

    const room = await RoomType.findById(roomTypeId);
    const rate = await RatePlan.findById(ratePlanId);

    if (!room || !rate)
      return res.status(404).json({ message: "Invalid Room or Rate" });

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

    if (nights < 1) return res.status(400).json({ message: "Invalid dates" });

    // --- A. APPLY ROOM DISCOUNT (Flash Sale) ---
    const roomDiscountPercent = room.discountPercentage || 0;
    const effectiveBasePrice = room.basePrice * (1 - roomDiscountPercent / 100);

    // --- B. CALCULATE BASE NIGHTLY RATE ---
    let nightlyPrice =
      effectiveBasePrice * rate.priceMultiplier + rate.flatPremium;

    // --- C. ADD EXTRA GUEST CHARGES ---
    const numAdults = Number(adults);
    const numChildren = Number(children);

    if (numAdults > room.baseCapacity) {
      nightlyPrice +=
        (numAdults - room.baseCapacity) * (rate.extraAdultCharge || 0);
    }
    if (numChildren > 0) {
      nightlyPrice += numChildren * (rate.extraChildCharge || 0);
    }

    // --- D. CALCULATE AMENITIES COST (Per Night) ---
    let amenitiesCostPerNight = 0;
    if (
      selectedAmenities &&
      Array.isArray(selectedAmenities) &&
      room.amenities
    ) {
      const selectedAddons = room.amenities.filter((a) =>
        selectedAmenities.includes(a.name)
      );
      selectedAddons.forEach((addon) => {
        amenitiesCostPerNight += addon.price || 0;
      });
    }

    // --- E. TOTALS ---
    // Formula: (RoomRate + Amenities) * Nights
    const totalNightlyRate = nightlyPrice + amenitiesCostPerNight;
    const roomPriceTotal = Math.round(totalNightlyRate * nights);
    const cityTax = 150 * nights; // Example Fixed Tax
    const finalTotal = roomPriceTotal + cityTax;

    // --- F. CALCULATE SAVINGS ("You Saved") ---
    // Compare against Original Price (No Discount)
    let originalBase = room.basePrice + rate.flatPremium;
    if (numAdults > room.baseCapacity)
      originalBase +=
        (numAdults - room.baseCapacity) * (rate.extraAdultCharge || 0);
    if (numChildren > 0)
      originalBase += numChildren * (rate.extraChildCharge || 0);

    // Add amenities to original price too for fair comparison
    const originalTotal =
      (originalBase + amenitiesCostPerNight) * nights + cityTax;
    const discountAmount = Math.max(0, originalTotal - finalTotal);

    // --- G. CREATE RAZORPAY ORDER ---
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
        baseRatePerNight: Math.round(nightlyPrice),
        amenitiesCost: Math.round(amenitiesCostPerNight * nights),
        subTotal: Math.round(originalTotal), // Original Price (Strike-through)
        discountAmount: Math.round(discountAmount), // Savings
        roomPriceTotal,
        cityTax,
        finalTotal,
      },
    });
  } catch (err) {
    console.error("Initiate Booking Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 2. CONFIRM BOOKING (Save Data)
// ==========================================
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

    // 1. Signature Verification
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    /* // Uncomment for Production
    if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
    }
    */

    // 2. Save Booking
    const newBooking = await Booking.create({
      guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
      email: guestDetails.email,
      phone: guestDetails.phone,
      address: guestDetails.address,

      user: req.user ? req.user.sub : null,
      roomType: bookingDetails.roomTypeId,
      ratePlan: bookingDetails.ratePlanId,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      nights: bookingDetails.nights,
      adults: bookingDetails.adults,
      children: bookingDetails.children,

      invoiceNumber: generateInvoiceId(),

      // Financials
      baseRatePerNight: financials.baseRatePerNight,
      subTotal: financials.subTotal,
      discountAmount: financials.discountAmount,
      roomPriceTotal: financials.roomPriceTotal,
      cityTax: financials.cityTax,
      totalPrice: financials.finalTotal,

      paymentStatus: "Paid",
      razorpayOrderId,
      razorpayPaymentId,
      status: "Confirmed",
    });

    res.status(201).json({ success: true, booking: newBooking });
  } catch (err) {
    console.error("Confirm Booking Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 3. GET INVOICE
// ==========================================
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
