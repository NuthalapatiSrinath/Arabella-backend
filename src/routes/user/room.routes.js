import express from "express";
import {
  searchRooms,
  getRoomById,
} from "../../controllers/user/roomController.js";
const router = express.Router();

router.get("/search", searchRooms);
router.get("/:id", getRoomById);

export default router;
