import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      minlength: [2, "Group name must be at least 2 characters"],
      maxlength: [50, "Group name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    avatar: {
      type: String,
      default: "",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pendingMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    settings: {
      sendMessages: {
        type: String,
        enum: ["all", "admins"],
        default: "all",
      },
      editInfo: {
        type: String,
        enum: ["all", "admins"],
        default: "all",
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup of groups a user belongs to
groupSchema.index({ members: 1 });

// Index for admin queries
groupSchema.index({ admin: 1 });
groupSchema.index({ admins: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
