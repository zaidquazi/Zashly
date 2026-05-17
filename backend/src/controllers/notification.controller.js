import Notification from "../models/Notification.js";
import Spark from "../models/Spark.js";
import Post from "../models/Post.js";
import SparkComment from "../models/SparkComment.js";

export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate("sender", "fullName profilePic")
      .populate("spark", "videoUrl caption")
      .populate("post", "image content")
      .populate("comment", "content");

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ recipient: userId }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
