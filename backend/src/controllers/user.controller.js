import logger from "../monitoring/logger.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { upsertStreamUser, streamClient } from "../lib/stream.js";
import { presenceManager, getIO } from "../lib/socket.js";
import { sanitizeText, sanitizeUrl } from "../utils/security/sanitize.util.js";
import { escapeRegex } from "../utils/security/regex.util.js";
import {
  validateBase64Upload,
  secureFilename,
  safeUploadPath,
} from "../uploads/security/fileValidator.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullName, bio, location, profilePic } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = sanitizeText(fullName, 100);
    if (bio !== undefined) updateData.bio = sanitizeText(bio, 500);
    if (location !== undefined) updateData.location = sanitizeText(location, 120);
    if (profilePic !== undefined) {
      if (profilePic && profilePic.startsWith("data:")) {
        const validation = validateBase64Upload(profilePic, "image");
        if (!validation.ok) {
          return res.status(400).json({ message: validation.error });
        }
        const uploadRoot = path.join(__dirname, "../../uploads");
        const filename = secureFilename(validation.ext);
        const filepath = safeUploadPath(uploadRoot, filename);

        // Ensure directory exists
        if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

        fs.writeFileSync(filepath, validation.buffer);
        const host = req.protocol + "://" + req.get("host");
        updateData.profilePic = `${host}/uploads/${filename}`;
      } else {
        updateData.profilePic = profilePic ? sanitizeUrl(profilePic) : profilePic;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
    } catch (streamError) { }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error("Error in updateProfile controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const queryFilter = {
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
        { role: { $nin: ["admin", "owner"] } },
      ],
    };

    const recommendedUsers = await User.find(queryFilter).limit(20);
    res.status(200).json(recommendedUsers);
  } catch (error) {
    logger.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage lastSeen privacySettings");

    const friendsWithStatus = user.friends.map((friend) => {
      const friendId = String(friend._id);
      const isOnline = presenceManager.isOnline(friendId);
      console.log(`[getMyFriends] Friend ${friend.fullName} (${friendId}): isOnline=${isOnline}`);
      return {
        ...friend.toObject(),
        isOnline,
      };
    });

    res.status(200).json(friendsWithStatus);
  } catch (error) {
    logger.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    if (["admin", "owner"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admins cannot send friend requests" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const sender = await User.findById(myId);

    const friendRequest = await FriendRequest.create({
      sender: myId,
      senderName: sender.fullName,
      recipient: recipientId,
      recipientName: recipient.fullName,
    });

    const io = getIO();
    const recipientSocketIds = presenceManager.getUserSocketIds(recipientId);
    recipientSocketIds.forEach((sid) => {
      io.to(sid).emit("new-friend-request", {
        _id: friendRequest._id,
        sender: {
          _id: sender._id,
          fullName: sender.fullName,
          profilePic: sender.profilePic,
        },
        senderName: sender.fullName,
        status: "pending",
        createdAt: friendRequest.createdAt,
      });
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    logger.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (["admin", "owner"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admins cannot accept friend requests" });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    await FriendRequest.findByIdAndUpdate(requestId, { status: "accepted" });

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    logger.error("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to reject this request" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Friend request rejected and removed" });
  } catch (error) {
    logger.error("Error in rejectFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function removeFriend(req, res) {
  try {
    const myId = req.user.id;
    const { id: friendId } = req.params;

    if (myId === friendId) {
      return res.status(400).json({ message: "You cannot remove yourself" });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check they are actually friends
    const me = await User.findById(myId);
    if (!me.friends.map((f) => f.toString()).includes(friendId)) {
      return res.status(400).json({ message: "This user is not in your friends list" });
    }

    // Remove from both users' friends arrays
    await User.findByIdAndUpdate(myId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: myId } });

    // Clean up any accepted friend requests between the two users
    await FriendRequest.deleteMany({
      $or: [
        { sender: myId, recipient: friendId },
        { sender: friendId, recipient: myId },
      ],
    });

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    logger.error("Error in removeFriend controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    logger.error("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    logger.error("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    const myId = req.user.id;

    if (!query || !query.trim()) {
      return res.status(200).json([]);
    }

    const regex = new RegExp(escapeRegex(query.trim()), "i");

    const queryFilter = {
      _id: { $ne: myId },
      isOnboarded: true,
      role: { $nin: ["admin", "owner"] },
      $or: [
        { fullName: regex },
        { email: regex }
      ]
    };

    const users = await User.find(queryFilter)
      .select("fullName profilePic bio location createdAt friends lastSeen")
      .limit(20);

    const friendIds = new Set((req.user.friends || []).map((id) => id.toString()));

    const results = users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      profilePic: u.profilePic,
      bio: u.bio || "",
      location: u.location || "",
      createdAt: u.createdAt,
      friendsCount: u.friends?.length || 0,
      isOnline: presenceManager.isOnline(u._id.toString()),
      lastSeen: u.lastSeen,
      isFriend: friendIds.has(u._id.toString()),
    }));

    res.status(200).json(results);
  } catch (error) {
    logger.error("Error in searchUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const user = await User.findById(req.user.id).populate("blockedUsers", "fullName profilePic");
    res.status(200).json(user.blockedUsers || []);
  } catch (error) {
    logger.error("Error in getBlockedUsers controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function blockUser(req, res) {
  try {
    const { id: targetId } = req.params;
    const myId = req.user.id;

    if (myId === targetId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add to blocked users, remove from friends for both
    await User.findByIdAndUpdate(myId, {
      $addToSet: { blockedUsers: targetId },
      $pull: { friends: targetId }
    });

    await User.findByIdAndUpdate(targetId, {
      $pull: { friends: myId }
    });

    // Block in Stream Chat
    if (streamClient) {
      try {
        await streamClient.blockUser(targetId, { user_id: myId });
      } catch (err) {
        logger.error("Stream block user error:", err);
      }
    }

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    logger.error("Error in blockUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function unblockUser(req, res) {
  try {
    const { id: targetId } = req.params;
    const myId = req.user.id;

    await User.findByIdAndUpdate(myId, {
      $pull: { blockedUsers: targetId }
    });

    // Unblock in Stream Chat
    if (streamClient) {
      try {
        await streamClient.unblockUser(targetId, { user_id: myId });
      } catch (err) {
        logger.error("Stream unblock user error:", err);
      }
    }

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    logger.error("Error in unblockUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateSettings(req, res) {
  try {
    const userId = req.user._id;
    const { chatWallpaper, privacySettings, appSettings } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (chatWallpaper !== undefined) {
      if (chatWallpaper && chatWallpaper.startsWith("data:")) {
        const validation = validateBase64Upload(chatWallpaper, "image");
        if (!validation.ok) {
          return res.status(400).json({ message: validation.error });
        }
        const uploadRoot = path.join(__dirname, "../../uploads");
        const filename = secureFilename(validation.ext);
        const filepath = safeUploadPath(uploadRoot, filename);

        if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

        fs.writeFileSync(filepath, validation.buffer);
        const host = req.protocol + "://" + req.get("host");
        user.chatWallpaper = `${host}/uploads/${filename}`;
      } else {
        user.chatWallpaper = chatWallpaper ? sanitizeUrl(chatWallpaper) : chatWallpaper;
      }
    }

    if (privacySettings !== undefined) {
      user.privacySettings = { ...user.privacySettings?.toObject?.() ?? user.privacySettings, ...privacySettings };
    }
    if (appSettings !== undefined) {
      const current = user.appSettings?.toObject?.() ?? user.appSettings ?? {};
      user.appSettings = {
        general: { ...current.general, ...appSettings.general },
        notifications: { ...current.notifications, ...appSettings.notifications },
        media: { ...current.media, ...appSettings.media },
      };
      user.markModified("appSettings");
    }

    await user.save();
    const updatedUser = await User.findById(userId).select("-password");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error("Error in updateSettings controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
