import express from "express";
import cors from "cors";
import { connectDB } from "./../database/index.js";
import { config } from "./../config/index.js";
import routes from "./routes.js";

const app = express();

app.use(
  cors({
    origin: true, // ✅ allow all origins dynamically
    credentials: true,
  })
);
app.use(express.json());

// Main Route
app.use("/api", routes);

// Root Route (to check if server is running)
app.get("/", (req, res) => {
  res.send("Arabella Backend is Running!");
});

// Database Connection
connectDB();

// 🚀 Only listen to port if NOT running on Vercel
if (process.env.NODE_ENV !== "production") {
  const port = config?.app?.port ?? 4000;
  app.listen(port, () => {
    console.log(`Service on port ${port}`);
  });
}

export default app;
