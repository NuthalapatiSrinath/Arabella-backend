import User from "../../database/models/user/user.model.js";
import Booking from "../../database/models/Booking.js";
import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";

// --- 1. INNOVATIVE DASHBOARD STATS ---
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // A. Basic Counts
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalRooms = await RoomType.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // B. Financials (Revenue)
    const revenueAgg = await Booking.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // C. Monthly Revenue (Growth Tracking)
    const monthlyRevenueAgg = await Booking.aggregate([
      {
        $match: { paymentStatus: "Paid", createdAt: { $gte: firstDayOfMonth } },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    // D. Most Popular Room Type
    const popularRoomAgg = await Booking.aggregate([
      { $group: { _id: "$roomType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "roomtypes",
          localField: "_id",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
    ]);
    const popularRoom = popularRoomAgg[0] ? popularRoomAgg[0].room.name : "N/A";

    res.json({
      success: true,
      stats: {
        users: totalUsers,
        rooms: totalRooms,
        bookings: totalBookings,
        totalRevenue,
        monthlyRevenue,
        popularRoom,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 2. DEEP USER ANALYTICS ---
// Gets all users + their booking count + total money spent
export const getAllUsersWithStats = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $match: { role: "user" } }, // Filter only normal users
      {
        $lookup: {
          from: "bookings", // Join with Bookings collection
          localField: "_id",
          foreignField: "user",
          as: "bookings",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          isVerified: 1,
          createdAt: 1,
          bookingCount: { $size: "$bookings" }, // Count bookings
          totalSpent: { $sum: "$bookings.totalPrice" }, // Sum total spent
        },
      },
      { $sort: { totalSpent: -1 } }, // Show highest spenders first (VIPs)
    ]);

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 3. FULL DATA BACKUP (One-Click Download) ---
export const downloadBackup = async (req, res) => {
  try {
    // Fetch EVERYTHING
    const users = await User.find().select("-password"); // Security: Don't export passwords
    const rooms = await RoomType.find();
    const rates = await RatePlan.find();
    const bookings = await Booking.find();

    const fullBackup = {
      timestamp: new Date(),
      system: "Arabella Hotel Backend",
      data: {
        users,
        rooms,
        rates,
        bookings,
      },
    };

    // Send as a downloadable JSON file
    const fileName = `backup_arabella_${Date.now()}.json`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/json");

    res.send(JSON.stringify(fullBackup, null, 2));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
