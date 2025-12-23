import express from "express";
import { upload } from "../../middleware/upload.js";
import {
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../controllers/admin/roomManageController.js";
import { getAllRooms } from "../../controllers/admin/roomManageController.js";
const router = express.Router();

// 1. Create Room (Form-Data: Handles Images + Data)
// matches POST /api/admin/rooms
router.post("/", upload.array("images", 5), createRoom);
router.get("/", getAllRooms); // matches GET /api/admin/rooms

// 2. Update Room (Form-Data: can append images)
// matches PUT /api/admin/rooms/:id
router.put("/:id", upload.array("images", 5), updateRoom);

// 3. Delete Room
// matches DELETE /api/admin/rooms/:id
router.delete("/:id", deleteRoom);

export default router;
