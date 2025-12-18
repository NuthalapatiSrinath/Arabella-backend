import mongoose from "mongoose";
import { config } from "../config/index.js"; 
export const connectDB=async() => {
   await mongoose.connect(config.db.url).then(()=>{console.log("DB connected successfully")}).catch((error)=>{console.log(error)})
}