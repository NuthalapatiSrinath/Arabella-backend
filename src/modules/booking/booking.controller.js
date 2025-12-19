const Booking = require("../models/Booking");

// @desc    Create a new booking
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const {
      roomId,
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      nights,
      totalPrice,
    } = req.body;

    const booking = new Booking({
      roomId,
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      nights,
      totalPrice,
    });

    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
