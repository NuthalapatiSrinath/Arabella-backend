import mongoose from "mongoose";

const ratePlanSchema = new mongoose.Schema({
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoomType",
    required: true,
  },
  name: { type: String, required: true }, // "Non Refundable - Pay Now"

  priceMultiplier: { type: Number, default: 1.0 },
  flatPremium: { type: Number, default: 0 },

  isRefundable: { type: Boolean, default: false },
  includesBreakfast: { type: Boolean, default: false },
  cancellationPolicy: { type: String, default: "Non-refundable" },
});

export default mongoose.model("RatePlan", ratePlanSchema);
