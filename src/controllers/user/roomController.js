import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";
import Booking from "../../database/models/Booking.js";

const calculateNights = (d1, d2) =>
  Math.max(1, Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));

export const searchRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, adults = 1, children = 0 } = req.query;

    if (!checkIn || !checkOut) {
      return res
        .status(400)
        .json({ message: "Check-in and Check-out dates required" });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = calculateNights(start, end);

    // Ensure at least 1 adult
    const numAdults = Math.max(1, Number(adults));
    const numChildren = Number(children);
    const totalGuests = numAdults + numChildren;

    // 1. Find rooms that physically fit the group
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
        // --- 3. PRICING LOGIC (1 Person Base) ---
        const discount = room.discountPercentage || 0;
        const effectiveBasePrice = room.basePrice * (1 - discount / 100);

        const plans = await RatePlan.find({ roomType: room._id });

        const rateOptions = plans.map((plan) => {
          // START: Base Rate covers exactly 1 Adult
          let nightlyRate =
            effectiveBasePrice * plan.priceMultiplier + plan.flatPremium;

          // ADD EXTRA ADULTS: (Total Adults - 1) * Charge
          if (numAdults > 1) {
            nightlyRate += (numAdults - 1) * plan.extraAdultCharge;
          }

          // ADD CHILDREN: All children are charged extra
          if (numChildren > 0) {
            nightlyRate += numChildren * plan.extraChildCharge;
          }

          // SAFETY: Final price cannot be lower than Base Price
          nightlyRate = Math.max(nightlyRate, effectiveBasePrice);

          return {
            _id: plan._id,
            name: plan.name,
            features: {
              breakfast: plan.includesBreakfast,
              refundable: plan.isRefundable,
            },
            discountText:
              discount > 0 ? `Save ${discount}%` : plan.discountText,

            pricePerNight: Math.round(nightlyRate),
            totalPrice: Math.round(nightlyRate * nights),
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
    console.error("Search Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ... keep getRoomById ...

export const getRoomById = async (req, res) => {
  try {
    const room = await RoomType.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const rates = await RatePlan.find({ roomType: req.params.id });
    res.json({ success: true, data: { room, rates } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
