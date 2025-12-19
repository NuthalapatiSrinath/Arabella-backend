import Room from "../../database/models/room.model.js";

// We don't need Stripe for the demo anymore
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { roomId, nights } = req.body;

    // 1. Fetch Room (Keep this to ensure room exists)
    const room = await Room.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // 2. DEMO MODE: Skip Stripe entirely
    // We return a fake client secret so the frontend thinks it worked
    console.log(
      `💰 DEMO MODE: Mocking payment for ${nights} nights at ${room.name}`
    );

    // Simulate a short delay like a real server
    await new Promise((resolve) => setTimeout(resolve, 500));

    res.status(200).json({
      success: true,
      clientSecret: "demo_secret_12345", // Fake secret
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
