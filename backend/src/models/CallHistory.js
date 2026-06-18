import mongoose from "mongoose";

const callHistorySchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    roomName: {
      type: String,
      required: true,
      index: true,
    },
    callType: {
      type: String,
      enum: ["voice", "video"],
      required: true,
    },
    callMode: {
      type: String,
      enum: ["personal", "group"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "missed", "rejected", "cancelled"],
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
  },
  { timestamps: true }
);

callHistorySchema.index({ callerId: 1, createdAt: -1 });
callHistorySchema.index({ participants: 1, createdAt: -1 });

const CallHistory = mongoose.model("CallHistory", callHistorySchema);
export default CallHistory;
