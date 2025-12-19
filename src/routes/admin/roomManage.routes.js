import express from "express";
import { upload } from "../../middleware/upload.js";
import { createRoom } from "../../controllers/admin/roomManageController.js";
const router = express.Router();

router.post("/", upload.array("images", 5), createRoom);

export default router;
