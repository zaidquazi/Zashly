/**
 * Refresh token sessions — hashed at rest, revocable per device or globally.
 */
import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    userAgent: String,
    ip: String,
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    revokedAt: Date,
  },
  { timestamps: true }
);

refreshTokenSchema.index({ user: 1, revokedAt: 1 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
