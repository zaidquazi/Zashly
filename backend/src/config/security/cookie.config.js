/**
 * Centralized cookie options — httpOnly, secure in production, SameSite against CSRF.
 */
import { validateEnv } from "./env.config.js";

const env = validateEnv();

// Cross-origin deploy (e.g. Render frontend + backend) requires SameSite=None + Secure
const base = {
  httpOnly: true,
  sameSite: env.isProduction ? "none" : "lax",
  secure: env.isProduction,
  path: "/",
};

/** Short-lived access token cookie (JWT) */
export const accessTokenCookieOptions = {
  ...base,
  maxAge: 15 * 60 * 1000, // 15 minutes — matches JWT_ACCESS_EXPIRES default
};

/** Long-lived refresh token — scoped to auth refresh route only */
export function getRefreshTokenCookieOptions(rememberMe = false) {
  return {
    ...base,
    path: "/api/auth",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 days or 1 day
  };
}

export function clearAuthCookies(res) {
  res.clearCookie("jwt", { ...base });
  res.clearCookie("refreshToken", { ...base, path: "/api/auth" });
}
