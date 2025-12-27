import mongoose from "mongoose";

const momentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    durationMs: { type: Number, default: 5000 },
    expiresAt: { type: Date, required: true },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// TTL index to auto-remove after expiresAt
momentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Moment = mongoose.model("Moment", momentSchema);
export default Moment;
