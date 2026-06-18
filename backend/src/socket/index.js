/**
 * Socket.IO Initialization — Clean composition layer.
 *
 * Composes all socket handler modules:
 *   - Presence (online/offline, roster, group rooms)
 *   - Call Signaling (call lifecycle events)
 *   - WebRTC Relay (SDP/ICE signaling)
 *   - Chat (group messaging, typing indicators — delegated to main socket.js)
 *
 * Middleware pipeline:
 *   1. JWT Authentication
 *   2. Rate Limiting (per-event)
 */
import { Server } from "socket.io";
import { getSocketCorsOrigins } from "../config/security/cors.config.js";
import { createSocketAuthMiddleware } from "./security/socketAuth.middleware.js";
import { globalSocketLimiter } from "./security/socketRateLimit.js";
import { registerPresenceHandlers } from "./handlers/presence.handler.js";
import { registerCallSignalingHandlers } from "./handlers/callSignaling.handler.js";
import logger from "../monitoring/logger.js";

/**
 * Initialize Socket.IO server and register all handler modules.
 * @param {import("http").Server} httpServer
 * @param {{ registerChatHandlers?: (io, socket, helpers) => void }} options
 * @returns {import("socket.io").Server}
 */
export function createSocketServer(httpServer, options = {}) {
  const io = new Server(httpServer, {
    cors: {
      origin: getSocketCorsOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 1e6,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Middleware pipeline ────────────────────────────────────
  io.use(createSocketAuthMiddleware());

  // ── Connection handling ────────────────────────────────────
  io.on("connection", (socket) => {
    // Rate check helper scoped to this socket
    const rateCheck = (eventName) => {
      if (!globalSocketLimiter.check(socket.id, eventName)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return false;
      }
      return true;
    };

    const helpers = { rateCheck };

    // Register handler modules (order matters for disconnect handling)
    // 1. Presence first — sets up user tracking
    registerPresenceHandlers(io, socket, helpers);

    // 2. Call signaling — LiveKit call lifecycle
    registerCallSignalingHandlers(io, socket, helpers);

    // 3. Chat handlers — registered externally (kept in socket.js for now)
    if (options.registerChatHandlers) {
      options.registerChatHandlers(io, socket, helpers);
    }

    logger.debug("Socket: new connection", {
      socketId: socket.id,
      userId: socket.userId,
      ip: socket.handshake.headers["x-forwarded-for"]?.split(",")[0]?.trim() || socket.handshake.address,
    });
  });

  return io;
}

export default { createSocketServer };
