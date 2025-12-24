import mongoose from "mongoose";
import { config } from "../config/index.js";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(config.db.url, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        console.log("MongoDB connected");
        return mongoose;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};
