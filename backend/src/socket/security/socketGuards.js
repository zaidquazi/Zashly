/**
 * Socket room access validation — only group members may join group rooms.
 */
import Group from "../../models/Group.js";
import mongoose from "mongoose";

export async function canJoinGroup(userId, groupId) {
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return false;
  }
  const group = await Group.findById(groupId).select("members").lean();
  if (!group) return false;
  return group.members.some((m) => m.toString() === userId);
}

export function validateSocketPayload(data, requiredFields = []) {
  if (!data || typeof data !== "object") return false;
  return requiredFields.every((f) => data[f] != null && data[f] !== "");
}
