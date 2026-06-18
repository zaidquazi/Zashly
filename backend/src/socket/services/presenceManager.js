/**
 * PresenceManager — Multi-device presence tracking.
 *
 * Supports multiple simultaneous sockets per user (tabs, devices).
 * A user is considered "online" as long as at least one socket is connected.
 * Incoming calls are delivered to ALL user sockets.
 *
 * Data structures:
 *   userSockets:  Map<userId, Set<socketId>>
 *   socketToUser: Map<socketId, userId>           (reverse lookup)
 */
import User from "../../models/User.js";
import logger from "../../monitoring/logger.js";

class PresenceManager {
  constructor() {
    /** @type {Map<string, Set<string>>} userId → Set of socketIds */
    this.userSockets = new Map();
    /** @type {Map<string, string>} socketId → userId */
    this.socketToUser = new Map();
  }

  // ── Helpers ─────────────────────────────────────────────────

  /** Normalize any ID (ObjectId / string) to a plain string key */
  static key(id) {
    return id == null ? "" : String(id);
  }

  // ── Core operations ─────────────────────────────────────────

  /**
   * Register a socket for a user.
   * @param {string} userId
   * @param {string} socketId
   * @returns {{ isNewUser: boolean, socketCount: number }}
   */
  addSocket(userId, socketId) {
    const uid = PresenceManager.key(userId);
    if (!uid) return { isNewUser: false, socketCount: 0 };

    // Remove any previous mapping for this socketId (handles reconnect edge case)
    this._removeSocketMapping(socketId);

    let sockets = this.userSockets.get(uid);
    const isNewUser = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(uid, sockets);
    }

    sockets.add(socketId);
    this.socketToUser.set(socketId, uid);

    logger.debug("PresenceManager: socket added", {
      userId: uid,
      socketId,
      isNewUser,
      socketCount: sockets.size,
    });

    return { isNewUser, socketCount: sockets.size };
  }

  /**
   * Remove a socket for a user (on disconnect).
   * @param {string} socketId
   * @returns {{ userId: string|null, isLastSocket: boolean, remainingCount: number }}
   */
  removeSocket(socketId) {
    const uid = this.socketToUser.get(socketId);
    if (!uid) return { userId: null, isLastSocket: false, remainingCount: 0 };

    this.socketToUser.delete(socketId);

    const sockets = this.userSockets.get(uid);
    if (sockets) {
      sockets.delete(socketId);

      if (sockets.size === 0) {
        this.userSockets.delete(uid);
        this._updateLastSeen(uid);

        logger.debug("PresenceManager: user fully offline", { userId: uid });
        return { userId: uid, isLastSocket: true, remainingCount: 0 };
      }

      return { userId: uid, isLastSocket: false, remainingCount: sockets.size };
    }

    return { userId: uid, isLastSocket: true, remainingCount: 0 };
  }

  // ── Query operations ────────────────────────────────────────

  /**
   * Get all socket IDs for a user.
   * @param {string} userId
   * @returns {string[]}
   */
  getUserSocketIds(userId) {
    const uid = PresenceManager.key(userId);
    const sockets = this.userSockets.get(uid);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Check if a user has any connected sockets.
   * @param {string} userId
   * @returns {boolean}
   */
  isOnline(userId) {
    const uid = PresenceManager.key(userId);
    const sockets = this.userSockets.get(uid);
    return !!(sockets && sockets.size > 0);
  }

  /**
   * Get the userId associated with a socketId.
   * @param {string} socketId
   * @returns {string|null}
   */
  getSocketUserId(socketId) {
    return this.socketToUser.get(socketId) || null;
  }

  /**
   * Get all online user IDs.
   * @returns {string[]}
   */
  getAllOnlineUserIds() {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get total connected socket count (all users).
   * @returns {number}
   */
  getTotalSocketCount() {
    let count = 0;
    for (const sockets of this.userSockets.values()) {
      count += sockets.size;
    }
    return count;
  }

  // ── Internal helpers ────────────────────────────────────────

  /** Remove a socket from reverse and forward maps without triggering side effects */
  _removeSocketMapping(socketId) {
    const existingUid = this.socketToUser.get(socketId);
    if (existingUid) {
      this.socketToUser.delete(socketId);
      const sockets = this.userSockets.get(existingUid);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.userSockets.delete(existingUid);
        }
      }
    }
  }

  /** Update lastSeen in DB when user fully goes offline */
  _updateLastSeen(userId) {
    User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) =>
      logger.error("PresenceManager: error updating lastSeen", {
        userId,
        error: err.message,
      })
    );
  }
}

// Singleton instance
const presenceManager = new PresenceManager();
export default presenceManager;
