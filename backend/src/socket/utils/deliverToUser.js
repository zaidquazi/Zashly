import presenceManager from "../services/presenceManager.js";

/**
 * Emit an event to every connected socket for a user.
 * Uses direct socket references (reliable) instead of room-only io.to().
 * @returns {number} count of sockets that received the event
 */
export function deliverToUser(io, userId, event, data) {
  const socketIds = presenceManager.getUserSocketIds(userId);
  let delivered = 0;

  for (const sid of socketIds) {
    const sock = io.sockets.sockets.get(sid);
    if (sock) {
      sock.emit(event, data);
      delivered += 1;
    }
  }

  return delivered;
}

export default { deliverToUser };
