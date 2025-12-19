import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  }, // e.g. "Deluxe Queen Room"

  description: {
    type: String,
    required: true,
  },

  pricePerNight: {
    type: Number,
    required: true,
  },

  maxGuests: {
    type: Number,
    required: true,
  }, // e.g. 2

  amenities: [
    {
      type: String,
    },
  ], // e.g. ["Wifi", "AC", "Microwave"]

  images: [
    {
      type: String,
    },
  ], // Array of image URLs

  totalStock: {
    type: Number,
    default: 1,
  }, // Total number of physical rooms of this type

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Room", roomSchema);
