import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  initiateCall,
  answerCall,
  endCall,
  getCallHistory,
  getAllCallHistory,
  checkUserOnline,
  deleteCallLog,
  clearCallHistory,
} from "../controllers/call.controller.js";

const router = express.Router();

router.post("/initiate", protectRoute, initiateCall);
router.post("/answer", protectRoute, answerCall);
router.post("/end", protectRoute, endCall);
router.get("/history", protectRoute, getAllCallHistory);
router.get("/history/:targetId", protectRoute, getCallHistory);
router.delete("/history/clear", protectRoute, clearCallHistory);
router.delete("/:logId", protectRoute, deleteCallLog);
router.get("/check-online/:userId", protectRoute, checkUserOnline);

export default router;
