import mongoose from "mongoose";

const accountDeletionRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    reason: {
      type: String,
      maxlength: 500,
      default: "",
    },
    dataDownloadedAt: {
      type: Date,
      default: null,
    },
    confirmationPhrase: {
      type: String,
      required: true,
    },
    requestIp: { type: String, default: null },
    requestUserAgent: { type: String, default: null },
    adminApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminNote: {
      type: String,
      maxlength: 500,
      default: "",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

accountDeletionRequestSchema.index({ user: 1, status: 1 });

const AccountDeletionRequest = mongoose.model(
  "AccountDeletionRequest",
  accountDeletionRequestSchema
);
export default AccountDeletionRequest;
