import Moment from "../models/Moment.js";
import User from "../models/User.js";
import MomentReply from "../models/MomentReply.js";

const HOURS_24 = 24 * 60 * 60 * 1000;

export async function getMoments(req, res) {
  try {
    const me = req.user.id;
    const meDoc = await User.findById(me).select("friends");
    const ids = [me, ...(meDoc?.friends || [])];

    const moments = await Moment.find({
      user: { $in: ids },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("user", "fullName profilePic");

    res.json(
      moments.filter(m => m.user != null).map((m) => ({
        id: m._id,
        userId: m.user._id,
        username: m.user.fullName,
        avatar: m.user.profilePic || "",
        url: m.mediaUrl,
        type: m.type,
        duration: m.durationMs,
        createdAt: m.createdAt,
        viewers: m.viewers?.map(String) || [],
      }))
    );
  } catch (e) {
    console.error("getMoments error", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createMoment(req, res) {
  try {
    const { mediaUrl, type, durationMs } = req.body;
    if (!mediaUrl || !type) {
      return res.status(400).json({ message: "mediaUrl and type are required" });
    }
    if (!["image", "video"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    if (mediaUrl.length > 13000000) {
      return res.status(413).json({ message: "File is too large to process. Maximum allowed is ~10MB." });
    }

    const moment = await Moment.create({
      user: req.user.id,
      mediaUrl,
      type,
      durationMs: Math.min(Number(durationMs) || 5000, 50000),
      expiresAt: new Date(Date.now() + HOURS_24),
      viewers: [],
    });

    const populated = await moment.populate("user", "fullName profilePic");
    res.status(201).json({
      id: populated._id,
      userId: populated.user._id,
      username: populated.user.fullName,
      avatar: populated.user.profilePic || "",
      url: populated.mediaUrl,
      type: populated.type,
      duration: populated.durationMs,
      createdAt: populated.createdAt,
      viewers: [],
    });
  } catch (e) {
    console.error("createMoment error", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function markViewed(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await Moment.findByIdAndUpdate(id, { $addToSet: { viewers: userId } });
    res.json({ ok: true });
  } catch (e) {
    console.error("markViewed error", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteMoment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const m = await Moment.findById(id);
    if (!m) return res.status(404).json({ message: "Moment not found" });
    const isOwner = String(m.user) === String(userId);
    const isPrivileged = req.user?.role === "developer" || req.user?.role === "admin";
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Not allowed" });
    }
    await Moment.deleteOne({ _id: id });
    await MomentReply.deleteMany({ moment: id });
    res.json({ ok: true });
  } catch (e) {
    console.error("deleteMoment error", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getReplies(req, res) {
  try {
    const { id } = req.params;
    const replies = await MomentReply.find({ moment: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "fullName profilePic");
    res.json(
      replies.map((r) => ({
        id: r._id,
        text: r.text,
        emoji: r.emoji,
        createdAt: r.createdAt,
        sender: {
          id: r.sender._id,
          name: r.sender.fullName,
          avatar: r.sender.profilePic || "",
        },
      }))
    );
  } catch (e) {
    console.error("getReplies error", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createReply(req, res) {
  try {
    const { id } = req.params;
    const { text = "", emoji = "" } = req.body || {};
    if (!text && !emoji) return res.status(400).json({ message: "text or emoji required" });
    const reply = await MomentReply.create({ moment: id, sender: req.user.id, text, emoji });
    const populated = await reply.populate("sender", "fullName profilePic");
    res.status(201).json({
      id: populated._id,
      text: populated.text,
      emoji: populated.emoji,
      createdAt: populated.createdAt,
      sender: {
        id: populated.sender._id,
        name: populated.sender.fullName,
        avatar: populated.sender.profilePic || "",
      },
    });
  } catch (e) {
    console.error("createReply error", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
