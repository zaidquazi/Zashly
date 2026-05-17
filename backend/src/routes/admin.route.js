import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import {
  getDashboardStats,
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  toggleShadowBan,
  applyStrike,
  getPendingReports,
  resolveReport,
  getAdminLogs,
  banIp,
  forceLogout,
  getAllGroups,
  deleteGroup,
  getGroupMessages,
  deleteMessage,
  getAppConfig,
  updateAppConfig,
  getAnalyticsData,
  sendGlobalAnnouncement,
  getBannedWords,
  addBannedWord,
  updateBannedWord,
  deleteBannedWord,
  getMediaStats,
  deleteMediaItem,
  exportUserData,
  hardEraseUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All routes require authentication + admin role
router.use(protectRoute, requireAdmin);

// Dashboard
router.get("/stats", getDashboardStats);

// Users
router.get("/users", getAllUsers);
router.post("/users/:id/ban", banUser);
router.post("/users/:id/unban", unbanUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/shadow-ban", toggleShadowBan);
router.post("/users/:id/strike", applyStrike);
router.post("/users/:id/logout", forceLogout);

// Moderation
router.get("/reports", getPendingReports);
router.post("/reports/:id/resolve", resolveReport);
router.get("/logs", getAdminLogs);

// Security
router.post("/security/ip-ban", banIp);

// Groups
router.get("/groups", getAllGroups);
router.delete("/groups/:id", deleteGroup);
router.get("/groups/:id/messages", getGroupMessages);

// Messages
router.delete("/messages/:id", deleteMessage);

// System Config
router.get("/config", getAppConfig);
router.patch("/config", updateAppConfig);

// Analytics
router.get("/analytics", getAnalyticsData);

// Announcements
router.post("/announcements", sendGlobalAnnouncement);

// Auto-Moderation — Banned Words
router.get("/banned-words", getBannedWords);
router.post("/banned-words", addBannedWord);
router.patch("/banned-words/:id", updateBannedWord);
router.delete("/banned-words/:id", deleteBannedWord);

// Media & Storage
router.get("/media", getMediaStats);
router.delete("/media/:type/:id", deleteMediaItem);

// Data Export & GDPR
router.get("/users/:id/export", exportUserData);
router.delete("/users/:id/erase", hardEraseUser);

export default router;
