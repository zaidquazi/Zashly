/**
 * JWT route protection — verifies httpOnly cookie, token version, ban status.
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateEnv } from "../config/security/env.config.js";
import logger from "../monitoring/logger.js";

const env = validateEnv();

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      console.log("No token found in cookies:", Object.keys(req.cookies || {}));
      return res.status(401).json({ message: "Unauthorized", code: "MISSING_TOKEN" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Account suspended" });
    }

    if (user.isLocked()) {
      return res.status(423).json({ message: "Account temporarily locked" });
    }

    // Session hijacking mitigation — global logout invalidates tokens
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      console.log("Token version mismatch:", { decodedTV: decoded.tokenVersion, userTV: user.tokenVersion });
      return res.status(401).json({ message: "Session revoked", code: "SESSION_REVOKED" });
    }

    if (env.ENABLE_EMAIL_VERIFICATION === "true" && !user.isVerified) {
      console.log("Email not verified for user:", user._id);
      return res.status(403).json({
        message: "Email verification required",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("protectRoute error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/** Role-based access control */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
