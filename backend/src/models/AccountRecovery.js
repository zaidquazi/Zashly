import mongoose from "mongoose";

const accountRecoverySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      required: true,
    },
    resetToken: {
      type: String,
    },
    tokenExpiresAt: {
      type: Date,
    },
    adminApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Fast lookups for active requests
accountRecoverySchema.index({ user: 1, status: 1 });
accountRecoverySchema.index({ resetToken: 1, status: 1 });

const AccountRecovery = mongoose.model("AccountRecovery", accountRecoverySchema);

export default AccountRecovery;
