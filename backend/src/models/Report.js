import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedContentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reportedContentType: {
      type: String,
      enum: ["Moment", "User", "Message"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "SPAM",
        "INAPPROPRIATE_CONTENT",
        "HARASSMENT",
        "FAKE_ACCOUNT",
        "VIOLENCE",
        "COPYRIGHT",
        "OTHER",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
      default: "PENDING",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    actionTaken: {
      type: String,
      enum: [
        "NONE",
        "WARNING_SENT",
        "CONTENT_REMOVED",
        "USER_BANNED",
        "USER_SUSPENDED",
        "REPORT_DISMISSED",
      ],
      default: "NONE",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
