const mongoose = require("mongoose");

const roomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Single Room", "Deluxe Suite"
    description: { type: String },
    images: [{ type: String }], // Array of image URLs
    size: { type: Number }, // e.g., 24 (in sqm)

    // Capacity Logic
    baseCapacity: { type: Number, required: true }, // Price covers up to this many people
    maxAdults: { type: Number, required: true },
    maxChildren: { type: Number, required: true },
    maxOccupancy: { type: Number, required: true }, // Absolute max people allowed

    // Amenities
    amenities: [{ type: String }], // ["Wifi", "AC", "Bidet"]

    // Inventory Management
    totalStock: { type: Number, required: true }, // How many of these rooms exist physically (e.g., 10)

    // Base Price (Fallback)
    basePrice: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomType", roomTypeSchema);
