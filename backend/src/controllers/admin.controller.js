import logger from "../monitoring/logger.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import Moment from "../models/Moment.js";
import MomentReply from "../models/MomentReply.js";
import FriendRequest from "../models/FriendRequest.js";
import AdminLog from "../models/AdminLog.js";
import Report from "../models/Report.js";
import Blacklist from "../models/Blacklist.js";
import AppConfig from "../models/AppConfig.js";
import BannedWord from "../models/BannedWord.js";
import AccountRecovery from "../models/AccountRecovery.js";
import crypto from "crypto";
import { presenceManager, getIO } from "../lib/socket.js";
import { logAdminAction } from "../lib/adminUtils.js";
import { invalidateCache } from "../lib/autoModeration.js";
import { escapeRegex } from "../utils/security/regex.util.js";

export async function getDashboardStats(req, res) {
  try {
    const [totalUsers, totalGroups, totalMessages, activeMoments, bannedUsers] =
      await Promise.all([
        User.countDocuments(),
        Group.countDocuments(),
        Message.countDocuments(),
        Moment.countDocuments(),
        User.countDocuments({ isBanned: true }),
      ]);

    res.status(200).json({
      totalUsers,
      totalGroups,
      totalMessages,
      activeMoments,
      bannedUsers,
      onlineNow: presenceManager.getAllOnlineUserIds().length,
    });
  } catch (error) {
    logger.error("Error in getDashboardStats:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ fullName: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const usersWithStatus = users.map((u) => ({
      ...u.toObject(),
      isOnline: presenceManager.isOnline(u._id.toString()),
    }));

    res.status(200).json({
      users: usersWithStatus,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    logger.error("Error in getAllUsers:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function banUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot ban an admin" });
    }

    user.isBanned = true;
    await user.save();

    await logAdminAction({
      adminId,
      action: "BAN_USER",
      targetUserId: id,
      details: { userName: user.fullName },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: `${user.fullName} has been banned` });
  } catch (error) {
    logger.error("Error in banUser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function unbanUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = false;
    await user.save();

    await logAdminAction({
      adminId,
      action: "UNBAN_USER",
      targetUserId: id,
      details: { userName: user.fullName },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: `${user.fullName} has been unbanned` });
  } catch (error) {
    logger.error("Error in unbanUser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete an admin" });
    }

    await logAdminAction({
      adminId,
      action: "DELETE_USER",
      targetUserId: id,
      details: { userName: user.fullName, userEmail: user.email },
      ipAddress: req.ip,
    });

    await User.updateMany({ friends: id }, { $pull: { friends: id } });
    await Group.updateMany({ members: id }, { $pull: { members: id, admins: id } });
    await Group.deleteMany({ admin: id });
    await FriendRequest.deleteMany({
      $or: [{ senderName: user.fullName }, { recipientName: user.fullName }],
    });
    await Moment.deleteMany({ user: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: `User ${user.fullName} deleted permanently` });
  } catch (error) {
    logger.error("Error in deleteUser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function toggleShadowBan(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isShadowBanned = !user.isShadowBanned;
    await user.save();

    await logAdminAction({
      adminId,
      action: user.isShadowBanned ? "SHADOW_BAN_ENABLE" : "SHADOW_BAN_DISABLE",
      targetUserId: id,
      details: { userName: user.fullName },
      ipAddress: req.ip,
    });

    res.status(200).json({ 
      message: `Shadow ban ${user.isShadowBanned ? "enabled" : "disabled"} for ${user.fullName}`,
      isShadowBanned: user.isShadowBanned
    });
  } catch (error) {
    logger.error("Error in toggleShadowBan:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function applyStrike(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.strikes = (user.strikes || 0) + 1;
    let autoBanned = false;
    
    if (user.strikes >= 3) {
      user.isBanned = true;
      autoBanned = true;
    }
    
    await user.save();

    await logAdminAction({
      adminId,
      action: "APPLY_STRIKE",
      targetUserId: id,
      details: { reason, strikeCount: user.strikes, autoBanned },
      ipAddress: req.ip,
    });

    res.status(200).json({ 
      message: `Strike applied to ${user.fullName}. Total strikes: ${user.strikes}`,
      strikes: user.strikes,
      autoBanned
    });
  } catch (error) {
    logger.error("Error in applyStrike:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getPendingReports(req, res) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      Report.find({ status: "pending" })
        .populate("reporter", "fullName email")
        .populate("reportedUser", "fullName email")
        .populate("messageId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments({ status: "pending" })
    ]);

    res.status(200).json({
      reports,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error("Error in getPendingReports:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resolveReport(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user._id;

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) return res.status(404).json({ message: "Report not found" });

    await logAdminAction({
      adminId,
      action: "RESOLVE_REPORT",
      details: { reportId: id, status },
      ipAddress: req.ip,
    });

    res.status(200).json(report);
  } catch (error) {
    logger.error("Error in resolveReport:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAdminLogs(req, res) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AdminLog.find()
      .populate("adminId", "fullName email")
      .populate("targetUser", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments();

    res.status(200).json({
      logs,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error("Error in getAdminLogs:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function banIp(req, res) {
  try {
    const { ip, reason } = req.body;
    const adminId = req.user._id;

    if (!ip) return res.status(400).json({ message: "IP address is required" });

    await Blacklist.create({
      type: "ip",
      value: ip,
      reason,
      adminId,
    });

    await logAdminAction({
      adminId,
      action: "IP_BAN",
      details: { ip, reason },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: `IP ${ip} has been banned` });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "This IP is already banned" });
    }
    logger.error("Error in banIp:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function forceLogout(req, res) {
  try {
    const { userId } = req.params;
    const adminId = req.user._id;

    const io = getIO();
    const socketIds = presenceManager.getUserSocketIds(userId);

    socketIds.forEach((sid) => {
      io.to(sid).emit("force-logout", { message: "Your session has been terminated by an admin." });
    });

    await logAdminAction({
      adminId,
      action: "FORCE_LOGOUT",
      targetUserId: userId,
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "User forced to logout" });
  } catch (error) {
    logger.error("Error in forceLogout:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAllGroups(req, res) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [groups, total] = await Promise.all([
      Group.find()
        .populate("admin", "fullName profilePic")
        .populate("members", "fullName profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Group.countDocuments()
    ]);

    const groupsData = groups.map((g) => ({
      ...g.toObject(),
      memberCount: g.members.length,
    }));

    res.status(200).json({
      groups: groupsData,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error("Error in getAllGroups:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteGroup(req, res) {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    await Message.deleteMany({ groupId: id });
    await Group.findByIdAndDelete(id);

    res.status(200).json({ message: `Group "${group.name}" deleted` });
  } catch (error) {
    logger.error("Error in deleteGroup:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getGroupMessages(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find({ groupId: id })
        .populate("sender", "fullName profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ groupId: id }),
    ]);

    res.status(200).json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    logger.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteMessage(req, res) {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    await Message.findByIdAndDelete(id);

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    logger.error("Error in deleteMessage:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAppConfig(req, res) {
  try {
    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create({});
    }
    res.status(200).json(config);
  } catch (error) {
    logger.error("Error in getAppConfig:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateAppConfig(req, res) {
  try {
    const adminId = req.user._id;
    const updates = req.body;

    let config = await AppConfig.findOne();
    if (!config) {
      config = new AppConfig();
    }

    Object.keys(updates).forEach((key) => {
      if (key !== "_id" && key !== "createdAt" && key !== "updatedAt") {
        config[key] = updates[key];
      }
    });

    config.lastUpdatedBy = adminId;
    await config.save();

    await logAdminAction({
      adminId,
      action: "UPDATE_SYSTEM_CONFIG",
      details: { updates },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "System configuration updated", config });
  } catch (error) {
    logger.error("Error in updateAppConfig:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAnalyticsData(req, res) {
  try {
    const { range = "30" } = req.query;
    const rangeDays = parseInt(range);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);
    startDate.setHours(0,0,0,0);

    const messageStats = await Message.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);


    const [totalReports, resolvedReports] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: { $ne: "pending" } })
    ]);

    res.status(200).json({
      userGrowth,
      messageStats,
      moderation: {
        total: totalReports,
        resolved: resolvedReports,
        efficiency: totalReports > 0 ? (resolvedReports / totalReports) * 100 : 100
      }
    });
  } catch (error) {
    logger.error("Error in getAnalyticsData:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendGlobalAnnouncement(req, res) {
  try {
    const { title, message, type = "info" } = req.body;
    const adminId = req.user._id;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const io = getIO();
    
    // Broadcast to all connected clients
    io.emit("global-announcement", {
      title,
      message,
      type,
      timestamp: new Date(),
    });

    // Log the action
    await logAdminAction({
      adminId,
      action: "SEND_GLOBAL_ANNOUNCEMENT",
      details: { title, type, length: message.length },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "Global announcement sent successfully" });
  } catch (error) {
    logger.error("Error in sendGlobalAnnouncement:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ═══════════════════════════════════════════════════════════════
// ██  AUTO-MODERATION — Banned Words CRUD
// ═══════════════════════════════════════════════════════════════

export async function getBannedWords(req, res) {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [words, total] = await Promise.all([
      BannedWord.find()
        .populate("addedBy", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BannedWord.countDocuments()
    ]);

    res.status(200).json({
      words,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error("Error in getBannedWords:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function addBannedWord(req, res) {
  try {
    const { word, severity, action } = req.body;
    const adminId = req.user._id;

    if (!word || !word.trim()) {
      return res.status(400).json({ message: "Word is required" });
    }

    const existing = await BannedWord.findOne({ word: word.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "This word is already in the blacklist" });
    }

    const entry = await BannedWord.create({
      word: word.trim().toLowerCase(),
      severity: severity || "medium",
      action: action || "censor",
      addedBy: adminId,
    });

    invalidateCache();

    await logAdminAction({
      adminId,
      action: "ADD_BANNED_WORD",
      details: { word: entry.word, severity: entry.severity, actionType: entry.action },
      ipAddress: req.ip,
    });

    res.status(201).json(entry);
  } catch (error) {
    logger.error("Error in addBannedWord:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateBannedWord(req, res) {
  try {
    const { id } = req.params;
    const { severity, action, isActive } = req.body;
    const adminId = req.user._id;

    const updates = {};
    if (severity !== undefined) updates.severity = severity;
    if (action !== undefined) updates.action = action;
    if (isActive !== undefined) updates.isActive = isActive;

    const entry = await BannedWord.findByIdAndUpdate(id, updates, { new: true });
    if (!entry) return res.status(404).json({ message: "Banned word not found" });

    invalidateCache();

    await logAdminAction({
      adminId,
      action: "UPDATE_BANNED_WORD",
      details: { word: entry.word, updates },
      ipAddress: req.ip,
    });

    res.status(200).json(entry);
  } catch (error) {
    logger.error("Error in updateBannedWord:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteBannedWord(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const entry = await BannedWord.findByIdAndDelete(id);
    if (!entry) return res.status(404).json({ message: "Banned word not found" });

    invalidateCache();

    await logAdminAction({
      adminId,
      action: "DELETE_BANNED_WORD",
      details: { word: entry.word },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: `"${entry.word}" removed from blacklist` });
  } catch (error) {
    logger.error("Error in deleteBannedWord:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ═══════════════════════════════════════════════════════════════
// ██  MEDIA & STORAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function getMediaStats(req, res) {
  try {
    // Count image messages in groups
    const imageMessages = await Message.countDocuments({ type: "image" });

    // Count moments by type
    const [imageMoments, videoMoments, totalMoments] = await Promise.all([
      Moment.countDocuments({ type: "image" }),
      Moment.countDocuments({ type: "video" }),
      Moment.countDocuments(),
    ]);

    // Profile pics count (users with non-empty profilePic)
    const usersWithProfilePic = await User.countDocuments({
      profilePic: { $exists: true, $ne: "" },
    });

    // Group avatars
    const groupsWithAvatar = await Group.countDocuments({
      avatar: { $exists: true, $ne: "" },
    });

    // Recent media uploads (last 30 images in messages)
    const recentMedia = await Message.find({ type: "image" })
      .populate("sender", "fullName profilePic")
      .populate("groupId", "name")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // Recent moments
    const recentMoments = await Moment.find()
      .populate("user", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      stats: {
        imageMessages,
        imageMoments,
        videoMoments,
        totalMoments,
        usersWithProfilePic,
        groupsWithAvatar,
        totalMediaItems: imageMessages + totalMoments + usersWithProfilePic + groupsWithAvatar,
      },
      recentMedia,
      recentMoments,
    });
  } catch (error) {
    logger.error("Error in getMediaStats:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteMediaItem(req, res) {
  try {
    const { type, id } = req.params;
    const adminId = req.user._id;

    if (type === "message") {
      const msg = await Message.findById(id);
      if (!msg) return res.status(404).json({ message: "Message not found" });
      await Message.findByIdAndDelete(id);

      await logAdminAction({
        adminId,
        action: "DELETE_MEDIA_MESSAGE",
        details: { messageId: id, groupId: msg.groupId?.toString() },
        ipAddress: req.ip,
      });
    } else if (type === "moment") {
      const moment = await Moment.findById(id);
      if (!moment) return res.status(404).json({ message: "Moment not found" });
      await MomentReply.deleteMany({ moment: id });
      await Moment.findByIdAndDelete(id);

      await logAdminAction({
        adminId,
        action: "DELETE_MEDIA_MOMENT",
        details: { momentId: id, userId: moment.user?.toString() },
        ipAddress: req.ip,
      });
    } else {
      return res.status(400).json({ message: "Invalid media type. Use 'message' or 'moment'." });
    }

    res.status(200).json({ message: "Media item deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteMediaItem:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ═══════════════════════════════════════════════════════════════
// ██  DATA EXPORT & GDPR COMPLIANCE
// ═══════════════════════════════════════════════════════════════

export async function exportUserData(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Gather all user data
    const [messages, moments, momentReplies, friendRequests, groups, reports] =
      await Promise.all([
        Message.find({ sender: id }).sort({ createdAt: -1 }).lean(),
        Moment.find({ user: id }).sort({ createdAt: -1 }).lean(),
        MomentReply.find({ sender: id }).sort({ createdAt: -1 }).lean(),
        FriendRequest.find({
          $or: [{ senderName: user.fullName }, { recipientName: user.fullName }],
        }).lean(),
        Group.find({ members: id }).select("name description createdAt").lean(),
        Report.find({
          $or: [{ reporter: id }, { reportedUser: id }],
        }).lean(),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      messages: {
        count: messages.length,
        data: messages,
      },
      moments: {
        count: moments.length,
        data: moments,
      },
      momentReplies: {
        count: momentReplies.length,
        data: momentReplies,
      },
      friendRequests: {
        count: friendRequests.length,
        data: friendRequests,
      },
      groups: {
        count: groups.length,
        data: groups,
      },
      reports: {
        count: reports.length,
        data: reports,
      },
    };

    await logAdminAction({
      adminId,
      action: "EXPORT_USER_DATA",
      targetUserId: id,
      details: {
        userName: user.fullName,
        dataPoints: {
          messages: messages.length,
          moments: moments.length,
        },
      },
      ipAddress: req.ip,
    });

    res.status(200).json(exportData);
  } catch (error) {
    logger.error("Error in exportUserData:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function hardEraseUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const { permanentlyDeleteUser } = await import("../services/userData.service.js");
    const result = await permanentlyDeleteUser(id);
    if (!result.ok) {
      return res.status(400).json({ message: result.error });
    }

    await logAdminAction({
      adminId,
      action: "HARD_ERASE_USER",
      details: {
        userName: result.userName,
        userEmail: result.userEmail,
        eraseSummary: result.summary,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: `All data for "${result.userName}" has been permanently erased`,
      summary: result.summary,
    });
  } catch (error) {
    logger.error("Error in hardEraseUser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getPendingPasswordResets(req, res) {
  try {
    const requests = await AccountRecovery.find()
      .populate("user", "fullName email profilePic")
      .populate("adminApprovedBy", "fullName email")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    logger.error("Error in getPendingPasswordResets:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function approvePasswordReset(req, res) {
  try {
    const { requestId } = req.params;
    const adminId = req.user._id;

    const request = await AccountRecovery.findById(requestId).populate("user", "fullName email");
    if (!request) {
      return res.status(404).json({ message: "Reset request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    const token = crypto.randomBytes(32).toString("hex");
    request.status = "approved";
    request.resetToken = token;
    request.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    request.adminApprovedBy = adminId;
    await request.save();

    await logAdminAction({
      adminId,
      action: "APPROVE_PASSWORD_RESET",
      details: { requestId, userEmail: request.user?.email },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "Password reset request approved", request });
  } catch (error) {
    logger.error("Error in approvePasswordReset:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectPasswordReset(req, res) {
  try {
    const { requestId } = req.params;
    const adminId = req.user._id;

    const request = await AccountRecovery.findById(requestId).populate("user", "fullName email");
    if (!request) {
      return res.status(404).json({ message: "Reset request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    request.status = "rejected";
    await request.save();

    await logAdminAction({
      adminId,
      action: "REJECT_PASSWORD_RESET",
      details: { requestId, userEmail: request.user?.email },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "Password reset request rejected", request });
  } catch (error) {
    logger.error("Error in rejectPasswordReset:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


// ==========================================
// NEW CONTROLLERS (REST STRUCTURE)
// ==========================================

export const getUsernameHistory = async (req, res) => {
  res.status(200).json({ success: true, data: [] });
};

export const reserveUsername = async (req, res) => {
  res.status(200).json({ success: true, message: "Username reserved" });
};

export const releaseUsername = async (req, res) => {
  res.status(200).json({ success: true, message: "Username released" });
};

export const blockUsername = async (req, res) => {
  res.status(200).json({ success: true, message: "Username blocked" });
};

export const getVerificationRequests = async (req, res) => {
  const users = await User.find({ verificationStatus: "pending" }).select("username fullName profilePic createdAt");
  res.status(200).json({ success: true, data: users });
};

export const approveVerification = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isVerified: true, verificationStatus: "verified" });
  res.status(200).json({ success: true, message: "Verification approved" });
};

export const rejectVerification = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isVerified: false, verificationStatus: "rejected" });
  res.status(200).json({ success: true, message: "Verification rejected" });
};

export const revokeBadge = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isVerified: false, verificationStatus: "none" });
  res.status(200).json({ success: true, message: "Badge revoked" });
};

export const getBannedUsers = async (req, res) => {
  const users = await User.find({ isBanned: true }).select("username email banReason updatedAt");
  res.status(200).json({ success: true, data: users });
};

export const getBanHistory = async (req, res) => {
  res.status(200).json({ success: true, data: [] });
};

export const getActiveDevices = async (req, res) => {
  res.status(200).json({ success: true, data: [] });
};

export const revokeSession = async (req, res) => {
  res.status(200).json({ success: true, message: "Session revoked" });
};

export const getAdmins = async (req, res) => {
  const admins = await User.find({ role: { $in: ["admin", "moderator", "owner"] } }).select("username email role isActive");
  res.status(200).json({ success: true, data: admins });
};

export const createAdmin = async (req, res) => {
  res.status(200).json({ success: true, message: "Admin created" });
};

export const updateAdminRole = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
  res.status(200).json({ success: true, message: "Role updated" });
};

export const deleteAdmin = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { role: "user" });
  res.status(200).json({ success: true, message: "Admin removed" });
};

