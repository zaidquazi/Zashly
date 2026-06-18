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
import { validate } from "../middleware/security/validate.middleware.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";
import {
  groupIdParam,
  groupUserIdParams,
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
} from "../validators/group.validators.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Group CRUD
router.post("/", validate(createGroupSchema), asyncHandler(createGroup));
router.get("/", asyncHandler(getMyGroups));
router.get("/:groupId", validate(groupIdParam), asyncHandler(getGroupById));
router.put("/:groupId", validate(groupIdParam), validate(updateGroupSchema), asyncHandler(updateGroup));

// Member management
router.post("/:groupId/members", validate(groupIdParam), validate(addMembersSchema), asyncHandler(addMembers));
router.delete("/:groupId/members/:userId", validate(groupUserIdParams), asyncHandler(removeMember));

// Admin controls
router.put("/:groupId/admins/:userId", validate(groupUserIdParams), asyncHandler(promoteAdmin));
router.delete("/:groupId/admins/:userId", validate(groupUserIdParams), asyncHandler(demoteAdmin));

// Approval flows
router.post("/:groupId/pending/:userId/approve", validate(groupUserIdParams), asyncHandler(approveMember));
router.delete("/:groupId/pending/:userId", validate(groupUserIdParams), asyncHandler(rejectMember));

export default router;
