import logger from "../monitoring/logger.js";
import AdminLog from "../models/AdminLog.js";

export async function logAdminAction({ adminId, action, targetUserId, details, ipAddress }) {
  try {
    await AdminLog.create({
      adminId,
      action,
      targetUser: targetUserId,
      details,
      ipAddress,
    });
  } catch (error) {
    logger.error("Failed to log admin action:", error.message);
  }
}
