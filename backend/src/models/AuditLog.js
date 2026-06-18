import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true, // e.g., "USER_DELETED", "USERNAME_RESERVED", "LOGIN_BLOCKED"
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId, // Could be Admin or System
      ref: "User",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId, // User affected
      ref: "User",
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // flexible JSON for metadata
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
