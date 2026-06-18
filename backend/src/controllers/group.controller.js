import logger from "../monitoring/logger.js";
import Group from "../models/Group.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";
import { streamClient } from "../lib/stream.js";
import {
  validateBase64Upload,
  secureFilename,
  safeUploadPath,
} from "../uploads/security/fileValidator.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sanitizeUrl } from "../utils/security/sanitize.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createGroup(req, res) {
  try {
    const { name, description, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 1) {
      return res.status(400).json({ message: "At least one other member is required" });
    }

    const validMembers = await User.find({
      _id: { $in: memberIds },
    }).select("_id fullName");

    if (validMembers.length !== memberIds.length) {
      return res.status(400).json({ message: "One or more member IDs are invalid" });
    }

    const allMemberIds = [...new Set([adminId.toString(), ...memberIds])];

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || "",
      admin: adminId,
      admins: [adminId],
      members: allMemberIds,
    });

    if (streamClient) {
      try {
        const channel = streamClient.channel("messaging", String(group._id), {
          name: group.name,
          created_by_id: String(adminId),
          members: allMemberIds.map(String),
        });
        await channel.create();
      } catch (err) {
        logger.error("Error creating Stream channel:", err);
      }
    }

    const populatedGroup = await Group.findById(group._id)
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    try {
      const io = getIO();
      memberIds.forEach((memberId) => {
        io.to(`group:${group._id}`).emit("group-created", populatedGroup);
      });
      memberIds.forEach((memberId) => {
        io.emit("group-created-for-user", {
          userId: memberId,
          group: populatedGroup,
        });
      });
    } catch (socketErr) {
      logger.error("Socket emit error on group creation:", socketErr.message);
    }

    res.status(201).json(populatedGroup);
  } catch (error) {
    logger.error("Error in createGroup:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyGroups(req, res) {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    logger.error("Error in getMyGroups:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getGroupById(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("members", "fullName profilePic bio")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    logger.error("Error in getGroupById:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateGroup(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { name, description, avatar, settings } = req.body;

    const groupToUpdate = await Group.findById(groupId);
    if (!groupToUpdate) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isGroupAdmin = groupToUpdate.admins.some(id => id.toString() === userId.toString()) || groupToUpdate.admin.toString() === userId.toString();

    const canEditInfo = isGroupAdmin || (groupToUpdate.settings?.editInfo === "all");

    if ((name !== undefined || description !== undefined || avatar !== undefined) && !canEditInfo) {
      return res.status(403).json({ message: "You don't have permission to edit group info" });
    }

    if (settings !== undefined && !isGroupAdmin) {
      return res.status(403).json({ message: "Only admins can update group settings" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (avatar !== undefined) {
      if (avatar && avatar.startsWith("data:")) {
        const validation = validateBase64Upload(avatar, "image");
        if (!validation.ok) {
          return res.status(400).json({ message: validation.error });
        }
        const uploadRoot = path.join(__dirname, "../../uploads");
        const filename = secureFilename(validation.ext);
        const filepath = safeUploadPath(uploadRoot, filename);

        if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

        fs.writeFileSync(filepath, validation.buffer);
        const host = req.protocol + "://" + req.get("host");
        updateData.avatar = `${host}/uploads/${filename}`;
      } else {
        updateData.avatar = avatar ? sanitizeUrl(avatar) : avatar;
      }
    }
    if (settings !== undefined) updateData.settings = { ...groupToUpdate.settings, ...settings };

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    try {
      const io = getIO();
      io.to(`group:${groupId}`).emit("group-updated", updatedGroup);
    } catch (socketErr) {
      logger.error("Socket emit error:", socketErr.message);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    logger.error("Error in updateGroup:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function addMembers(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Member IDs are required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isGroupAdmin = group.admins.some(id => id.toString() === userId.toString()) || group.admin.toString() === userId.toString();

    const existingMemberIds = group.members.map((m) => m.toString());
    const newMemberIds = memberIds.filter((id) => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ message: "All selected users are already members" });
    }

    const validMembers = await User.find({
      _id: { $in: newMemberIds },
    }).select("_id fullName");

    if (validMembers.length !== newMemberIds.length) {
      return res.status(400).json({ message: "One or more member IDs are invalid" });
    }

    const requireApproval = group.settings?.requireApproval;
    const isAddingToPending = requireApproval && !isGroupAdmin;

    if (isAddingToPending) {
      const existingPending = group.pendingMembers.map(m => m.toString());
      const trulyNewPending = newMemberIds.filter(id => !existingPending.includes(id));

      if (trulyNewPending.length > 0) {
        await Group.findByIdAndUpdate(groupId, {
          $addToSet: { pendingMembers: { $each: trulyNewPending } },
        });
      }
    } else {
      await Group.findByIdAndUpdate(groupId, {
        $addToSet: { members: { $each: newMemberIds } },
      });

      if (streamClient) {
        try {
          const channel = streamClient.channel("messaging", String(groupId));
          await channel.addMembers(newMemberIds.map(String));
        } catch (err) {
          logger.error("Error adding members to Stream channel:", err);
        }
      }
    }

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    try {
      const io = getIO();
      io.to(`group:${groupId}`).emit("member-added", {
        groupId,
        newMembers: validMembers,
        group: updatedGroup,
      });
      newMemberIds.forEach((memberId) => {
        io.emit("group-created-for-user", {
          userId: memberId,
          group: updatedGroup,
        });
      });
    } catch (socketErr) {
      logger.error("Socket emit error:", socketErr.message);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    logger.error("Error in addMembers:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteGroupMessage(req, res) {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isGroupAdmin = group.admins.some(id => id.toString() === userId.toString()) || group.admin.toString() === userId.toString();

    if (!isGroupAdmin) {
      return res.status(403).json({ message: "Only group admins can delete messages" });
    }

    if (!streamClient) {
      return res.status(500).json({ message: "Stream client not configured" });
    }

    await streamClient.deleteMessage(messageId);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    logger.error("Error deleting group message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function removeMember(req, res) {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isCreator = group.admin.toString() === currentUserId.toString();
    const isAdmin = group.admins.some(id => id.toString() === currentUserId.toString()) || isCreator;
    const isSelf = currentUserId.toString() === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Only the admin can remove members" });
    }

    if (targetUserId === group.admin.toString() && !isSelf) {
      return res.status(400).json({ message: "Cannot remove the admin" });
    }

    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: targetUserId, admins: targetUserId },
    });

    if (streamClient) {
      try {
        const channel = streamClient.channel("messaging", String(groupId));
        await channel.removeMembers([String(targetUserId)]);
      } catch (err) {
        logger.error("Error removing member from Stream channel:", err);
      }
    }

    const removedUser = await User.findById(targetUserId).select("fullName");

    try {
      const io = getIO();
      io.to(`group:${groupId}`).emit("member-removed", {
        groupId,
        removedUserId: targetUserId,
      });
    } catch (socketErr) {
      logger.error("Socket emit error:", socketErr.message);
    }

    if (isSelf && isAdmin) {
      const updatedGroup = await Group.findById(groupId);
      if (updatedGroup.members.length === 0) {
        await Group.findByIdAndDelete(groupId);
        return res.status(200).json({ message: "Group deleted (no members remaining)" });
      } else {
        updatedGroup.admin = updatedGroup.members[0];
        if (!updatedGroup.admins.includes(updatedGroup.members[0])) {
          updatedGroup.admins.push(updatedGroup.members[0]);
        }
        updatedGroup.admins = updatedGroup.admins.filter(a => a.toString() !== targetUserId);
        await updatedGroup.save();
      }
    }

    res.status(200).json({ message: isSelf ? "You left the group" : "Member removed" });
  } catch (error) {
    logger.error("Error in removeMember:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function promoteAdmin(req, res) {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isGroupAdmin = group.admins.some(id => id.toString() === currentUserId.toString()) || group.admin.toString() === currentUserId.toString();
    if (!isGroupAdmin) {
      return res.status(403).json({ message: "Only an admin can promote members" });
    }

    if (!group.members.some(id => id.toString() === targetUserId)) {
      return res.status(400).json({ message: "User is not a member of this group" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { admins: targetUserId } },
      { new: true }
    )
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    try {
      getIO().to(`group:${groupId}`).emit("group-updated", updatedGroup);
    } catch (err) {
      logger.error("Socket emit error on promote admin:", err.message);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function demoteAdmin(req, res) {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isCreator = group.admin.toString() === currentUserId.toString();
    const isGroupAdmin = group.admins.some(id => id.toString() === currentUserId.toString()) || isCreator;
    
    if (!isGroupAdmin) {
      return res.status(403).json({ message: "Only an admin can demote members" });
    }

    if (group.admin.toString() === targetUserId && !isCreator) {
      return res.status(403).json({ message: "Cannot demote the group creator" });
    }
    
    if (group.admin.toString() === targetUserId) {
      return res.status(400).json({ message: "The group creator cannot be demoted" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { admins: targetUserId } },
      { new: true }
    )
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    try {
      getIO().to(`group:${groupId}`).emit("group-updated", updatedGroup);
    } catch (err) {
      logger.error("Socket emit error on demote admin:", err.message);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function approveMember(req, res) {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isGroupAdmin = group.admins.some(id => id.toString() === currentUserId.toString()) || group.admin.toString() === currentUserId.toString();
    if (!isGroupAdmin) {
      return res.status(403).json({ message: "Only an admin can approve members" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { 
        $pull: { pendingMembers: targetUserId },
        $addToSet: { members: targetUserId }
      },
      { new: true }
    )
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    if (streamClient) {
      try {
        const channel = streamClient.channel("messaging", String(groupId));
        await channel.addMembers([String(targetUserId)]);
      } catch (err) {
        logger.error("Error adding approved member to Stream channel:", err);
      }
    }

    try {
      getIO().to(`group:${groupId}`).emit("group-updated", updatedGroup);
      const userToNotify = await User.findById(targetUserId);
      if (userToNotify) {
        getIO().emit("group-created-for-user", {
          userId: targetUserId,
          group: updatedGroup,
        });
      }
    } catch (err) {
      logger.error("Socket emit error on approve member:", err.message);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectMember(req, res) {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isGroupAdmin = group.admins.some(id => id.toString() === currentUserId.toString()) || group.admin.toString() === currentUserId.toString();
    if (!isGroupAdmin) {
      return res.status(403).json({ message: "Only an admin can reject members" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { pendingMembers: targetUserId } },
      { new: true }
    )
      .populate("members", "fullName profilePic")
      .populate("admin", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("pendingMembers", "fullName profilePic");

    try {
      getIO().to(`group:${groupId}`).emit("group-updated", updatedGroup);
    } catch (err) {
      logger.error("Socket emit error on reject member:", err.message);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
