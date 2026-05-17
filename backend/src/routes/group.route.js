import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  addMembers,
  removeMember,
  promoteAdmin,
  demoteAdmin,
  approveMember,
  rejectMember,
} from "../controllers/group.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Group CRUD
router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/:groupId", getGroupById);
router.put("/:groupId", updateGroup);

// Member management
router.post("/:groupId/members", addMembers);
router.delete("/:groupId/members/:userId", removeMember);

// Admin controls
router.put("/:groupId/admins/:userId", promoteAdmin);
router.delete("/:groupId/admins/:userId", demoteAdmin);

// Approval flows
router.post("/:groupId/pending/:userId/approve", approveMember);
router.delete("/:groupId/pending/:userId", rejectMember);

export default router;
