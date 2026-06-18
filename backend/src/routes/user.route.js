import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  searchUsers,
  updateProfile,
  blockUser,
  unblockUser,
  updateSettings,
  getBlockedUsers,
} from "../controllers/user.controller.js";
import {
  exportMyData,
  getMyDeletionRequest,
  submitDeletionRequest,
  cancelDeletionRequest,
} from "../controllers/accountDeletion.controller.js";
import { validate } from "../middleware/security/validate.middleware.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";
import { updateProfileSchema, userIdParam } from "../validators/user.validators.js";
import { searchQuery } from "../validators/common.validators.js";
import {
  submitDeletionRequestSchema,
} from "../validators/accountDeletion.validators.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.get("/search", validate(searchQuery), asyncHandler(searchUsers));

router.put("/profile", validate(updateProfileSchema), asyncHandler(updateProfile));
router.put("/settings", updateSettings);

router.get("/blocked", getBlockedUsers);
router.post("/block/:id", validate(userIdParam), asyncHandler(blockUser));
router.post("/unblock/:id", validate(userIdParam), asyncHandler(unblockUser));

router.post("/friend-request/:id", validate(userIdParam), asyncHandler(sendFriendRequest));
router.put("/friend-request/:id/accept", validate(userIdParam), asyncHandler(acceptFriendRequest));
router.put("/friend-request/:id/reject", validate(userIdParam), asyncHandler(rejectFriendRequest));
router.delete("/friends/:id", validate(userIdParam), asyncHandler(removeFriend));

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

router.get("/me/data-export", asyncHandler(exportMyData));
router.get("/me/deletion-request", asyncHandler(getMyDeletionRequest));
router.post(
  "/me/deletion-request",
  validate(submitDeletionRequestSchema),
  asyncHandler(submitDeletionRequest)
);
router.delete("/me/deletion-request", asyncHandler(cancelDeletionRequest));

export default router;
