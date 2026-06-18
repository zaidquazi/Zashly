import { v4 as uuidv4 } from "uuid";
import CallHistory from "../models/CallHistory.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import {
  createLiveKitRoom,
  deleteLiveKitRoom,
  generateLiveKitToken,
  getLiveKitUrl,
  isLiveKitConfigured,
  removeParticipant,
} from "./livekit/index.js";

const RING_TIMEOUT_MS = 45_000;

export function buildRoomName(callId) {
  return `zashly_${callId}`;
}

export function buildCallId() {
  return uuidv4().replace(/-/g, "").slice(0, 16);
}

export async function assertCanCallUser(callerId, targetId) {
  const caller = await User.findById(callerId).select("friends blockedUsers").lean();
  if (!caller) throw Object.assign(new Error("Caller not found"), { status: 404 });

  const target = await User.findById(targetId).select("friends blockedUsers").lean();
  if (!target) throw Object.assign(new Error("User not found"), { status: 404 });

  const isFriend = caller.friends?.some((f) => f.toString() === String(targetId));
  if (!isFriend) throw Object.assign(new Error("You can only call friends"), { status: 403 });

  const blocked =
    caller.blockedUsers?.some((b) => b.toString() === String(targetId)) ||
    target.blockedUsers?.some((b) => b.toString() === String(callerId));
  if (blocked) throw Object.assign(new Error("Cannot call this user"), { status: 403 });

  return { caller, target };
}

export async function assertGroupMember(userId, groupId) {
  const group = await Group.findById(groupId).select("members admin admins name").lean();
  if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
  const isMember = group.members.some((m) => m.toString() === String(userId));
  if (!isMember) throw Object.assign(new Error("Not a group member"), { status: 403 });
  return group;
}

export async function createCallRoom({ callId, callMode, callType, hostId }) {
  if (!isLiveKitConfigured()) {
    throw Object.assign(new Error("LiveKit is not configured on the server"), { status: 503 });
  }
  const roomName = buildRoomName(callId);
  await createLiveKitRoom(roomName);
  return { callId, roomName, callMode, callType, hostId };
}

export async function issueCallToken({ userId, userName, roomName, isHost = false }) {
  const token = await generateLiveKitToken({
    identity: userId,
    name: userName,
    roomName,
    isHost,
  });
  return { token, serverUrl: getLiveKitUrl() };
}

export async function saveCallHistory({
  callerId,
  participants,
  roomName,
  callType,
  callMode,
  status,
  duration = 0,
  startedAt = null,
  endedAt = null,
  groupId = null,
}) {
  return CallHistory.create({
    callerId,
    participants,
    roomName,
    callType,
    callMode,
    status,
    duration,
    startedAt,
    endedAt,
    groupId,
  });
}

export async function finalizeCallRecord(callId, callState, status, endedAt = new Date()) {
  if (!callState?.historyId) return null;

  const startedAt = callState.startedAt ? new Date(callState.startedAt) : null;
  const duration =
    startedAt && status === "completed"
      ? Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000))
      : 0;

  return CallHistory.findByIdAndUpdate(
    callState.historyId,
    { status, endedAt, duration, startedAt: startedAt || undefined },
    { new: true }
  );
}

export async function getCallHistoryForUser(userId, { page = 1, limit = 30 } = {}) {
  const skip = (page - 1) * limit;
  const filter = {
    $or: [{ callerId: userId }, { participants: userId }],
  };

  const [records, total] = await Promise.all([
    CallHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("callerId", "fullName username profilePic")
      .populate("participants", "fullName username profilePic")
      .lean(),
    CallHistory.countDocuments(filter),
  ]);

  return { records, total, page, limit };
}

export async function getCallById(callId, userId) {
  const record = await CallHistory.findById(callId)
    .populate("callerId", "fullName username profilePic")
    .populate("participants", "fullName username profilePic")
    .lean();

  if (!record) throw Object.assign(new Error("Call not found"), { status: 404 });

  const isParticipant =
    record.callerId?._id?.toString() === String(userId) ||
    record.participants?.some((p) => p._id?.toString() === String(userId));

  if (!isParticipant) throw Object.assign(new Error("Access denied"), { status: 403 });
  return record;
}

export async function deleteCallRecord(callId, userId) {
  const record = await CallHistory.findById(callId);
  if (!record) throw Object.assign(new Error("Call not found"), { status: 404 });

  const isParticipant =
    record.callerId.toString() === String(userId) ||
    record.participants.some((p) => p.toString() === String(userId));

  if (!isParticipant) throw Object.assign(new Error("Access denied"), { status: 403 });
  await record.deleteOne();
  return { success: true };
}

export async function kickParticipantFromRoom(roomName, identity) {
  await removeParticipant(roomName, identity);
}

export async function cleanupLiveKitRoom(roomName) {
  await deleteLiveKitRoom(roomName);
}

export { RING_TIMEOUT_MS };
