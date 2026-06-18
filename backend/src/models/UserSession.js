import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
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
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // Auto-delete expired sessions (TTL can be used or manual query)
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index to quickly find active sessions for a user
userSessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

const UserSession = mongoose.model("UserSession", userSessionSchema);

export default UserSession;
