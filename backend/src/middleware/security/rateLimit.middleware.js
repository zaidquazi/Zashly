/**
 * Tiered rate limiting — global API, auth brute-force, uploads, password reset.
 */
import rateLimit from "express-rate-limit";
import { getClientIp } from "../../utils/security/client.util.js";
import { logSecurityEvent } from "../../monitoring/logger.js";

const standardHeaders = { standardHeaders: true, legacyHeaders: false };

/** Global API throttle — prevents DDoS / scraping */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  ...standardHeaders,
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    logSecurityEvent("RATE_LIMIT_GLOBAL", { ip: getClientIp(req), path: req.path });
    res.status(429).json({ message: "Too many requests. Please slow down." });
  },
});

/** Login / signup — brute-force protection */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  ...standardHeaders,
  keyGenerator: (req) => `${getClientIp(req)}:${req.body?.username || ""}`,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logSecurityEvent("RATE_LIMIT_AUTH", { ip: getClientIp(req) });
    res.status(429).json({ message: "Too many authentication attempts. Try again in 15 minutes." });
  },
});

/** Strict login-only limiter (5 per 15 min per IP+email) */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  ...standardHeaders,
  keyGenerator: (req) => `login:${getClientIp(req)}:${req.body?.username || ""}`,
  handler: (req, res) => {
    logSecurityEvent("RATE_LIMIT_LOGIN", { ip: getClientIp(req) });
    res.status(429).json({ message: "Too many login attempts. Account may be locked." });
  },
});

/** Password reset / forgot — prevents enumeration spam */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 7,
  ...standardHeaders,
  keyGenerator: (req) => `reset:${getClientIp(req)}`,
  message: { message: "Too many password reset requests. Try again later." },
});

/** Moment uploads per authenticated user */
export const momentUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  ...standardHeaders,
  keyGenerator: (req) => req.user?._id?.toString() || getClientIp(req),
  message: {
    message: "Too many moments uploaded. Maximum 3 per hour.",
  },
});

/** Token refresh — prevent refresh token grinding */
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  ...standardHeaders,
  keyGenerator: (req) => getClientIp(req),
});
