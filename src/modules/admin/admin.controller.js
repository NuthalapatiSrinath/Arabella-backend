// src/modules/admin/admin.controller.js
import User from "../../database/models/user/user.model.js";
import Room from "../../database/models/room.model.js";
import Booking from "../../database/models/booking.model.js";

// --- Dashboard Stats ---
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Calculate total revenue from "confirmed" bookings
    const revenueData = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: { totalUsers, totalRooms, totalBookings, totalRevenue },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Room Management (Admin Only) ---
export const createRoom = async (req, res) => {
  try {
    // 1. Extract Image URLs from Cloudinary response (req.files)
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => file.path);
    }

    // 2. Prepare Room Data
    // Form-data sends numbers/arrays as strings, so we parse them manually
    const roomData = {
      ...req.body,
      pricePerNight: Number(req.body.pricePerNight),
      maxGuests: Number(req.body.maxGuests),
      images: imageUrls, // Save the Cloudinary URLs
    };

    // 3. Handle Amenities (split string into array if needed)
    if (typeof roomData.amenities === "string") {
      roomData.amenities = roomData.amenities
        .split(",")
        .map((item) => item.trim());
    }

    const room = await Room.create(roomData);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // 1. Handle New Image Uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      // Logic: If new files are uploaded, we replace the images array (or you could append using $push logic)
      updateData.images = newImages;
    }

    // 2. Parse Numbers if present
    if (updateData.pricePerNight)
      updateData.pricePerNight = Number(updateData.pricePerNight);
    if (updateData.maxGuests)
      updateData.maxGuests = Number(updateData.maxGuests);

    // 3. Parse Amenities if present as string
    if (typeof updateData.amenities === "string") {
      updateData.amenities = updateData.amenities
        .split(",")
        .map((item) => item.trim());
    }

    const room = await Room.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!room) return res.status(404).json({ message: "Room not found" });
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Booking Management (Admin Only) ---
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("room", "name pricePerNight")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, paymentStatus },
      { new: true }
    );
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- User Management ---
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
