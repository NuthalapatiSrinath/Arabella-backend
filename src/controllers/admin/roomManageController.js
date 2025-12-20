import RoomType from "../../database/models/RoomType.js";
import RatePlan from "../../database/models/RatePlan.js";

// --- 1. CREATE ROOM (With Duplicate Check) ---
export const createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    // A. DUPLICATE CHECK
    const existingRoom = await RoomType.findOne({ name });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `Room with name '${name}' already exists!`,
      });
    }

    const imageUrls = req.files ? req.files.map((f) => f.path) : [];

    // B. CREATE ROOM
    const room = await RoomType.create({
      ...req.body,
      images: imageUrls,
      basePrice: Number(req.body.basePrice),
      totalStock: Number(req.body.totalStock),
      baseCapacity: Number(req.body.baseCapacity),
      maxAdults: Number(req.body.maxAdults),
      maxChildren: Number(req.body.maxChildren),
      maxOccupancy: Number(req.body.maxOccupancy),
    });

    // C. AUTO-CREATE RATES
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

    res.status(201).json({
      success: true,
      message: "Room Created Successfully",
      data: room,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 2. UPDATE ROOM (Fully Customizable) ---
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Find the room first
    const room = await RoomType.findById(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // A. HANDLE IMAGES (Append new ones to existing list)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => f.path);
      updateData.images = [...room.images, ...newImages]; // Keep old + Add new
    }

    // B. PARSE NUMBERS (If they are being updated)
    if (updateData.basePrice)
      updateData.basePrice = Number(updateData.basePrice);
    if (updateData.totalStock)
      updateData.totalStock = Number(updateData.totalStock);
    // ... add other number fields if needed

    // C. PERFORM UPDATE
    const updatedRoom = await RoomType.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json({ success: true, message: "Room Updated", data: updatedRoom });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 3. DELETE ROOM (And its Rates) ---
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // A. Delete the Room
    const deletedRoom = await RoomType.findByIdAndDelete(id);
    if (!deletedRoom)
      return res.status(404).json({ message: "Room not found" });

    // B. Cleanup: Delete all RatePlans associated with this room
    await RatePlan.deleteMany({ roomType: id });

    res.json({
      success: true,
      message: "Room and its Rate Plans deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
