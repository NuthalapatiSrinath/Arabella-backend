import mongoose from "mongoose";

const roomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Twin Room"
    description: { type: String },
    images: [{ type: String }],
    size: { type: Number }, // 24

    // Occupancy
    baseCapacity: { type: Number, required: true },
    maxAdults: { type: Number, required: true },
    maxChildren: { type: Number, required: true },
    maxOccupancy: { type: Number, required: true },

    amenities: [{ type: String }],

    totalStock: { type: Number, required: true },
    basePrice: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("RoomType", roomTypeSchema);
