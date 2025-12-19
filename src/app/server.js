import express from "express";
import cors from "cors";
import { connectDB } from "./../database/index.js";
import routes from "./routes.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/api", routes);

// health check (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("Backend running on Vercel ✅");
});

// ❌ NO app.listen() here

// Connect DB once (safe for Vercel)
connectDB().catch((err) => {
  console.error("DB connection failed:", err);
});

export default app;
