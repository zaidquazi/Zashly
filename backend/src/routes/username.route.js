import express from "express";
import { checkUsernameAvailability } from "../services/username.service.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";

const router = express.Router();

router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    if (q.length < 3 || q.length > 20 || !/^[a-z0-9_]+$/i.test(q)) {
      return res.status(400).json({ 
        available: false, 
        status: "invalid", 
        message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores" 
      });
    }

    const result = await checkUsernameAvailability(q);
    res.status(200).json(result);
  })
);

export default router;
