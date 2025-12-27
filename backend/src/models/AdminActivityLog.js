import mongoose from "mongoose";

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "USER_VIEW",
        "USER_EDIT",
        "USER_BAN",
        "USER_UNBAN",
        "USER_DELETE",
        "CONTENT_MODERATE",
        "CONTENT_DELETE",
        "REPORT_REVIEW",
        "SYSTEM_SETTING_CHANGE",
        "ROLE_CHANGE",
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetType: {
      type: String,
      enum: ["User", "Moment", "Report", "SystemSetting"],
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const AdminActivityLog = mongoose.model("AdminActivityLog", adminActivityLogSchema);
export default AdminActivityLog;
