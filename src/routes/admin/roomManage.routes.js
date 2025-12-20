import express from "express";
import { upload } from "../../middleware/upload.js";
import {
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../controllers/admin/roomManageController.js";

const router = express.Router();

// CREATE (Checks duplicates)
router.post("/", upload.array("images", 5), createRoom);

// UPDATE (Updates fields & Adds images)
router.put("/:id", upload.array("images", 5), updateRoom);

// DELETE (Removes room & rates)
router.delete("/:id", deleteRoom);

export default router;
