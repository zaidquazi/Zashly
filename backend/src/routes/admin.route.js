import express from "express";
import User from "../models/User.js";
import Moment from "../models/Moment.js";
import Report from "../models/Report.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import SystemSetting from "../models/SystemSetting.js";
import { adminProtectRoute, logAdminActivity } from "../middleware/admin.middleware.js";

const router = express.Router();

// Get dashboard overview stats
router.get("/dashboard", adminProtectRoute, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalMoments,
      pendingReports,
      resolvedReports,
      systemStatus
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Moment.countDocuments(),
      Report.countDocuments({ status: "PENDING" }),
      Report.countDocuments({ status: "RESOLVED" }),
      SystemSetting.findOne({ key: "system_status" })
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      newUsers,
      totalContent: totalMoments,
      pendingReports,
      resolvedReports,
      systemStatus: systemStatus?.value || "healthy"
    };

    await logAdminActivity(req, "DASHBOARD_VIEW", "Viewed admin dashboard");

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get user management data
router.get("/users", adminProtectRoute, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    if (role && role !== "all") {
      query.role = role;
    }
    
    if (status === "active") {
      query.isOnline = true;
    } else if (status === "inactive") {
      query.isOnline = false;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    await logAdminActivity(req, "USER_VIEW", `Viewed users list (page ${page})`);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user role
router.put("/users/:userId/role", adminProtectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "developer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAdminActivity(req, "ROLE_CHANGE", `Changed user role to ${role}`, userId, "User", { newRole: role });

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Ban/Unban user
router.put("/users/:userId/ban", adminProtectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot ban yourself" });
    }

    user.isBanned = banned;
    user.banReason = banned ? reason : null;
    await user.save();

    await logAdminActivity(
      req, 
      banned ? "USER_BAN" : "USER_UNBAN", 
      `${banned ? "Banned" : "Unbanned"} user`, 
      userId, 
      "User", 
      { reason }
    );

    res.json({ message: `User ${banned ? "banned" : "unbanned"} successfully` });
  } catch (error) {
    console.error("Error updating user ban status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Soft delete user
router.delete("/users/:userId", adminProtectRoute, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    await logAdminActivity(req, "USER_DELETE", "Soft deleted user", userId, "User");

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
