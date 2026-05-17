import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowNewRegistrations: {
      type: Boolean,
      default: true,
    },
    maxGroupSize: {
      type: Number,
      default: 100,
    },
    fileSizeLimitMB: {
      type: Number,
      default: 25,
    },
    forceUpdateVersion: {
      type: String,
      default: "1.0.0",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const AppConfig = mongoose.model("AppConfig", appConfigSchema);
export default AppConfig;
