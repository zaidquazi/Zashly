import {
  assertCanCallUser,
  assertGroupMember,
  buildCallId,
  createCallRoom,
  deleteCallRecord,
  finalizeCallRecord,
  getCallById,
  getCallHistoryForUser,
  issueCallToken,
  kickParticipantFromRoom,
  saveCallHistory,
  cleanupLiveKitRoom,
} from "../services/call.service.js";
import { isLiveKitConfigured } from "../services/livekit/index.js";
import callStateManager from "../socket/services/callStateManager.js";

export const createRoom = async (req, res) => {
  if (!isLiveKitConfigured()) {
    return res.status(503).json({ success: false, message: "Calling is not available" });
  }

  const userId = req.user._id.toString();
  const { callType, callMode, targetId, groupId, participantIds = [] } = req.body;

  const callId = buildCallId();
  let participants = [];
  let groupRef = null;

  if (callMode === "personal") {
    await assertCanCallUser(userId, targetId);
    participants = [userId, targetId];
  } else {
    const group = await assertGroupMember(userId, groupId);
    groupRef = groupId;
    const memberSet = new Set(group.members.map((m) => m.toString()));
    participants = [userId, ...participantIds.filter((id) => memberSet.has(id) && id !== userId)];
    if (participants.length < 1) participants = [userId];
  }

  const { roomName } = await createCallRoom({
    callId,
    callMode,
    callType,
    hostId: userId,
  });

  const history = await saveCallHistory({
    callerId: userId,
    participants: participants.filter((p) => p !== userId),
    roomName,
    callType,
    callMode,
    status: "cancelled",
    groupId: groupRef,
  });

  callStateManager.createCall({
    callId,
    callerId: userId,
    callerName: req.user.fullName,
    callerPic: req.user.profilePic || "",
    participants,
    roomName,
    callType,
    callMode,
    groupId: groupRef,
    historyId: history._id.toString(),
    hostId: userId,
  });

  res.status(201).json({
    success: true,
    callId,
    roomName,
    callType,
    callMode,
    participants,
  });
};

export const getToken = async (req, res) => {
  const userId = req.user._id.toString();
  const { callId, roomName } = req.body;

  const call = callStateManager.getCall(callId);
  if (!call) {
    return res.status(404).json({ success: false, message: "Call session not found" });
  }

  const isParticipant =
    call.callerId === userId || call.participants?.includes(userId);
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: "Not authorized for this call" });
  }

  if (call.roomName !== roomName) {
    return res.status(403).json({ success: false, message: "Invalid room" });
  }

  const { token, serverUrl } = await issueCallToken({
    userId,
    userName: req.user.fullName,
    roomName,
    isHost: call.hostId === userId,
  });

  res.json({ success: true, token, serverUrl });
};

export const endCall = async (req, res) => {
  const userId = req.user._id.toString();
  const { callId, roomName } = req.body;

  const call = callStateManager.getCall(callId);
  if (!call) {
    return res.status(404).json({ success: false, message: "Call not found" });
  }

  const isParticipant =
    call.callerId === userId || call.participants?.includes(userId);
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const status = call.status === "active" ? "completed" : "cancelled";
  await finalizeCallRecord(callId, call, status);
  callStateManager.endCall(callId);

  if (roomName || call.roomName) {
    await cleanupLiveKitRoom(roomName || call.roomName);
  }

  res.json({ success: true, status });
};

export const getHistory = async (req, res) => {
  const userId = req.user._id;
  const { page, limit } = req.query;
  const data = await getCallHistoryForUser(userId, { page, limit });
  res.json({ success: true, ...data });
};

export const getCall = async (req, res) => {
  const record = await getCallById(req.params.id, req.user._id);
  res.json({ success: true, call: record });
};

export const removeCall = async (req, res) => {
  await deleteCallRecord(req.params.id, req.user._id);
  res.json({ success: true });
};

export const removeParticipant = async (req, res) => {
  const userId = req.user._id.toString();
  const { callId, roomName, participantId } = req.body;

  const call = callStateManager.getCall(callId);
  if (!call) {
    return res.status(404).json({ success: false, message: "Call not found" });
  }

  if (call.hostId !== userId) {
    return res.status(403).json({ success: false, message: "Only the host can remove participants" });
  }

  await kickParticipantFromRoom(roomName, participantId);
  res.json({ success: true });
};

export const getCallConfig = async (_req, res) => {
  res.json({
    success: true,
    enabled: isLiveKitConfigured(),
  });
};
