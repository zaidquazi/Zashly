import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    usernameLowerCase: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer Not To Say", "Custom"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
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
    appSettings: {
      general: {
        enterToSend: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        showLinkPreviews: { type: Boolean, default: true },
        compactChatList: { type: Boolean, default: false },
      },
      notifications: {
        soundEnabled: { type: Boolean, default: true },
        desktopEnabled: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        groups: { type: Boolean, default: true },
        moments: { type: Boolean, default: true },
        friendRequests: { type: Boolean, default: true },
      },
      media: {
        autoDownloadImages: { type: Boolean, default: false },
      },
    },
    
    isOnline: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin", "owner"],
      default: "user",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    verificationStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
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
    /** Increment to invalidate all JWTs / refresh tokens (logout all devices) */
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    security: {
      lastIp: String,
      lastDevice: String,
      geoCountry: String,
      loginAttempts: { type: Number, default: 0 },
    },
    subscription: {
      tier: { type: String, enum: ['free', 'premium'], default: 'free' },
      expiresAt: Date
    }
  },
  { timestamps: true }
);

// Pre-validate hook for username lowercasing to satisfy required check
userSchema.pre("validate", function (next) {
  if (this.isModified("username") && this.username) {
    this.usernameLowerCase = this.username.toLowerCase();
  }
  next();
});

// Pre-save hook for password hashing and username lowercasing
userSchema.pre("save", async function (next) {
  if (this.isModified("username")) {
    this.usernameLowerCase = this.username.toLowerCase();
  }

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

/** Account lock after repeated failed logins */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.registerFailedLogin = async function (maxAttempts, lockMinutes) {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save();
};

userSchema.methods.resetFailedLogins = async function () {
  if (this.failedLoginAttempts || this.lockUntil) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    await this.save();
  }
};

// Never expose password in JSON responses (HIGH-RISK fix)
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.__v;
    return ret;
  },
});

userSchema.set("toObject", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.__v;
    return ret;
  },
});

userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;