/**
 * Call Signaling Handler — Socket.IO events for call lifecycle.
 * LiveKit handles media; sockets handle signaling only.
 */
import User from "../../models/User.js";
import Group from "../../models/Group.js";
import presenceManager from "../services/presenceManager.js";
import callStateManager from "../services/callStateManager.js";
import { deliverToUser } from "../utils/deliverToUser.js";
import { assertSocketUser } from "../security/socketAuth.middleware.js";
import {
  assertCanCallUser,
  assertGroupMember,
  buildCallId,
  buildRoomName,
  createCallRoom,
  finalizeCallRecord,
  saveCallHistory,
  cleanupLiveKitRoom,
} from "../../services/call.service.js";
import { isLiveKitConfigured } from "../../services/livekit/index.js";
import logger from "../../monitoring/logger.js";

function ack(socket, cb, payload) {
  if (typeof cb === "function") cb(payload);
}

export function registerCallSignalingHandlers(io, socket, { rateCheck }) {
  const userId = socket.userId;

  // ── call:initiate ─────────────────────────────────────────
  socket.on("call:initiate", async (data, cb) => {
    try {
      if (!rateCheck("call:initiate")) return ack(socket, cb, { success: false, error: "Rate limited" });
      if (!isLiveKitConfigured()) return ack(socket, cb, { success: false, error: "Calling unavailable" });

      const {
        targetId,
        groupId,
        callType = "voice",
        callMode = targetId ? "personal" : "group",
        participantIds = [],
      } = data || {};

      if (!assertSocketUser(socket, userId)) {
        return ack(socket, cb, { success: false, error: "Unauthorized" });
      }

      if (callStateManager.isUserInCall(userId)) {
        return ack(socket, cb, { success: false, error: "You are already in a call" });
      }

      const callId = data?.callId || buildCallId();
      let participants = [];
      let groupRef = null;
      let calleeIds = [];

      if (callMode === "personal") {
        if (!targetId) return ack(socket, cb, { success: false, error: "targetId required" });
        if (callStateManager.isUserInCall(targetId)) {
          return ack(socket, cb, { success: false, error: "User is busy" });
        }
        await assertCanCallUser(userId, targetId);
        participants = [userId, targetId];
        calleeIds = [targetId];
      } else {
        if (!groupId) return ack(socket, cb, { success: false, error: "groupId required" });
        const group = await assertGroupMember(userId, groupId);
        groupRef = groupId;
        const memberSet = new Set(group.members.map((m) => m.toString()));
        calleeIds = group.members
          .map((m) => m.toString())
          .filter((id) => id !== userId && (!participantIds.length || participantIds.includes(id)));
        participants = [userId, ...calleeIds];
      }

      const { roomName } = await createCallRoom({ callId, callMode, callType, hostId: userId });

      const caller = await User.findById(userId).select("fullName profilePic username").lean();

      const history = await saveCallHistory({
        callerId: userId,
        participants: participants.filter((p) => p !== userId),
        roomName,
        callType,
        callMode,
        status: "cancelled",
        groupId: groupRef,
      });

      const session = callStateManager.createCall({
        callId,
        callerId: userId,
        callerName: caller?.fullName || data?.callerName || "User",
        callerPic: caller?.profilePic || data?.callerPic || "",
        participants,
        roomName,
        callType,
        callMode,
        groupId: groupRef,
        historyId: history._id.toString(),
        hostId: userId,
      });

      // Notify caller that ringing started
      socket.emit("call:ringing", {
        callId,
        roomName,
        callType,
        callMode,
        participants: calleeIds,
      });

      const incomingPayload = {
        callId,
        roomName,
        callType,
        callMode,
        callerId: userId,
        callerName: session.callerName,
        callerPic: session.callerPic,
        groupId: groupRef,
        type: callMode === "group" ? "group" : "one-on-one",
      };

      for (const calleeId of calleeIds) {
        if (!presenceManager.isOnline(calleeId)) continue;
        deliverToUser(io, calleeId, "call:incoming", incomingPayload);
        deliverToUser(io, calleeId, "call:ringing", incomingPayload);
      }

      if (callMode === "personal" && calleeIds.length === 1) {
        callStateManager.setRingTimer(callId, async (call) => {
          await finalizeCallRecord(callId, call, "missed");
          callStateManager.endCall(callId);
          deliverToUser(io, call.callerId, "call:missed", { callId, targetId: calleeIds[0] });
          deliverToUser(io, calleeIds[0], "call:missed", { callId, callerId: call.callerId });
        });
      }

      ack(socket, cb, { success: true, callId, roomName, callType, callMode });
    } catch (err) {
      logger.error("call:initiate error", { error: err.message });
      ack(socket, cb, { success: false, error: err.message || "Failed to initiate call" });
    }
  });

  // ── call:accept ───────────────────────────────────────────
  socket.on("call:accept", async (data, cb) => {
    try {
      if (!rateCheck("call:accept")) return ack(socket, cb, { success: false, error: "Rate limited" });

      const { callId } = data || {};
      if (!callId) return ack(socket, cb, { success: false, error: "callId required" });
      if (!assertSocketUser(socket, data?.userId || userId)) {
        return ack(socket, cb, { success: false, error: "Unauthorized" });
      }

      const call = callStateManager.getCall(callId);
      if (!call) return ack(socket, cb, { success: false, error: "Call not found" });

      const isParticipant = call.callerId === userId || call.participants?.includes(userId);
      if (!isParticipant) return ack(socket, cb, { success: false, error: "Not a participant" });

      callStateManager.acceptCall(callId, userId);

      const acceptPayload = {
        callId,
        roomName: call.roomName,
        callType: call.callType,
        callMode: call.callMode,
        acceptedBy: userId,
      };

      const allUsers = new Set([call.callerId, ...(call.participants || [])]);
      for (const uid of allUsers) {
        deliverToUser(io, uid, "call:accept", acceptPayload);
      }

      ack(socket, cb, { success: true, ...acceptPayload });
    } catch (err) {
      logger.error("call:accept error", { error: err.message });
      ack(socket, cb, { success: false, error: err.message });
    }
  });

  // ── call:reject ───────────────────────────────────────────
  socket.on("call:reject", async (data, cb) => {
    try {
      if (!rateCheck("call:reject")) return ack(socket, cb, { success: false, error: "Rate limited" });

      const { callId } = data || {};
      if (!callId) return ack(socket, cb, { success: false, error: "callId required" });

      const call = callStateManager.getCall(callId);
      if (!call) return ack(socket, cb, { success: false, error: "Call not found" });

      await finalizeCallRecord(callId, call, "rejected");
      callStateManager.endCall(callId);
      await cleanupLiveKitRoom(call.roomName);

      const rejectPayload = { callId, rejectedBy: userId };
      const allUsers = new Set([call.callerId, ...(call.participants || [])]);
      for (const uid of allUsers) {
        deliverToUser(io, uid, "call:reject", rejectPayload);
      }

      ack(socket, cb, { success: true });
    } catch (err) {
      logger.error("call:reject error", { error: err.message });
      ack(socket, cb, { success: false, error: err.message });
    }
  });

  // ── call:end ──────────────────────────────────────────────
  socket.on("call:end", async (data, cb) => {
    try {
      if (!rateCheck("call:end")) return ack(socket, cb, { success: false, error: "Rate limited" });

      const { callId } = data || {};
      if (!callId) return ack(socket, cb, { success: false, error: "callId required" });

      const call = callStateManager.getCall(callId);
      if (!call) return ack(socket, cb, { success: false, error: "Call not found" });

      const status = call.status === "active" ? "completed" : "cancelled";
      await finalizeCallRecord(callId, call, status);
      callStateManager.endCall(callId);
      await cleanupLiveKitRoom(call.roomName);

      const endPayload = { callId, endedBy: userId, status };
      const allUsers = new Set([call.callerId, ...(call.participants || [])]);
      for (const uid of allUsers) {
        deliverToUser(io, uid, "call:end", endPayload);
      }

      ack(socket, cb, { success: true, status });
    } catch (err) {
      logger.error("call:end error", { error: err.message });
      ack(socket, cb, { success: false, error: err.message });
    }
  });

  // ── call:participant-joined / left ──────────────────────
  socket.on("call:participant-joined", (data) => {
    if (!rateCheck("call:participant-joined")) return;
    const { callId, participantId, participantName } = data || {};
    const call = callStateManager.getCall(callId);
    if (!call) return;

    const payload = { callId, participantId, participantName };
    const allUsers = new Set([call.callerId, ...(call.participants || [])]);
    for (const uid of allUsers) {
      if (uid !== userId) deliverToUser(io, uid, "call:participant-joined", payload);
    }
  });

  socket.on("call:participant-left", (data) => {
    if (!rateCheck("call:participant-left")) return;
    const { callId, participantId } = data || {};
    const call = callStateManager.getCall(callId);
    if (!call) return;

    const payload = { callId, participantId };
    const allUsers = new Set([call.callerId, ...(call.participants || [])]);
    for (const uid of allUsers) {
      if (uid !== userId) deliverToUser(io, uid, "call:participant-left", payload);
    }
  });

  // ── Disconnect cleanup ────────────────────────────────────
  socket.on("disconnect", () => {
    const ended = callStateManager.cleanupUser(userId);
    if (ended) {
      finalizeCallRecord(ended.callId, ended, "cancelled").catch(() => {});
      cleanupLiveKitRoom(ended.roomName).catch(() => {});
      const endPayload = { callId: ended.callId, endedBy: userId, status: "cancelled" };
      const allUsers = new Set([ended.callerId, ...(ended.participants || [])]);
      for (const uid of allUsers) {
        if (uid !== userId) deliverToUser(io, uid, "call:end", endPayload);
      }
    }
  });
}

export default { registerCallSignalingHandlers };
