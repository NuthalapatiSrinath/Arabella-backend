import Booking from "../../database/models/booking.model.js";
import Room from "../../database/models/room.model.js";

// Create a new Booking
export const createBooking = async (req, res) => {
  try {
    const userId = req.user.sub; // From auth middleware
    const { roomId, checkIn, checkOut } = req.body;

    // 1. Validate dates
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) {
      return res
        .status(400)
        .json({ success: false, message: "Check-out must be after check-in" });
    }

    // 2. Calculate number of nights
    const diffTime = Math.abs(end - start);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 3. Get Room details for price
    const room = await Room.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // 4. Create Booking
    const booking = await Booking.create({
      user: userId,
      room: roomId,
      checkInDate: start,
      checkOutDate: end,
      totalPrice: room.pricePerNight * nights,
      status: "confirmed",
      paymentStatus: "unpaid",
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create booking" });
  }
};

// Get bookings for the logged-in user
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.sub;

    // Find bookings and populate Room details (so they see "Queen Room", not just an ID)
    const bookings = await Booking.find({ user: userId })
      .populate("room", "name description images")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
