import mongoose from "mongoose";

const passwordResetRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    resetToken: {
      type: String,
      default: null,
    },
    tokenExpiresAt: {
      type: Date,
      default: null,
    },
    adminApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const PasswordResetRequest = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
export default PasswordResetRequest;
