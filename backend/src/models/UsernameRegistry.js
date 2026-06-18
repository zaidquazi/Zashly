import mongoose from "mongoose";

const usernameRegistrySchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    usernameLowerCase: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Null if reserved/blocked generally, but required if active
    },
    status: {
      type: String,
      enum: ["active", "reserved", "protected", "blocked", "released"],
      default: "active",
      required: true,
    },
    ownershipStartedAt: {
      type: Date,
      default: Date.now,
    },
    reservedUntil: {
      type: Date,
      default: null, // Used if status is 'reserved' (e.g. 30 days lock)
    },
    isProtected: {
      type: Boolean,
      default: false, // True for verified users or core system accounts
    },
  },
  { timestamps: true }
);

// Indexes for sub-100ms lookups
usernameRegistrySchema.index({ ownerId: 1 });
usernameRegistrySchema.index({ status: 1 });
usernameRegistrySchema.index({ reservedUntil: 1 });

const UsernameRegistry = mongoose.model("UsernameRegistry", usernameRegistrySchema);

export default UsernameRegistry;
