import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireAdmin, requireOwnerOrAdmin, requireOwner } from "../middleware/admin.middleware.js";
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
  getPendingPasswordResets,
  approvePasswordReset,
  rejectPasswordReset,
  
  // NEW CONTROLLERS
  getUsernameHistory,
  reserveUsername,
  releaseUsername,
  blockUsername,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  revokeBadge,
  getBannedUsers,
  getBanHistory,
  getActiveDevices,
  revokeSession,
  getAdmins,
  createAdmin,
  updateAdminRole,
  deleteAdmin
} from "../controllers/admin.controller.js";
import {
  getAccountDeletionRequests,
  approveAccountDeletion,
  rejectAccountDeletion,
} from "../controllers/accountDeletion.controller.js";
import {
  rejectDeletionRequestSchema,
  deletionRequestIdParam,
} from "../validators/accountDeletion.validators.js";
import {
  idParam,
  strikeSchema,
  resolveReportSchema,
  ipBanSchema,
  announcementSchema,
  addBannedWordSchema,
  updateBannedWordSchema,
  updateAdminRoleSchema,
} from "../validators/admin.validators.js";
import { validate } from "../middleware/security/validate.middleware.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";

const router = express.Router();

// All routes require authentication + at least Moderator/Admin role
router.use(protectRoute, requireAdmin);

// Dashboard
router.get("/stats", getDashboardStats);

// Users
router.get("/users", getAllUsers);
router.post("/users/:id/ban", validate(idParam), requireOwnerOrAdmin, banUser);
router.post("/users/:id/unban", validate(idParam), requireOwnerOrAdmin, unbanUser);
router.delete("/users/:id", validate(idParam), requireOwner, deleteUser);
router.post("/users/:id/shadow-ban", validate(idParam), requireOwnerOrAdmin, toggleShadowBan);
router.post("/users/:id/strike", validate(idParam), validate(strikeSchema), applyStrike);
router.post("/users/:id/logout", validate(idParam), forceLogout);

// Username Management
router.get("/usernames", getUsernameHistory);
router.post("/usernames/reserve", requireOwnerOrAdmin, reserveUsername);
router.post("/usernames/release", requireOwnerOrAdmin, releaseUsername);
router.post("/usernames/block", requireOwnerOrAdmin, blockUsername);

// Verification Management
router.get("/verifications", getVerificationRequests);
router.post("/verifications/:id/approve", requireOwnerOrAdmin, approveVerification);
router.post("/verifications/:id/reject", requireOwnerOrAdmin, rejectVerification);
router.post("/verifications/:id/revoke", requireOwnerOrAdmin, revokeBadge);

// Banned Users
router.get("/bans", getBannedUsers);
router.get("/bans/history", getBanHistory);

// Device Management
router.get("/devices", requireOwnerOrAdmin, getActiveDevices);
router.post("/devices/:id/revoke", requireOwnerOrAdmin, revokeSession);

// Admin Management
router.get("/admins", requireOwnerOrAdmin, getAdmins);
router.post("/admins", requireOwner, createAdmin);
router.patch("/admins/:id", validate(idParam), validate(updateAdminRoleSchema), requireOwner, updateAdminRole);
router.delete("/admins/:id", validate(idParam), requireOwner, deleteAdmin);

// Moderation
router.get("/reports", getPendingReports);
router.post("/reports/:id/resolve", validate(idParam), validate(resolveReportSchema), resolveReport);
router.get("/logs", requireOwnerOrAdmin, getAdminLogs);

// Security
router.post("/security/ip-ban", validate(ipBanSchema), requireOwnerOrAdmin, banIp);

// Groups
router.get("/groups", getAllGroups);
router.delete("/groups/:id", requireOwnerOrAdmin, deleteGroup);
router.get("/groups/:id/messages", getGroupMessages);

// Messages
router.delete("/messages/:id", deleteMessage);

// System Config
router.get("/config", getAppConfig);
router.patch("/config", requireOwnerOrAdmin, updateAppConfig);

// Analytics
router.get("/analytics", getAnalyticsData);

// Announcements
router.post("/announcements", validate(announcementSchema), requireOwnerOrAdmin, sendGlobalAnnouncement);

// Auto-Moderation — Banned Words
router.get("/banned-words", getBannedWords);
router.post("/banned-words", validate(addBannedWordSchema), requireOwnerOrAdmin, addBannedWord);
router.patch("/banned-words/:id", validate(idParam), validate(updateBannedWordSchema), requireOwnerOrAdmin, updateBannedWord);
router.delete("/banned-words/:id", validate(idParam), requireOwnerOrAdmin, deleteBannedWord);

// Media & Storage
router.get("/media", getMediaStats);
router.delete("/media/:type/:id", requireOwnerOrAdmin, deleteMediaItem);

// Data Export & GDPR
router.get("/users/:id/export", requireOwnerOrAdmin, exportUserData);
router.delete("/users/:id/erase", requireOwner, hardEraseUser);

// Password Reset Appeals
router.get("/password-resets", getPendingPasswordResets);
router.post("/password-resets/:requestId/approve", requireOwnerOrAdmin, approvePasswordReset);
router.post("/password-resets/:requestId/reject", requireOwnerOrAdmin, rejectPasswordReset);

router.get("/account-deletions", requireOwnerOrAdmin, asyncHandler(getAccountDeletionRequests));
router.post(
  "/account-deletions/:requestId/approve",
  requireOwnerOrAdmin,
  validate(deletionRequestIdParam),
  asyncHandler(approveAccountDeletion)
);
router.post(
  "/account-deletions/:requestId/reject",
  requireOwnerOrAdmin,
  validate(deletionRequestIdParam),
  validate(rejectDeletionRequestSchema),
  asyncHandler(rejectAccountDeletion)
);

export default router;
