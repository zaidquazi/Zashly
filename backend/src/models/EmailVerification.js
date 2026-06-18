/**
 * Email verification & OTP records — supports verify-email and optional 2FA OTP flows.
 */
import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["email_verify", "login_otp", "password_reset"],
      default: "email_verify",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    usedAt: Date,
  },
  { timestamps: true }
);

const EmailVerification = mongoose.model("EmailVerification", emailVerificationSchema);
export default EmailVerification;
