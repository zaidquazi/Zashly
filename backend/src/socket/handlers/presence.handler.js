/**
 * Presence Handler — Socket.IO event handling for user presence.
 *
 * Extracted from the monolithic socket.js.
 * Manages: online/offline tracking, roster, group room management.
 * Uses presenceManager for multi-device support.
 */
import Group from "../../models/Group.js";
import presenceManager from "../services/presenceManager.js";
import { assertSocketUser } from "../security/socketAuth.middleware.js";
import logger from "../../monitoring/logger.js";

/**
 * Register presence handlers on a socket.
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 * @param {{ rateCheck: (event: string) => boolean }} helpers
 */
export function registerPresenceHandlers(io, socket, { rateCheck }) {
  const userId = socket.userId;

  console.log(`[PRESENCE] Socket connected: socketId=${socket.id}, userId=${userId}, authenticated=${socket.authenticated}`);

  // ── Auto-register on connection ───────────────────────────
  if (userId) {
    _registerOnline(io, socket, userId);
  } else {
    console.log(`[PRESENCE] WARNING: Socket ${socket.id} connected WITHOUT userId — presence will NOT be registered`);
  }

  // ── user-online: explicit registration ────────────────────
  socket.on("user-online", async (claimedUserId) => {
    try {
      console.log(`[PRESENCE] user-online event: socketId=${socket.id}, claimedUserId=${claimedUserId}, socket.userId=${socket.userId}`);
      if (!rateCheck("user-online")) return;
      if (!assertSocketUser(socket, claimedUserId)) {
        console.log(`[PRESENCE] user-online REJECTED: assertSocketUser failed for socket ${socket.id}`);
        return socket.disconnect(true);
      }
      await _registerOnline(io, socket, claimedUserId);
    } catch (err) {
      logger.error("Presence: unhandled error in user-online", { error: err.message });
    }
  });

  // ── request-online-roster ─────────────────────────────────
  socket.on("request-online-roster", () => {
    if (!rateCheck("request-online-roster")) return;
    if (!socket.userId) return;

    const roster = presenceManager.getAllOnlineUserIds();
    console.log(`[PRESENCE] request-online-roster from ${socket.userId}: roster=[${roster.join(", ")}] (${roster.length} online)`);
    socket.emit("online-users-list", roster);
  });

  // ── join-group / leave-group ──────────────────────────────
  socket.on("join-group", async (groupId) => {
    try {
      if (!rateCheck("join-group")) return;
      const allowed = await _canJoinGroup(socket.userId, groupId);
      if (!allowed) {
        return socket.emit("error", { message: "Not authorized for this group" });
      }
      socket.join(`group:${groupId}`);
    } catch (err) {
      logger.error("Presence: unhandled error in join-group", { error: err.message });
    }
  });

  socket.on("leave-group", (groupId) => {
    socket.leave(`group:${groupId}`);
  });

  // ── disconnect ────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log(`[PRESENCE] Socket disconnect: socketId=${socket.id}, userId=${socket.userId}, reason=${reason}`);
    _handleDisconnect(io, socket);
  });
}

// ── Internal helpers ──────

async function _registerOnline(io, socket, userId) {
  const { isNewUser, socketCount } = presenceManager.addSocket(userId, socket.id);

  // Cancel any pending offline timer — user reconnected within the grace period
  if (_offlineTimers.has(userId)) {
    clearTimeout(_offlineTimers.get(userId));
    _offlineTimers.delete(userId);
  }

  console.log(`[PRESENCE] _registerOnline: userId=${userId}, socketId=${socket.id}, isNewUser=${isNewUser}, socketCount=${socketCount}`);

  const roster = presenceManager.getAllOnlineUserIds();
  console.log(`[PRESENCE] Sending roster: [${roster.join(", ")}]`);

  if (isNewUser) {
    // If a new user came online, broadcast the new full roster to EVERYONE
    io.emit("online-users-list", roster);
  } else {
    // Otherwise just send the current roster to the connecting client
    socket.emit("online-users-list", roster);
  }

  // Join group rooms
  try {
    const groups = await Group.find({ members: userId }).select("_id");
    groups.forEach((g) => {
      socket.join(`group:${g._id}`);
    });
  } catch (err) {
    logger.error("Presence: error joining group rooms", {
      userId,
      error: err.message,
    });
  }
}

// Map of pending offline timers so we can cancel them on quick reconnect
const _offlineTimers = new Map();

function _handleDisconnect(io, socket) {
  const { userId, isLastSocket } = presenceManager.removeSocket(socket.id);

  if (!userId) return;

  // Only broadcast offline when ALL sockets for this user are gone
  if (isLastSocket) {
    // Cancel any existing pending offline timer for this user
    if (_offlineTimers.has(userId)) {
      clearTimeout(_offlineTimers.get(userId));
    }

    // Grace period: wait 5 seconds before broadcasting offline.
    // If the user reconnects within this window (page refresh, backend restart),
    // the timer is cancelled in _registerOnline and they never appear offline.
    const timer = setTimeout(() => {
      _offlineTimers.delete(userId);
      // Re-check: user may have reconnected during the grace period
      if (!presenceManager.isOnline(userId)) {
        const roster = presenceManager.getAllOnlineUserIds();
        io.emit("online-users-list", roster);
      }
    }, 5000);

    _offlineTimers.set(userId, timer);
  }

  // NOTE: Call cleanup on disconnect is handled by callSignaling.handler.js
  // which listens for its own disconnect event.
}


async function _canJoinGroup(userId, groupId) {
  const { default: mongoose } = await import("mongoose");
  if (!mongoose.Types.ObjectId.isValid(groupId)) return false;
  const group = await Group.findById(groupId).select("members").lean();
  if (!group) return false;
  return group.members.some((m) => m.toString() === userId);
}

export default { registerPresenceHandlers };
