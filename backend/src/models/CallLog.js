import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callerName: {
      type: String,
      default: "",
    },
    callerPic: {
      type: String,
      default: "",
    },
    callType: {
      type: String,
      enum: ["voice", "video"],
      default: "video",
    },
    type: {
      type: String,
      enum: ["one-on-one", "group"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // This will be either a User ID or a Group ID depending on the type
    },
    targetName: {
      type: String,
      default: "",
    },
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["ringing", "answered", "missed", "declined", "ended"],
      default: "ringing",
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const CallLog = mongoose.model("CallLog", callLogSchema);

export default CallLog;
