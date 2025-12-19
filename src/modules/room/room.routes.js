import express from "express";
import {
  getAllRooms,
  getRoomById,
  checkAvailability,
} from "./room.controller.js";

const router = express.Router();

router.get("/", getAllRooms);
router.get("/search", checkAvailability); // e.g. /api/rooms/search?checkIn=...
router.get("/:id", getRoomById);

export default router;
