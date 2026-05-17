import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.put("/mark-all-read", protectRoute, markAllAsRead);
router.put("/:id/read", protectRoute, markAsRead);
router.delete("/:id", protectRoute, deleteNotification);

export default router;
