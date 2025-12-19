const mongoose = require("mongoose");

const ratePlanSchema = new mongoose.Schema({
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoomType",
    required: true,
  },
  name: { type: String, required: true }, // e.g., "Non Refundable - Pay Now", "Breakfast Included"

  // Price Modifiers
  priceMultiplier: { type: Number, default: 1.0 }, // 1.0 = Base Price, 1.1 = 10% more
  flatPremium: { type: Number, default: 0 }, // Add $20 fixed amount (e.g., for breakfast)

  // Logic
  isRefundable: { type: Boolean, default: false },
  includesBreakfast: { type: Boolean, default: false },

  // Cancellation Policy Text
  cancellationPolicy: { type: String, default: "Non-refundable" },
});

module.exports = mongoose.model("RatePlan", ratePlanSchema);
