import User from "../models/User.js";
import Message from "../models/Message.js";
import CallHistory from "../models/CallHistory.js";
import Group from "../models/Group.js";
import logger from "../monitoring/logger.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";

// Cache object
let cachedStats = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getLandingStats = asyncHandler(async (req, res) => {
  const now = Date.now();

  // Return cached data if within TTL
  if (cachedStats && (now - lastFetchTime < CACHE_TTL_MS)) {
    return res.status(200).json({
      success: true,
      data: cachedStats,
      cached: true
    });
  }

  try {
    // estimatedDocumentCount is O(1) and very fast for large collections
    const [activeUsers, messagesSent, callsCompleted, communities] = await Promise.all([
      User.estimatedDocumentCount(),
      Message.estimatedDocumentCount(),
      CallHistory.estimatedDocumentCount(),
      Group.estimatedDocumentCount()
    ]);

    // Format the result
    cachedStats = {
      activeUsers: activeUsers || 0,
      messagesSent: messagesSent || 0,
      callsCompleted: callsCompleted || 0,
      communities: communities || 0,
    };
    
    lastFetchTime = now;

    res.status(200).json({
      success: true,
      data: cachedStats,
      cached: false
    });
  } catch (error) {
    logger.error("Failed to fetch landing stats", { error: error.message });
    // If DB fails, send fallback data to prevent the landing page from breaking
    res.status(200).json({
      success: true,
      data: cachedStats || {
        activeUsers: 0,
        messagesSent: 0,
        callsCompleted: 0,
        communities: 0,
      },
      cached: false,
      error: "Using fallback data due to DB error"
    });
  }
});
