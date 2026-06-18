import logger from "../monitoring/logger.js";
import Notification from "../models/Notification.js";
import { getIO, presenceManager } from "./socket.js";

export async function createNotification({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
  spark = null,
}) {
  try {
    // 1. Create in DB
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
      spark,
    });

    // 2. Populate for real-time emit
    const populated = await notification.populate([
      { path: "sender", select: "fullName profilePic" },
      { path: "post", select: "image content" },
      { path: "comment", select: "content" },
      { path: "spark", select: "videoUrl caption" },
    ]);

    // 3. Emit via Socket.io (all user sockets for multi-device)
    const io = getIO();
    const recipientSocketIds = presenceManager.getUserSocketIds(recipient.toString());
    recipientSocketIds.forEach((sid) => {
      io.to(sid).emit("new-notification", populated);
    });

    return populated;
  } catch (error) {
    logger.error("Error creating notification:", error.message);
  }
}
