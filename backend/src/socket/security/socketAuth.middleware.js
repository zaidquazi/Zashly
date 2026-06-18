/**
 * Socket.IO JWT authentication — verifies cookie before connection (prevents fake users).
 */
import jwt from "jsonwebtoken";
import logger from "../../monitoring/logger.js";

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}
import User from "../../models/User.js";
import Blacklist from "../../models/Blacklist.js";
import { validateEnv } from "../../config/security/env.config.js";

const env = validateEnv();

function parseJwtFromHandshake(socket) {
  const raw = socket.handshake.headers.cookie;
  if (!raw) return null;
  const parsed = parseCookies(raw);
  return parsed.jwt || null;
}

export function createSocketAuthMiddleware() {
  return async (socket, next) => {
    const ip =
      socket.handshake.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      socket.handshake.address;

    try {
      const banned = await Blacklist.findOne({ type: "ip", value: ip });
      if (banned) {
        return next(new Error("Access denied"));
      }

      const token =
        parseJwtFromHandshake(socket) || socket.handshake.auth?.token || null;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET);
      } catch (verifyErr) {
        logger.error(`Socket JWT verification failed: ${verifyErr.message || verifyErr}`);
        if (verifyErr.name === "TokenExpiredError") {
          return next(new Error("Session expired — refresh and reconnect"));
        }
        return next(new Error("Invalid or expired session"));
      }
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        logger.error(`Socket connection failed: User not found for ID ${decoded.userId}`);
        return next(new Error("User not found"));
      }
      if (user.isBanned) {
        logger.error(`Socket connection failed: Banned user ${user._id}`);
        return next(new Error("Account suspended"));
      }
      if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
        logger.error(`Socket connection failed: Token version mismatch for user ${user._id} decoded: ${decoded.tokenVersion} db: ${user.tokenVersion}`);
        return next(new Error("Session expired"));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.authenticated = true;
      next();
    } catch (err) {
      logger.error("Socket auth general catch error:", err);
      next(new Error("Invalid or expired session"));
    }
  };
}

/** Ensure socket events cannot impersonate another userId */
export function assertSocketUser(socket, claimedUserId) {
  if (!socket.authenticated || !socket.userId) {
    return false;
  }
  return socket.userId === String(claimedUserId);
}
