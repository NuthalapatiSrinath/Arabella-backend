// src/middleware/upload.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { config } from "../config/index.js";

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// 2. Configure Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "arabella_rooms", // Folder name in your Cloudinary Dashboard
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, height: 600, crop: "limit" }], // Optional: Resize
  },
});

// 3. Export Multer
export const upload = multer({ storage: storage });
