import express from "express";
import { getLandingStats } from "../controllers/public.controller.js";

const router = express.Router();

// Public routes for landing page / unauthenticated visitors
router.get("/stats", getLandingStats);

export default router;
