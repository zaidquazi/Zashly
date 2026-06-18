import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createMoment,
  getMoments,
  markViewed,
  deleteMoment,
  getReplies,
  createReply,
} from "../controllers/moment.controller.js";
import { momentUploadLimiter } from "../middleware/security/rateLimit.middleware.js";
import { validate } from "../middleware/security/validate.middleware.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";
import {
  createMomentSchema,
  momentIdParam,
  createReplySchema,
} from "../validators/moment.validators.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", asyncHandler(getMoments));
router.post("/", momentUploadLimiter, validate(createMomentSchema), asyncHandler(createMoment));
router.post("/:id/view", validate(momentIdParam), asyncHandler(markViewed));
router.delete("/:id", validate(momentIdParam), asyncHandler(deleteMoment));
router.get("/:id/replies", validate(momentIdParam), asyncHandler(getReplies));
router.post("/:id/replies", validate(createReplySchema), asyncHandler(createReply));

export default router;
