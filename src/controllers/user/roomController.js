import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";
import Booking from "../../database/models/Booking.js";

const calculateNights = (d1, d2) =>
  Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));

export const searchRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, adults = 1, children = 0 } = req.query;
    if (!checkIn || !checkOut)
      return res.status(400).json({ message: "Dates required" });

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = calculateNights(start, end);
    const numAdults = Number(adults);
    const numChildren = Number(children);
    const totalGuests = numAdults + numChildren;

    const suitableRooms = await RoomType.find({
      maxOccupancy: { $gte: totalGuests },
      maxAdults: { $gte: numAdults },
    });

    const availableRooms = [];

    for (let room of suitableRooms) {
      const conflictCount = await Booking.countDocuments({
        roomType: room._id,
        status: { $ne: "Cancelled" },
        $or: [{ checkIn: { $lt: end }, checkOut: { $gt: start } }],
      });

      if (room.totalStock - conflictCount > 0) {
        // --- 1. APPLY ROOM DISCOUNT ---
        // If Base is 500 and Discount is 20%, Effective Base is 400.
        const roomDiscountPercent = room.discountPercentage || 0;
        const effectiveBasePrice =
          room.basePrice * (1 - roomDiscountPercent / 100);

        const plans = await RatePlan.find({ roomType: room._id });

        const rateOptions = plans.map((plan) => {
          // --- 2. CALCULATE FINAL PRICE ---
          // Use effectiveBasePrice instead of room.basePrice
          let nightly =
            effectiveBasePrice * plan.priceMultiplier + plan.flatPremium;

          if (numAdults > room.baseCapacity) {
            nightly += (numAdults - room.baseCapacity) * plan.extraAdultCharge;
          }
          if (numChildren > 0) {
            nightly += numChildren * plan.extraChildCharge;
          }

          return {
            _id: plan._id,
            name: plan.name,
            features: {
              breakfast: plan.includesBreakfast,
              refundable: plan.isRefundable,
            },
            // Show the user they are getting a deal
            discountText:
              roomDiscountPercent > 0
                ? `Special Deal: ${roomDiscountPercent}% OFF applied!`
                : plan.discountText,

            pricePerNight: Math.round(nightly),
            totalPrice: Math.round(nightly * nights),

            // Helpful: Send original price too so frontend can show strike-through (e.g. ~~500~~ 400)
            originalPrice: Math.round(room.basePrice * nights),
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
// ... getRoomById logic (similar update recommended)
export const getRoomById = async (req, res) => {
  try {
    const room = await RoomType.findById(req.params.id);
    const rates = await RatePlan.find({ roomType: req.params.id });
    res.json({ success: true, data: { room, rates } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
