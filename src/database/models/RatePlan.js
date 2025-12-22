import mongoose from "mongoose";

const ratePlanSchema = new mongoose.Schema({
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoomType",
    required: true,
  },
  name: { type: String, required: true }, // e.g., "Non Refundable"

  // --- PRICE LOGIC ---
  priceMultiplier: { type: Number, default: 1.0 }, // 0.9 = 10% off
  flatPremium: { type: Number, default: 0 }, // +$30 for breakfast

  // New Fields for Dynamic Pricing (MISSING IN YOUR CODE)
  extraAdultCharge: { type: Number, default: 20 }, // Cost per extra adult
  extraChildCharge: { type: Number, default: 10 }, // Cost per extra child

  // --- LOGIC FLAGS ---
  isRefundable: { type: Boolean, default: false },
  includesBreakfast: { type: Boolean, default: false },

  // --- DISPLAY TEXT ---
  cancellationPolicy: { type: String, default: "Non-refundable" },
  discountText: { type: String }, // e.g., "Save 15% with this plan"
});

export default mongoose.model("RatePlan", ratePlanSchema);
