import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStreamToken,
  createPoll,
  votePoll,
  getPoll,
  truncateChannel,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);

router.post("/polls", protectRoute, createPoll);
router.post("/polls/:pollId/vote", protectRoute, votePoll);
router.get("/polls/:pollId", protectRoute, getPoll);

router.post("/truncate", protectRoute, truncateChannel);

export default router;
