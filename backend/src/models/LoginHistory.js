import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failed", "locked"],
      required: true,
    },
    failureReason: {
      type: String, // e.g., "invalid_password", "unknown_user"
    },
  },
  { timestamps: true }
);

// Optimize retrieval of login history for a specific user
loginHistorySchema.index({ userId: 1, createdAt: -1 });
loginHistorySchema.index({ ipAddress: 1, createdAt: -1 }); // Useful for detecting brute force from IP

const LoginHistory = mongoose.model("LoginHistory", loginHistorySchema);

export default LoginHistory;
