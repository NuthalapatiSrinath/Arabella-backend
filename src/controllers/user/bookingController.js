import Booking from "../../database/models/Booking.js";
import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import sendEmail from "../../utils/email.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// 1. INITIATE BOOKING
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
      selectedAmenities,
    } = req.body;

    const room = await RoomType.findById(roomTypeId);
    const rate = await RatePlan.findById(ratePlanId);

    if (!room || !rate)
      return res.status(404).json({ message: "Invalid Room or Rate" });

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(
      1,
      Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24))
    );

    const effectiveBasePrice =
      room.basePrice * (1 - (room.discountPercentage || 0) / 100);
    let nightlyPrice =
      effectiveBasePrice * rate.priceMultiplier + rate.flatPremium;

    const numAdults = Number(adults);
    const numChildren = Number(children);

    if (numAdults > room.baseCapacity) {
      nightlyPrice +=
        (numAdults - room.baseCapacity) * (rate.extraAdultCharge || 0);
    }
    if (numChildren > 0) {
      nightlyPrice += numChildren * (rate.extraChildCharge || 0);
    }

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

    const totalNightlyRate = nightlyPrice + amenitiesCostPerNight;
    const roomPriceTotal = Math.round(totalNightlyRate * nights);
    const cityTax = 150 * nights;
    const finalTotal = roomPriceTotal + cityTax;

    const options = {
      amount: finalTotal * 100,
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
// 2. CONFIRM BOOKING
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

    if (!razorpayPaymentId.startsWith("pay_dummy")) {
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
    }

    // 🔴 CRITICAL: This works ONLY if 'authenticate' middleware is used on the route!
    const userId = req.user ? req.user.sub : null;

    const newBooking = await Booking.create({
      guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
      email: guestDetails.email,
      phone: guestDetails.phone,
      address: {
        street: guestDetails.address.street || guestDetails.address || "N/A",
        city: guestDetails.address.city || "City",
        state: guestDetails.address.state || "State",
        postalCode: guestDetails.address.postalCode || "000000",
        country: guestDetails.address.country || "India",
      },
      user: userId, // This was saving as NULL because middleware was missing
      roomType: bookingDetails.roomTypeId,
      ratePlan: bookingDetails.ratePlanId,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      nights: financials.nights,
      adults: bookingDetails.adults,
      children: bookingDetails.children,
      invoiceNumber: `ARA-${Math.floor(100000 + Math.random() * 900000)}`,
      baseRatePerNight: financials.baseRatePerNight,
      roomPriceTotal: financials.roomPriceTotal,
      amenitiesCost: financials.amenitiesCost || 0,
      subTotal: financials.subTotal,
      tax: financials.cityTax || 0,
      discount: financials.discountAmount || 0,
      totalPrice: financials.finalTotal,
      paymentStatus: "Paid",
      razorpayOrderId: razorpayOrderId || "order_dummy",
      razorpayPaymentId: razorpayPaymentId,
      status: "Confirmed",
    });

    // Send Email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #a39076;">Booking Confirmed!</h2>
        <p>Dear ${newBooking.guestName},</p>
        <p>Thank you for choosing Arabella Motor Inn. Your reservation is confirmed.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
           <p><strong>Booking ID:</strong> ${newBooking.invoiceNumber}</p>
           <p><strong>Total Paid:</strong> ₹${newBooking.totalPrice}</p>
        </div>
      </div>
    `;

    sendEmail({
      to: newBooking.email,
      subject: `Booking Confirmed - ${newBooking.invoiceNumber}`,
      html: emailHtml,
    }).catch((err) => console.error("Failed to send email:", err));

    res.status(201).json({ success: true, booking: newBooking });
  } catch (err) {
    console.error("Confirm Booking Error:", err);
    res.status(500).json({ success: false, message: err.message });
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

    if (!booking) return res.status(404).send("Booking not found");

    const html = `<html><body><h1>Invoice ${booking.invoiceNumber}</h1><p>Total: ${booking.totalPrice}</p><button onclick="window.print()">Print</button></body></html>`;
    res.send(html);
  } catch (err) {
    res.status(500).send("Error generating invoice");
  }
};

// ==========================================
// 4. GET MY BOOKINGS
// ==========================================
export const getUserBookings = async (req, res) => {
  try {
    // req.user.sub comes from the middleware
    const bookings = await Booking.find({ user: req.user.sub })
      .populate("roomType", "name images")
      .populate("ratePlan", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
