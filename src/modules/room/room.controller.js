import Room from "../../database/models/room.model.js";
import Booking from "../../database/models/booking.model.js";

// Get all rooms (Public)
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single room details (Public)
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room)
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Check Availability (Public) - The search bar logic
export const checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res
        .status(400)
        .json({ success: false, message: "Dates are required" });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    // 1. Find bookings that overlap with these dates
    const overlappingBookings = await Booking.find({
      status: { $ne: "cancelled" }, // Ignore cancelled bookings
      $or: [
        { checkInDate: { $lt: endDate }, checkOutDate: { $gt: startDate } },
      ],
    });

    // 2. Identify which rooms are fully booked
    // (Simplification: assuming 1 stock per room type. If stock > 1, logic needs counting)
    const bookedRoomIds = overlappingBookings.map((b) => b.room.toString());

    // 3. Find rooms NOT in the booked list and have enough capacity
    const availableRooms = await Room.find({
      _id: { $nin: bookedRoomIds },
      maxGuests: { $gte: guests ? Number(guests) : 1 },
    });

    res.status(200).json({ success: true, data: availableRooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
