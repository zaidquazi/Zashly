import express from "express";
import {
  login,
  logout,
  onboard,
  signup,
  forgotPasswordRequest,
  resetPassword,
  refreshAccessToken,
  logoutAllDevices,
  getActiveSessions,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/security/validate.middleware.js";
import { asyncHandler } from "../middleware/security/asyncHandler.middleware.js";
import {
  signupSchema,
  loginSchema,
  onboardSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validators/auth.validators.js";
import {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  refreshTokenLimiter,
} from "../middleware/security/rateLimit.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, validate(signupSchema), asyncHandler(signup));
router.post("/login", loginLimiter, validate(loginSchema), asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post(
  "/refresh",
  refreshTokenLimiter,
  asyncHandler(refreshAccessToken)
);
router.post(
  "/forgot-password-request",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(forgotPasswordRequest)
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validate(resetPasswordSchema),
  asyncHandler(resetPassword)
);

router.post("/onboarding", protectRoute, validate(onboardSchema), asyncHandler(onboard));
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
router.post(
  "/verify-email",
  protectRoute,
  validate(verifyEmailSchema),
  asyncHandler(verifyEmail)
);
router.post("/logout-all", protectRoute, asyncHandler(logoutAllDevices));
router.get("/sessions", protectRoute, asyncHandler(getActiveSessions));

export default router;
