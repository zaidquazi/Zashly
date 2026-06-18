import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "actioned"],
      default: "pending",
    },
    aiToxicityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 }, { background: true });

export default mongoose.model("Report", reportSchema);
