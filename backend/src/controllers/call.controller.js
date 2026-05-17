import CallLog from "../models/CallLog.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { getOnlineUsers } from "../lib/socket.js";

export const initiateCall = async (req, res) => {
  try {
    const { callType, type, targetId, callId } = req.body;
    const callerId = req.user._id;

    if (!targetId || targetId === "undefined" || targetId === "null") {
      return res.status(400).json({ message: "Invalid or missing targetId" });
    }
    if (!callId) {
      return res.status(400).json({ message: "Invalid or missing callId" });
    }
    if (!type || !['one-on-one', 'group'].includes(type)) {
      return res.status(400).json({ message: `Invalid type: '${type}'. Must be 'one-on-one' or 'group'` });
    }
    if (callType && !['voice', 'video'].includes(callType)) {
      return res.status(400).json({ message: `Invalid callType: '${callType}'. Must be 'voice' or 'video'` });
    }

    const caller = await User.findById(callerId).select("fullName profilePic");

    let targetName = "";
    if (type === "one-on-one") {
      const target = await User.findById(targetId).select("fullName");
      targetName = target?.fullName || "";
    } else {
      const group = await Group.findById(targetId).select("name");
      targetName = group?.name || "";
    }

    const callRecord = await CallLog.findOneAndUpdate(
      { callId },
      {
        $setOnInsert: {
          callerId,
          callerName: caller?.fullName || "",
          callerPic: caller?.profilePic || "",
          callType: callType || "video",
          type,
          targetId,
          targetName,
          callId,
          status: "ringing",
          participants: [callerId],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(callRecord);
  } catch (error) {
    console.error("Error initiating call:", error.message, error.code);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const answerCall = async (req, res) => {
  try {
    const { callId, userId } = req.body;

    let callRecord = await CallLog.findOne({ callId });

    if (!callRecord) {
      try {
        const parts = callId?.split("_") || [];
        const callerId = parts[1] || userId;
        const targetId = parts[2] || userId;

        callRecord = await CallLog.create({
          callId,
          callerId,
          targetId,
          type: "one-on-one",
          callType: "video",
          status: "answered",
          startedAt: new Date(),
          participants: [callerId, userId].filter(Boolean),
        });
      } catch (createErr) {
        callRecord = await CallLog.findOne({ callId });
        if (!callRecord) {
          console.error("Could not create or find call record:", createErr.message);
          return res.status(200).json({ message: "Call record pending", pending: true });
        }
      }
    }

    callRecord.status = "answered";
    callRecord.startedAt = callRecord.startedAt || new Date();
    if (userId && !callRecord.participants.includes(userId)) {
      callRecord.participants.push(userId);
    }

    await callRecord.save();
    res.status(200).json(callRecord);
  } catch (error) {
    console.error("Error answering call:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const endCall = async (req, res) => {
  try {
    const { callId, duration, status } = req.body;

    const callRecord = await CallLog.findOne({ callId });
    if (!callRecord) {
      return res.status(200).json({ message: "No call record to update", callId });
    }

    callRecord.status = status || "ended";
    callRecord.duration = duration || 0;
    callRecord.endedAt = new Date();

    await callRecord.save();
    res.status(200).json(callRecord);
  } catch (error) {
    console.error("Error ending call:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCallHistory = async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user._id;

    const calls = await CallLog.find({
      $or: [
        { callerId: userId, targetId },
        { callerId: targetId, targetId: userId },
        { targetId, type: "group" },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("callerId", "fullName profilePic")
      .populate("participants", "fullName profilePic");

    res.status(200).json(calls);
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const userGroups = await Group.find({ members: userId }).select("_id");
    const groupIds = userGroups.map((g) => g._id);

    const calls = await CallLog.find({
      $or: [
        { callerId: userId },
        { targetId: userId },
        { type: "group", targetId: { $in: groupIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("callerId", "fullName profilePic")
      .populate("participants", "fullName profilePic");

    res.status(200).json(calls);
  } catch (error) {
    console.error("Error fetching global call history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkUserOnline = async (req, res) => {
  try {
    const { userId } = req.params;
    const onlineUsers = getOnlineUsers();
    const isOnline = onlineUsers.has(userId);
    res.status(200).json({ isOnline });
  } catch (error) {
    console.error("Error checking user status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCallLog = async (req, res) => {
  try {
    const { logId } = req.params;
    await CallLog.findByIdAndDelete(logId);
    res.status(200).json({ message: "Call log deleted successfully" });
  } catch (error) {
    console.error("Error deleting call log:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clearCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    await CallLog.deleteMany({
      $or: [{ callerId: userId }, { targetId: userId, type: "one-on-one" }],
    });

    res.status(200).json({ message: "Call history cleared successfully" });
  } catch (error) {
    console.error("Error clearing call history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
