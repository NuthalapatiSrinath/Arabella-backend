import mongoose from "mongoose";

const roomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    images: [{ type: String }],

    // --- Physical Specs ---
    size: { type: Number, required: true }, // Internal Sort (sqm)
    dimensions: { type: String }, // Display format e.g. "6x6 ft"

    bedType: { type: String, default: "Single Bed" },
    bedSize: { type: String },
    furniture: [{ type: String }],

    // --- Capacity ---
    baseCapacity: { type: Number, required: true },
    regularBedCount: { type: Number, default: 2 },
    maxExtraBeds: { type: Number, default: 0 },
    minOccupancy: { type: Number, default: 1 },
    maxOccupancy: { type: Number, required: true },
    maxAdults: { type: Number, required: true },
    maxChildren: { type: Number, required: true },

    // --- AMENITIES & ADD-ONS ---
    // [{ name: "Wifi", price: 0 }, { name: "Candle Light", price: 500 }]
    amenities: [
      {
        name: { type: String, required: true },
        price: { type: Number, default: 0 }, // 0 = Free/Included, >0 = Paid Add-on
      },
    ],

    totalStock: { type: Number, required: true },

    // --- Pricing ---
    basePrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },

    // 🚀 NEW FIELDS (Added for Admin Dynamic Pricing)
    extraAdultPrice: { type: Number, default: 1000 },
    extraChildPrice: { type: Number, default: 500 },
  },
  { timestamps: true }
);

export default mongoose.model("RoomType", roomTypeSchema);
