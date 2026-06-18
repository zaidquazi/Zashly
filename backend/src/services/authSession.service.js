/**
 * Auth session service — issue/revoke refresh tokens, cookies, logout-all-devices.
 */
import { v4 as uuidv4 } from "uuid";
import UserSession from "../models/UserSession.js";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
} from "../utils/security/tokens.util.js";
import {
  accessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  clearAuthCookies,
} from "../config/security/cookie.config.js";
import { validateEnv } from "../config/security/env.config.js";

const env = validateEnv();

export function setAuthCookies(res, user, rememberMe = false) {
  const sessionId = uuidv4();
  const refreshJwt = signRefreshToken(user, sessionId);
  const accessJwt = signAccessToken(user);

  res.cookie("jwt", accessJwt, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshJwt, getRefreshTokenCookieOptions(rememberMe));

  return { sessionId, refreshJwt, accessJwt };
}

export async function persistRefreshSession(user, sessionId, refreshJwt, meta, rememberMe = false) {
  const expiresMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  await UserSession.create({
    user: user._id,
    sessionId,
    tokenHash: hashToken(refreshJwt),
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + expiresMs),
  });
}

export async function revokeAllSessions(userId) {
  await UserSession.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}

export async function revokeSession(sessionId) {
  await UserSession.findOneAndUpdate(
    { sessionId },
    { revokedAt: new Date() }
  );
}

export function clearSessionCookies(res) {
  clearAuthCookies(res);
}

export function toSafeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
}
