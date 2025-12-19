import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";

// Create Room & Auto-generate Rates
export const createRoom = async (req, res) => {
  try {
    const imageUrls = req.files ? req.files.map((f) => f.path) : [];

    // Create Room
    const room = await RoomType.create({
      ...req.body,
      images: imageUrls,
      // Ensure numbers are parsed
      basePrice: Number(req.body.basePrice),
      totalStock: Number(req.body.totalStock),
      baseCapacity: Number(req.body.baseCapacity),
      maxAdults: Number(req.body.maxAdults),
      maxChildren: Number(req.body.maxChildren),
      maxOccupancy: Number(req.body.maxOccupancy),
    });

    // Create Default Plans
    await RatePlan.create([
      {
        roomType: room._id,
        name: "Non Refundable - Pay Now",
        priceMultiplier: 0.9,
        isRefundable: false,
      },
      {
        roomType: room._id,
        name: "Breakfast Included",
        priceMultiplier: 1.0,
        flatPremium: 30,
        includesBreakfast: true,
      },
    ]);

    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateRoom = async (req, res) => {
  // Standard Update Logic here...
};
