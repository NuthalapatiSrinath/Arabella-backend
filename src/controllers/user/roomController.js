import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";
import Booking from "../../database/models/Booking.js";

// Helper
const calculateNights = (d1, d2) =>
  Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));

export const searchRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, adults = 1, children = 0 } = req.query;
    if (!checkIn || !checkOut)
      return res.status(400).json({ message: "Dates required" });

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const totalGuests = Number(adults) + Number(children);
    const nights = calculateNights(start, end);

    // 1. Filter Rooms by Capacity
    const suitableRooms = await RoomType.find({
      maxOccupancy: { $gte: totalGuests },
    });

    const availableRooms = [];

    for (let room of suitableRooms) {
      // 2. Check Availability
      const conflictCount = await Booking.countDocuments({
        roomType: room._id,
        status: { $ne: "Cancelled" },
        $or: [{ checkIn: { $lt: end }, checkOut: { $gt: start } }],
      });

      if (room.totalStock - conflictCount > 0) {
        // 3. Get Rates & Calculate Totals
        const plans = await RatePlan.find({ roomType: room._id });

        const rateOptions = plans.map((plan) => {
          let nightly =
            room.basePrice * plan.priceMultiplier + plan.flatPremium;
          // Add Extra Guest Fee if applicable
          if (totalGuests > room.baseCapacity)
            nightly += (totalGuests - room.baseCapacity) * 20;

          return {
            _id: plan._id,
            name: plan.name,
            features: {
              breakfast: plan.includesBreakfast,
              refundable: plan.isRefundable,
            },
            pricePerNight: Math.round(nightly),
            totalPrice: Math.round(nightly * nights),
          };
        });

        availableRooms.push({
          ...room.toObject(),
          availableCount: room.totalStock - conflictCount,
          rateOptions,
        });
      }
    }

    res.json({ success: true, data: availableRooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const room = await RoomType.findById(req.params.id);
    const rates = await RatePlan.find({ roomType: req.params.id });
    res.json({ success: true, data: { room, rates } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
