import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AdminActivityLog from "../models/AdminActivityLog.js";

export const adminProtectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in adminProtectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logAdminActivity = async (req, action, description, targetId = null, targetType = null, metadata = {}) => {
  try {
    if (!req.user || req.user.role !== "admin") return;

    await AdminActivityLog.create({
      adminId: req.user._id,
      action,
      targetId,
      targetType,
      description,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent") || "Unknown",
      metadata,
    });
  } catch (error) {
    console.error("Error logging admin activity:", error);
  }
};

export const requireAdminRole = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};
