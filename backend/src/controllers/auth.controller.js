import logger from "../monitoring/logger.js";
import { upsertStreamUser } from "../lib/stream.js";
import { checkUsernameAvailability, claimUsername, releaseUsername } from "../services/username.service.js";
import User from "../models/User.js";
import AccountRecovery from "../models/AccountRecovery.js";
import LoginHistory from "../models/LoginHistory.js";
import UserSession from "../models/UserSession.js";
import EmailVerification from "../models/EmailVerification.js";
import { validateEnv } from "../config/security/env.config.js";
import { getClientIp, getUserAgent } from "../utils/security/client.util.js";
import { sanitizeText } from "../utils/security/sanitize.util.js";
import {
  verifyRefreshToken,
  signAccessToken,
  hashToken,
  generateOtp,
  hashOtp,
} from "../utils/security/tokens.util.js";
import {
  setAuthCookies,
  persistRefreshSession,
  revokeAllSessions,
  revokeSession,
  clearSessionCookies,
  toSafeUser,
} from "../services/authSession.service.js";
import { accessTokenCookieOptions } from "../config/security/cookie.config.js";
import {
  logFailedLogin,
  logAccountLock,
  logSecurityEvent,
} from "../monitoring/logger.js";
import jwt from "jsonwebtoken";

const env = validateEnv();
const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS) || 10;
const LOCK_MINUTES = Number(process.env.ACCOUNT_LOCK_MINUTES) || 15;

async function completeAuthResponse(req, res, user, statusCode = 200, rememberMe = false) {
  const meta = { ip: getClientIp(req), userAgent: getUserAgent(req) };
  const { sessionId, refreshJwt, accessJwt } = setAuthCookies(res, user, rememberMe);
  await persistRefreshSession(user, sessionId, refreshJwt, meta, rememberMe);

  user.security = user.security || {};
  user.security.lastIp = meta.ip;
  user.security.lastDevice = meta.userAgent;
  await user.save();

  return res.status(statusCode).json({ 
    success: true, 
    user: toSafeUser(user),
    accessToken: accessJwt,
    refreshToken: refreshJwt
  });
}

export async function signup(req, res) {
  const { username, password } = req.body;

  try {
    const availability = await checkUsernameAvailability(username);
    if (!availability.available) {
      return res.status(400).json({ message: availability.message });
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://picsum.photos/seed/user${idx}/200/200.jpg`;

    const newUser = await User.create({
      username: username,
      password,
      profilePic: randomAvatar,
      isVerified: env.ENABLE_EMAIL_VERIFICATION !== "true",
    });

    await claimUsername(username, newUser._id);

    if (env.ENABLE_EMAIL_VERIFICATION === "true") {
      const otp = generateOtp();
      await EmailVerification.create({
        user: newUser._id,
        otpHash: hashOtp(otp),
        purpose: "email_verify",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      // Production: send via SendGrid/SES — never log OTP in production
      if (env.isDevelopment) {
        console.log(`[DEV] Email verification OTP for ${newUser.username}: ${otp}`);
      }
    }

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
    } catch {
      /* non-fatal */
    }

    await completeAuthResponse(req, res, newUser, 201);
  } catch (error) {
    logger.error("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { username, password, rememberMe } = req.body;
    const ip = getClientIp(req);

    let userQuery = { username: username.toLowerCase() };
    
    const user = await User.findOne(userQuery).select("+password");
    
    if (!user) {
      logFailedLogin(username, ip, "unknown_user");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Account suspended" });
    }

    if (user.isLocked()) {
      logSecurityEvent("LOGIN_WHILE_LOCKED", { ip, userId: user._id });
      return res.status(423).json({
        message: `Account locked. Try again after ${LOCK_MINUTES} minutes.`,
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      await user.registerFailedLogin(MAX_ATTEMPTS, LOCK_MINUTES);
      logFailedLogin(username, ip, "bad_password");
      
      await LoginHistory.create({
        userId: user._id,
        ipAddress: ip,
        userAgent: req.headers["user-agent"],
        status: "failed",
        failureReason: "invalid_password"
      });

      const locked = await User.findById(user._id).select("lockUntil");
      if (locked?.isLocked?.() || (locked?.lockUntil && locked.lockUntil > Date.now())) {
        logAccountLock(username, ip);
      }
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await user.resetFailedLogins();
    
    await LoginHistory.create({
      userId: user._id,
      ipAddress: ip,
      userAgent: req.headers["user-agent"],
      status: "success",
    });
    const publicUser = await User.findById(user._id);
    await completeAuthResponse(req, res, publicUser, 200, rememberMe);
  } catch (error) {
    logger.error("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function refreshAccessToken(req, res) {
  try {
    const refreshCookie = req.cookies?.refreshToken || req.headers['x-refresh-token'];
    if (!refreshCookie) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshCookie);
    const user = await User.findById(decoded.userId);
    if (!user || user.isBanned) {
      clearSessionCookies(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      clearSessionCookies(res);
      return res.status(401).json({ message: "Session revoked" });
    }

    const session = await UserSession.findOne({
      sessionId: decoded.sessionId,
      user: user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      clearSessionCookies(res);
      return res.status(401).json({ message: "Invalid session" });
    }

    if (session.tokenHash !== hashToken(refreshCookie)) {
      clearSessionCookies(res);
      await revokeSession(decoded.sessionId);
      return res.status(401).json({ message: "Invalid session" });
    }

    // Fixed: Do NOT rotate refresh token on every request to prevent race conditions 
    // across multiple tabs that cause forced re-logins.
    const accessJwt = signAccessToken(user);
    
    res.cookie("jwt", accessJwt, accessTokenCookieOptions);
    
    return res.status(200).json({ 
      success: true, 
      user: toSafeUser(user),
      accessToken: accessJwt,
      refreshToken: refreshCookie
    });
  } catch (error) {
    clearSessionCookies(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

export function logout(req, res) {
  const token = req.cookies?.refreshToken || req.headers['x-refresh-token'];
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded?.sessionId) {
        revokeSession(decoded.sessionId).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }
  clearSessionCookies(res);
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function logoutAllDevices(req, res) {
  try {
    const userId = req.user._id;
    await revokeAllSessions(userId);
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    clearSessionCookies(res);
    res.status(200).json({ success: true, message: "Logged out from all devices" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(req, res) {
  try {
    const sessions = await UserSession.find({
      user: req.user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .select("userAgent ip createdAt expiresAt sessionId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { otp } = req.body;
    const record = await EmailVerification.findOne({
      user: req.user._id,
      purpose: "email_verify",
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record || record.otpHash !== hashOtp(otp)) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    record.usedAt = new Date();
    await record.save();
    await User.findByIdAndUpdate(req.user._id, { isVerified: true });

    res.json({ success: true, message: "Email verified" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, username, dateOfBirth, gender, bio, location, profilePic, nativeLanguage, learningLanguage } =
      req.body;

    if (!fullName || !username) {
      return res.status(400).json({
        message: "Full name and username are required"
      });
    }

    if (username) {
      const user = await User.findById(userId);
      if (user.usernameLowerCase !== username.toLowerCase()) {
        const availability = await checkUsernameAvailability(username);
        if (!availability.available) {
          return res.status(400).json({ message: availability.message });
        }
        await releaseUsername(user.username, user.isVerified, userId);
        await claimUsername(username, userId);
      }
    }

    // Whitelist only — prevents role/password escalation via ...req.body (HIGH-RISK fix)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName: sanitizeText(fullName, 100),
        username: username,
        usernameLowerCase: username.toLowerCase(),
        ...(bio && { bio: sanitizeText(bio, 500) }),
        ...(location && { location: sanitizeText(location, 120) }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(gender && { gender }),
        ...(profilePic !== undefined && { profilePic }),
        ...(nativeLanguage !== undefined && {
          nativeLanguage: sanitizeText(nativeLanguage, 50),
        }),
        ...(learningLanguage !== undefined && {
          learningLanguage: sanitizeText(learningLanguage, 50),
        }),
        isOnboarded: true,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
    } catch {
      /* non-fatal */
    }

    res.status(200).json({ success: true, user: toSafeUser(updatedUser) });
  } catch (error) {
    logger.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function forgotPasswordRequest(req, res) {
  const { username, isCheck } = req.body;
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User with this username does not exist" });
    }

    if (isCheck) {
      const latestRequest = await AccountRecovery.findOne({ user: user._id }).sort({
        createdAt: -1,
      });
      if (!latestRequest) {
        return res.status(404).json({
          message: "No password reset request found for this username.",
        });
      }

      if (
        latestRequest.status === "approved" &&
        latestRequest.tokenExpiresAt &&
        latestRequest.tokenExpiresAt < new Date()
      ) {
        latestRequest.status = "rejected";
        await latestRequest.save();
      }

      let statusMsg = "Your request status has been updated.";
      if (latestRequest.status === "pending") {
        statusMsg =
          "Your password reset appeal is pending admin approval. Please check back later.";
      } else if (latestRequest.status === "approved") {
        statusMsg = "Your appeal has been approved! You can now set your new password.";
      } else if (latestRequest.status === "rejected") {
        statusMsg =
          "Unfortunately, your password reset appeal was rejected by the administrator.";
      } else if (latestRequest.status === "completed") {
        statusMsg = "This appeal has already been resolved and password reset successfully.";
      }

      return res.status(200).json({ request: latestRequest, message: statusMsg });
    }

    const activeRequest = await AccountRecovery.findOne({
      user: user._id,
      status: { $in: ["pending", "approved"] },
    });

    if (activeRequest) {
      if (activeRequest.status === "pending") {
        return res.status(200).json({
          request: activeRequest,
          message:
            "Your password reset appeal is pending admin approval. Please check back later.",
        });
      }

      if (activeRequest.status === "approved") {
        if (activeRequest.tokenExpiresAt && activeRequest.tokenExpiresAt < new Date()) {
          activeRequest.status = "rejected";
          await activeRequest.save();
        } else {
          return res.status(200).json({
            request: activeRequest,
            message: "Your appeal has been approved! You can now set your new password.",
          });
        }
      }
    }

    const newRequest = await AccountRecovery.create({
      user: user._id,
      status: "pending",
    });

    return res.status(201).json({
      request: newRequest,
      message:
        "Password reset appeal submitted successfully to the administrator! Please wait for admin approval.",
    });
  } catch (error) {
    logger.error("Error in forgotPasswordRequest:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resetPassword(req, res) {
  const { username, resetToken, newPassword } = req.body;
  try {
    const activeRequest = await AccountRecovery.findOne({
      resetToken,
      status: "approved",
      tokenExpiresAt: { $gt: new Date() },
    }).populate("user");

    if (!activeRequest || !activeRequest.user) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please request approval again.",
      });
    }

    const user = activeRequest.user;
    if (username && user.username.toLowerCase() !== username.toLowerCase()) {
      return res.status(400).json({ message: "Username mismatch for this reset token." });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await revokeAllSessions(user._id);

    activeRequest.status = "completed";
    await activeRequest.save();

    logSecurityEvent("PASSWORD_RESET_COMPLETED", { userId: user._id });

    return res.status(200).json({
      message: "Password reset successfully! You can now log in.",
    });
  } catch (error) {
    logger.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
