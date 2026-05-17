import mongoose from "mongoose";

const blacklistSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["ip", "device"], required: true },
    value: { type: String, required: true, unique: true },
    reason: String,
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Blacklist", blacklistSchema);
