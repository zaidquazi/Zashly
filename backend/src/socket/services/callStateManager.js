import { RING_TIMEOUT_MS } from "../../services/call.service.js";

/**
 * In-memory call session state — prevents duplicate rooms, ringing, and race conditions.
 * For multi-instance deployments, migrate to Redis with the same interface.
 */
class CallStateManager {
  constructor() {
    /** @type {Map<string, object>} callId → session */
    this.activeCalls = new Map();
    /** @type {Map<string, string>} userId → callId */
    this.userCallMap = new Map();
    /** @type {Map<string, NodeJS.Timeout>} callId → ring timer */
    this.ringingTimers = new Map();
  }

  isUserInCall(userId) {
    return this.userCallMap.has(String(userId));
  }

  getUserCallId(userId) {
    return this.userCallMap.get(String(userId)) || null;
  }

  getCall(callId) {
    return this.activeCalls.get(callId) || null;
  }

  createCall(session) {
    const { callId, callerId, participants = [] } = session;
    if (this.activeCalls.has(callId)) {
      throw new Error("Call already exists");
    }

    this.activeCalls.set(callId, {
      ...session,
      status: "ringing",
      createdAt: Date.now(),
      acceptedBy: new Set(),
    });

    this._bindUser(callerId, callId);
    for (const pid of participants) {
      if (pid !== callerId) this._bindUser(pid, callId);
    }

    return this.getCall(callId);
  }

  acceptCall(callId, userId) {
    const call = this.getCall(callId);
    if (!call) return null;
    call.acceptedBy.add(String(userId));
    if (call.status === "ringing") {
      call.status = "active";
      call.startedAt = Date.now();
    }
    this._clearRingTimer(callId);
    return call;
  }

  endCall(callId) {
    const call = this.getCall(callId);
    if (!call) return null;

    this._clearRingTimer(callId);
    this.activeCalls.delete(callId);

    const allUsers = new Set([call.callerId, ...(call.participants || [])]);
    for (const uid of allUsers) {
      if (this.userCallMap.get(String(uid)) === callId) {
        this.userCallMap.delete(String(uid));
      }
    }

    return call;
  }

  setRingTimer(callId, onMissed) {
    this._clearRingTimer(callId);
    const timer = setTimeout(() => {
      this.ringingTimers.delete(callId);
      const call = this.getCall(callId);
      if (call && call.status === "ringing") {
        onMissed(call);
      }
    }, RING_TIMEOUT_MS);
    this.ringingTimers.set(callId, timer);
  }

  _clearRingTimer(callId) {
    const t = this.ringingTimers.get(callId);
    if (t) {
      clearTimeout(t);
      this.ringingTimers.delete(callId);
    }
  }

  _bindUser(userId, callId) {
    const uid = String(userId);
    if (this.userCallMap.has(uid) && this.userCallMap.get(uid) !== callId) {
      throw new Error("User is already in a call");
    }
    this.userCallMap.set(uid, callId);
  }

  cleanupUser(userId) {
    const callId = this.getUserCallId(userId);
    if (!callId) return null;
    return this.endCall(callId);
  }
}

const callStateManager = new CallStateManager();
export default callStateManager;
