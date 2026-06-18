import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/security/validate.middleware.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";
import {
  createRoom,
  getToken,
  endCall,
  getHistory,
  getCall,
  removeCall,
  removeParticipant,
  getCallConfig,
} from "../controllers/call.controller.js";
import {
  createRoomSchema,
  tokenSchema,
  endCallSchema,
  callIdParam,
  historyQuery,
  removeParticipantSchema,
} from "../validators/call.validators.js";

const router = express.Router();

router.get("/config", protectRoute, asyncHandler(getCallConfig));
router.post("/create-room", protectRoute, validate(createRoomSchema), asyncHandler(createRoom));
router.post("/token", protectRoute, validate(tokenSchema), asyncHandler(getToken));
router.post("/end", protectRoute, validate(endCallSchema), asyncHandler(endCall));
router.get("/history", protectRoute, validate(historyQuery), asyncHandler(getHistory));
router.get("/:id", protectRoute, validate(callIdParam), asyncHandler(getCall));
router.delete("/:id", protectRoute, validate(callIdParam), asyncHandler(removeCall));
router.post("/remove-participant", protectRoute, validate(removeParticipantSchema), asyncHandler(removeParticipant));

export default router;
