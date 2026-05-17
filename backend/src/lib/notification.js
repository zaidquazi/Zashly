import Notification from "../models/Notification.js";
import { getOnlineUsers, getIO } from "./socket.js";

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

    // 3. Emit via Socket.io
    const io = getIO();
    const recipientSocketId = getOnlineUsers().get(recipient.toString());
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new-notification", populated);
    }

    return populated;
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }
}
