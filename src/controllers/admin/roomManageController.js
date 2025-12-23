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

    // --- PARSE AMENITIES ---
    let amenities = [];
    if (req.body.amenities) {
      try {
        amenities =
          typeof req.body.amenities === "string"
            ? JSON.parse(req.body.amenities)
            : req.body.amenities;
      } catch (e) {
        const simpleList = req.body.amenities.toString().split(",");
        amenities = simpleList.map((s) => ({ name: s.trim(), price: 0 }));
      }
    }

    // Parse Furniture
    let furniture = req.body.furniture;
    if (typeof furniture === "string")
      furniture = furniture.split(",").map((s) => s.trim());

    // --- 🚀 NEW: GET EXTRA CHARGES FROM FORM ---
    // Default to 1000/500 if admin doesn't set them
    const extraAdultPrice = Number(req.body.extraAdultPrice) || 1000;
    const extraChildPrice = Number(req.body.extraChildPrice) || 500;

    // CREATE ROOM
    const room = await RoomType.create({
      ...req.body,
      images: imageUrls,
      amenities: amenities,
      furniture: furniture,

      basePrice: Number(req.body.basePrice),
      discountPercentage: Number(discountPercentage || 0),
      totalStock: Number(req.body.totalStock),
      size: Number(req.body.size),
      dimensions: req.body.dimensions,

      baseCapacity: Number(req.body.baseCapacity),
      regularBedCount: Number(
        req.body.regularBedCount || req.body.baseCapacity
      ),
      maxExtraBeds: Number(req.body.maxExtraBeds || 0),
      minOccupancy: Number(req.body.minOccupancy || 1),
      maxOccupancy: Number(req.body.maxOccupancy),
      maxAdults: Number(req.body.maxAdults),
      maxChildren: Number(req.body.maxChildren),

      // Save these on RoomType too for reference (optional schema update needed if you want to store it here permanently)
      // but for now, we rely on RatePlans.
    });

    // --- AUTO-CREATE RATE PLANS WITH DYNAMIC EXTRA CHARGES ---
    await RatePlan.create([
      {
        roomType: room._id,
        name: "Non Refundable",
        priceMultiplier: 0.9,
        extraAdultCharge: extraAdultPrice, // ✅ Uses Admin Input
        extraChildCharge: extraChildPrice, // ✅ Uses Admin Input
        isRefundable: false,
        discountText: "Save 10%",
      },
      {
        roomType: room._id,
        name: "Flexible Breakfast",
        priceMultiplier: 1.0,
        flatPremium: 40,
        extraAdultCharge: extraAdultPrice, // ✅ Uses Admin Input
        extraChildCharge: extraChildPrice, // ✅ Uses Admin Input
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
      if (updateData[field] !== undefined && updateData[field] !== "") {
        updateData[field] = Number(updateData[field]);
      }
    });

    // Parse Arrays (Amenities/Furniture)
    if (updateData.amenities) {
      try {
        updateData.amenities =
          typeof updateData.amenities === "string"
            ? JSON.parse(updateData.amenities)
            : updateData.amenities;
      } catch (e) {
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

    // 1. Update the RoomType document
    const updatedRoom = await RoomType.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // 2. 🚀 UPDATE ASSOCIATED RATE PLANS (Crucial step!)
    // If extra charges are provided in the update, sync them to RatePlans
    if (req.body.extraAdultPrice || req.body.extraChildPrice) {
      const updateFields = {};
      if (req.body.extraAdultPrice)
        updateFields.extraAdultCharge = Number(req.body.extraAdultPrice);
      if (req.body.extraChildPrice)
        updateFields.extraChildCharge = Number(req.body.extraChildPrice);

      await RatePlan.updateMany({ roomType: id }, { $set: updateFields });
    }

    res.json({
      success: true,
      message: "Room & Pricing Updated",
      data: updatedRoom,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 3. DELETE ROOM
// ==========================================
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

// ==========================================
// 4. GET ALL ROOMS
// ==========================================
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await RoomType.find();
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
