import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";

// ==========================================
// 1. CREATE ROOM
// ==========================================
export const createRoom = async (req, res) => {
  try {
    const { name, discountPercentage } = req.body;

    const existingRoom = await RoomType.findOne({ name });
    if (existingRoom) {
      return res.status(409).json({ success: false, message: "Room exists!" });
    }

    const imageUrls = req.files ? req.files.map((f) => f.path) : [];

    // --- PARSE AMENITIES (JSON String or Array) ---
    // Postman sends: '[{"name":"Wifi","price":0}, {"name":"Candle Light","price":500}]'
    let amenities = [];
    if (req.body.amenities) {
      try {
        // Check if it's already an object (JSON content-type) or string (FormData)
        amenities =
          typeof req.body.amenities === "string"
            ? JSON.parse(req.body.amenities)
            : req.body.amenities;
      } catch (e) {
        console.error("Amenities Parse Error. Fallback to simple list.");
        // Fallback: If user sent simple comma string "Wifi, AC"
        const simpleList = req.body.amenities.toString().split(",");
        amenities = simpleList.map((s) => ({ name: s.trim(), price: 0 }));
      }
    }

    // Parse Furniture List
    let furniture = req.body.furniture;
    if (typeof furniture === "string")
      furniture = furniture.split(",").map((s) => s.trim());

    // CREATE ROOM
    const room = await RoomType.create({
      ...req.body,
      images: imageUrls,
      amenities: amenities, // Save with prices
      furniture: furniture,

      // Parse Numbers
      basePrice: Number(req.body.basePrice),
      discountPercentage: Number(discountPercentage || 0),
      totalStock: Number(req.body.totalStock),
      size: Number(req.body.size),
      dimensions: req.body.dimensions, // Save "6x6 ft"

      baseCapacity: Number(req.body.baseCapacity),
      regularBedCount: Number(
        req.body.regularBedCount || req.body.baseCapacity
      ),
      maxExtraBeds: Number(req.body.maxExtraBeds || 0),
      minOccupancy: Number(req.body.minOccupancy || 1),
      maxOccupancy: Number(req.body.maxOccupancy),
      maxAdults: Number(req.body.maxAdults),
      maxChildren: Number(req.body.maxChildren),
    });

    // Auto-Create Rate Plans
    await RatePlan.create([
      {
        roomType: room._id,
        name: "Non Refundable",
        priceMultiplier: 0.9,
        extraAdultCharge: 25,
        extraChildCharge: 15,
        isRefundable: false,
        discountText: "Save 10%",
      },
      {
        roomType: room._id,
        name: "Flexible Breakfast",
        priceMultiplier: 1.0,
        flatPremium: 40,
        extraAdultCharge: 35,
        extraChildCharge: 20,
        isRefundable: true,
        includesBreakfast: true,
        discountText: "Free Breakfast",
      },
    ]);

    res
      .status(201)
      .json({ success: true, message: "Room Created", data: room });
  } catch (err) {
    console.error("Create Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 2. UPDATE ROOM
// ==========================================
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    const room = await RoomType.findById(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Append Images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => f.path);
      updateData.images = [...room.images, ...newImages];
    }

    // Parse Numbers
    const numericFields = [
      "basePrice",
      "discountPercentage",
      "totalStock",
      "size",
      "baseCapacity",
      "regularBedCount",
      "maxExtraBeds",
      "minOccupancy",
      "maxOccupancy",
      "maxAdults",
      "maxChildren",
    ];
    numericFields.forEach((field) => {
      if (updateData[field] !== undefined)
        updateData[field] = Number(updateData[field]);
    });

    // Parse Arrays
    if (updateData.amenities) {
      try {
        updateData.amenities =
          typeof updateData.amenities === "string"
            ? JSON.parse(updateData.amenities)
            : updateData.amenities;
      } catch (e) {
        // Fallback
        updateData.amenities = updateData.amenities
          .toString()
          .split(",")
          .map((s) => ({ name: s.trim(), price: 0 }));
      }
    }

    if (typeof updateData.furniture === "string") {
      updateData.furniture = updateData.furniture
        .split(",")
        .map((s) => s.trim());
    }

    const updatedRoom = await RoomType.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.json({ success: true, message: "Room Updated", data: updatedRoom });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ... deleteRoom same as before
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRoom = await RoomType.findByIdAndDelete(id);
    if (!deletedRoom)
      return res.status(404).json({ message: "Room not found" });
    await RatePlan.deleteMany({ roomType: id });
    res.json({ success: true, message: "Room Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
