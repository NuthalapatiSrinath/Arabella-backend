const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Deluxe Suite"
    description: { type: String, required: true },
    price: { type: Number, required: true }, // Price per night
    maxGuests: { type: Number, required: true }, // Max capacity
    size: { type: String }, // e.g., "45 mq"
    bedType: { type: String }, // e.g., "King Bed"
    images: [{ type: String }], // Array of image URLs
    amenities: [{ type: String }], // ["Wifi", "TV", "AC"]
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
