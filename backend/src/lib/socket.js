/*** Socket.IO entry point — initializes server and registers all handlers.
 * This file has been refactored from a monolithic 682-line file to a thin
 * composition layer. Call/presence/WebRTC logic has been extracted into
 * dedicated handler modules under socket/handlers/.
 * Chat and group messaging handlers remain here for backward compatibility.*/
import { createSocketServer } from "../socket/index.js";
import presenceManager from "../socket/services/presenceManager.js";
import User from "../models/User.js";
import { assertSocketUser } from "../socket/security/socketAuth.middleware.js";
import {
  messageSocketLimiter,
  typingThrottle,
} from "../socket/security/socketRateLimit.js";
import { validateSocketPayload } from "../socket/security/socketGuards.js";
import { sanitizeText } from "../utils/security/sanitize.util.js";
import logger from "../monitoring/logger.js";

let io = null;

/**
 * Register chat/group messaging handlers.
 * These remain here to avoid disrupting the working chat system.
 */
function registerChatHandlers(ioInstance, socket, { rateCheck }) {

  socket.on("group-message", async (data) => {
    if (!messageSocketLimiter.check(socket.id, "group-message")) {
      return socket.emit("error", { message: "Message rate limit exceeded" });
    }
    if (!validateSocketPayload(data, ["groupId", "message"])) return;
    const senderId = data.message?.sender?._id || data.message?.sender;
    if (!assertSocketUser(socket, senderId)) return;

    try {
      const sender = await User.findById(senderId).select("isShadowBanned strikes isBanned fullName");

      if (sender?.isShadowBanned) {
        return;
      }

      // ── Auto-Moderation ──────────────────────────────────
      let messageText = data.message.content || data.message.text || "";
      if (messageText) {
        messageText = sanitizeText(messageText, 4000);
        if (data.message.content) data.message.content = messageText;
        if (data.message.text) data.message.text = messageText;
        const { checkMessage } = await import("../lib/autoModeration.js");
        const result = await checkMessage(messageText);

        if (result.flagged) {
          if (result.action === "block") {
            socket.emit("message-blocked", {
              reason: "Your message was blocked by auto-moderation.",
              matches: result.matches.map((m) => m.word),
            });
            return;
          }

          if (result.action === "strike") {
            sender.strikes = (sender.strikes || 0) + 1;
            if (sender.strikes >= 3) sender.isBanned = true;
            await sender.save();

            socket.emit("message-blocked", {
              reason: `Your message violated community guidelines. Strike ${sender.strikes}/3.`,
              matches: result.matches.map((m) => m.word),
            });
            return;
          }

          // Default: "censor" — replace bad words with ***
          if (data.message.content) data.message.content = result.censored;
          if (data.message.text) data.message.text = result.censored;
        }
      }

      socket.to(`group:${data.groupId}`).emit("new-group-message", data.message);
    } catch (err) {
      logger.error("Error in group-message socket handler:", err.message);
    }
  });

  socket.on("typing-start", ({ groupId, userId, userName }) => {
    if (!typingThrottle.allow(socket.id, groupId)) return;
    if (!assertSocketUser(socket, userId)) return;
    socket.to(`group:${groupId}`).emit("user-typing", {
      groupId,
      userId,
      userName,
      isTyping: true,
    });
  });

  socket.on("typing-stop", ({ groupId, userId }) => {
    if (!assertSocketUser(socket, userId)) return;
    socket.to(`group:${groupId}`).emit("user-typing", {
      groupId,
      userId,
      isTyping: false,
    });
  });
}

export function initSocket(httpServer) {
  io = createSocketServer(httpServer, {
    registerChatHandlers,
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized. Call initSocket() first.");
  }
  return io;
}



/**
 * Direct access to the presence manager (for controllers).
 */
export { presenceManager };
