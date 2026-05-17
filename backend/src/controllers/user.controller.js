import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { upsertStreamUser, streamClient } from "../lib/stream.js";
import { getOnlineUsers, getIO } from "../lib/socket.js";

export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullName, bio, location, profilePic } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

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
    } catch (streamError) {}

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage lastSeen privacySettings");

    const onlineUsers = getOnlineUsers();

    const friendsWithStatus = user.friends.map((friend) => ({
      ...friend.toObject(),
      isOnline: onlineUsers.has(friend._id.toString()),
    }));

    res.status(200).json(friendsWithStatus);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
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

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId: myId, recipientId: recipientId },
        { senderId: recipientId, recipientId: myId },
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
    const recipientSocketId = getOnlineUsers().get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new-friend-request", {
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
    }

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
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

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest controller", error.message);
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

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to reject this request" });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest controller", error.message);
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
    console.error("Error in getPendingFriendRequests controller", error.message);
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
    console.error("Error in getOutgoingFriendReqs controller", error.message);
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

    const regex = new RegExp(query.trim(), "i");

    const users = await User.find({
      _id: { $ne: myId },
      isOnboarded: true,
      fullName: regex,
    })
      .select("fullName profilePic bio location createdAt friends lastSeen")
      .limit(20);

    const onlineUsers = getOnlineUsers();
    const friendIds = new Set((req.user.friends || []).map((id) => id.toString()));

    const results = users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      profilePic: u.profilePic,
      bio: u.bio || "",
      location: u.location || "",
      createdAt: u.createdAt,
      friendsCount: u.friends?.length || 0,
      isOnline: onlineUsers.has(u._id.toString()),
      lastSeen: u.lastSeen,
      isFriend: friendIds.has(u._id.toString()),
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error("Error in searchUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const user = await User.findById(req.user.id).populate("blockedUsers", "fullName profilePic");
    res.status(200).json(user.blockedUsers || []);
  } catch (error) {
    console.error("Error in getBlockedUsers controller:", error.message);
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
        console.error("Stream block user error:", err);
      }
    }

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Error in blockUser controller:", error.message);
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
        console.error("Stream unblock user error:", err);
      }
    }

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error in unblockUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateSettings(req, res) {
  try {
    const userId = req.user.id;
    const { chatWallpaper, privacySettings } = req.body;

    const updateData = {};
    if (chatWallpaper !== undefined) updateData.chatWallpaper = chatWallpaper;
    if (privacySettings !== undefined) updateData.privacySettings = privacySettings;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateSettings controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
