/**
 * JWT access + refresh token issuance and verification.
 * Access tokens are short-lived; refresh tokens are stored hashed in DB.
 */
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validateEnv } from "../../config/security/env.config.js";

const env = validateEnv();

export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateRawRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES || "15m" }
  );
}

export function signRefreshToken(user, sessionId) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      sessionId,
      tokenVersion: user.tokenVersion ?? 0,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES || "7d" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/** Email verification / password reset OTP (6 digits, time-limited) */
export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(otp) {
  return hashToken(otp);
}
