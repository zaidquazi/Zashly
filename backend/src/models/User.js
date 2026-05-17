import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    chatWallpaper: {
      type: String,
      default: "", // URL or preset color
    },
    privacySettings: {
      lastSeen: { type: String, enum: ["everyone", "friends", "nobody"], default: "everyone" },
      readReceipts: { type: Boolean, default: true },
    },
    
    isOnline: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "developer", "admin"],
      default: "user",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    isShadowBanned: { 
      type: Boolean, 
      default: false 
    },
    strikes: { 
      type: Number, 
      default: 0 
    },
    activityScore: { 
      type: Number, 
      default: 100 
    },
    restrictions: {
      canMessage: { type: Boolean, default: true },
      canUploadMedia: { type: Boolean, default: true }
    },
    security: {
      lastIp: String,
      lastDevice: String,
      geoCountry: String,
      loginAttempts: { type: Number, default: 0 }
    },
    subscription: {
      tier: { type: String, enum: ['free', 'premium'], default: 'free' },
      expiresAt: Date
    }
  },
  { timestamps: true }
);

// Password hashing before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password match method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;