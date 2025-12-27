import express from "express";
import SystemSetting from "../models/SystemSetting.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import User from "../models/User.js";
import { adminProtectRoute, logAdminActivity } from "../middleware/admin.middleware.js";

const router = express.Router();

// Get system settings
router.get("/settings", adminProtectRoute, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = {};
    if (category && category !== "all") {
      query.category = category;
    }

    const settings = await SystemSetting.find(query).sort({ category: 1, key: 1 });

    await logAdminActivity(req, "SYSTEM_SETTING_CHANGE", "Viewed system settings");

    res.json(settings);
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update system setting
router.put("/settings/:settingId", adminProtectRoute, async (req, res) => {
  try {
    const { settingId } = req.params;
    const { value } = req.body;

    const setting = await SystemSetting.findById(settingId);
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    const oldValue = setting.value;
    setting.value = value;
    setting.updatedBy = req.user._id;
    await setting.save();

    await logAdminActivity(
      req, 
      "SYSTEM_SETTING_CHANGE", 
      `Updated setting ${setting.key}`, 
      settingId, 
      "SystemSetting", 
      { oldValue, newValue: value }
    );

    res.json({ message: "Setting updated successfully", setting });
  } catch (error) {
    console.error("Error updating system setting:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get analytics data
router.get("/analytics", adminProtectRoute, async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    
    let days = 30;
    if (period === "7d") days = 7;
    else if (period === "90d") days = 90;
    else if (period === "1y") days = 365;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      contentGrowth,
      reportStats,
      activityStats,
      topReporters
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Content growth over time (if Moment model exists)
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Report statistics
      AdminActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 }
          }
        }
      ]),
      // Activity statistics
      AdminActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Top reporters
      AdminActivityLog.aggregate([
        { $match: { action: "REPORT_REVIEW", createdAt: { $gte: startDate } } },
        { $group: { _id: "$adminId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { count: 1, "user.fullName": 1, "user.email": 1 } }
      ])
    ]);

    await logAdminActivity(req, "SYSTEM_SETTING_CHANGE", `Viewed analytics (${period})`);

    res.json({
      userGrowth,
      contentGrowth,
      reportStats,
      activityStats,
      topReporters,
      period
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get admin activity logs
router.get("/activity-logs", adminProtectRoute, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, adminId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (action && action !== "all") {
      query.action = action;
    }
    
    if (adminId) {
      query.adminId = adminId;
    }

    const logs = await AdminActivityLog.find(query)
      .populate("adminId", "fullName email")
      .populate("targetId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminActivityLog.countDocuments(query);

    await logAdminActivity(req, "SYSTEM_SETTING_CHANGE", `Viewed activity logs (page ${page})`);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
