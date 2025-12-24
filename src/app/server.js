import express from "express";
import cors from "cors";
import { connectDB } from "./../database/index.js";
import { config } from "./../config/index.js";
import routes from "./routes.js";

const app = express();

app.use(
  cors({
    origin: ["https://your-frontend.vercel.app"], // 👈 FIX THIS
    credentials: true,
  })
);

app.use(express.json());

// ✅ DB middleware (IMPORTANT)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Routes
app.use("/api", routes);

// Root check
app.get("/", (req, res) => {
  res.send("Arabella Backend is Running!");
});

// 🚫 NO connectDB() here

// Local only
if (process.env.NODE_ENV !== "production") {
  const port = config?.app?.port ?? 4000;
  app.listen(port, () => {
    console.log(`Service on port ${port}`);
  });
}

export default app;
