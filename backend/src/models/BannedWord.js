import mongoose from "mongoose";

const bannedWordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, unique: true, lowercase: true, trim: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    action: {
      type: String,
      enum: ["censor", "block", "strike"],
      default: "censor",
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


bannedWordSchema.index({ isActive: 1 });

export default mongoose.model("BannedWord", bannedWordSchema);
