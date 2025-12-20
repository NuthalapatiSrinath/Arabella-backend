import express from "express";
import {
  getDashboardStats,
  getAllUsersWithStats,
  downloadBackup,
} from "../../controllers/admin/dashboardController.js";

const router = express.Router();

// 1. Overview Stats
router.get("/stats", getDashboardStats);

// 2. User Management (With Spending Data)
router.get("/users", getAllUsersWithStats);

// 3. System Backup (Download)
router.get("/backup", downloadBackup);

export default router;
