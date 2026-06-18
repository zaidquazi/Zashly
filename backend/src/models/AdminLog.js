import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    details: Object,
    ipAddress: String,
  },
  { timestamps: true }
);

logSchema.index({ createdAt: -1 }, { background: true });

export default mongoose.model("AdminLog", logSchema);
