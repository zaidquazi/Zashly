import express from "express";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Moment from "../models/Moment.js";
import { adminProtectRoute, logAdminActivity } from "../middleware/admin.middleware.js";

const router = express.Router();

// Get all reports with filtering
router.get("/reports", adminProtectRoute, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      reason,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    
    if (reason && reason !== "all") {
      query.reason = reason;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const reports = await Report.find(query)
      .populate("reporterId", "fullName email profilePic")
      .populate("reportedUserId", "fullName email profilePic")
      .populate("reviewedBy", "fullName email")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    await logAdminActivity(req, "REPORT_REVIEW", `Viewed reports list (page ${page})`);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get report details
router.get("/reports/:reportId", adminProtectRoute, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate("reporterId", "fullName email profilePic")
      .populate("reportedUserId", "fullName email profilePic")
      .populate("reviewedBy", "fullName email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Get reported content details
    let reportedContent = null;
    if (report.reportedContentType === "Moment") {
      reportedContent = await Moment.findById(report.reportedContentId);
    }

    await logAdminActivity(req, "REPORT_REVIEW", `Viewed report details`, reportId, "Report");

    res.json({ report, reportedContent });
  } catch (error) {
    console.error("Error fetching report details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update report status and take action
router.put("/reports/:reportId", adminProtectRoute, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, actionTaken, adminNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const oldStatus = report.status;
    report.status = status;
    report.actionTaken = actionTaken || "NONE";
    report.adminNotes = adminNotes || "";
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    // Take additional actions based on actionTaken
    if (actionTaken === "USER_BANNED") {
      await User.findByIdAndUpdate(report.reportedUserId, { 
        isBanned: true, 
        banReason: "Banned due to report violation" 
      });
    } else if (actionTaken === "CONTENT_REMOVED" && report.reportedContentType === "Moment") {
      await Moment.findByIdAndUpdate(report.reportedContentId, { 
        isHidden: true,
        hiddenReason: "Hidden due to report violation"
      });
    }

    await logAdminActivity(
      req, 
      "REPORT_REVIEW", 
      `Updated report status from ${oldStatus} to ${status}`, 
      reportId, 
      "Report", 
      { actionTaken, adminNotes }
    );

    res.json({ message: "Report updated successfully", report });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get content moderation data
router.get("/content", adminProtectRoute, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status === "hidden") {
      query.isHidden = true;
    } else if (status === "reported") {
      // Get moments that have reports
      const reportedMomentIds = await Report.distinct("reportedContentId", {
        reportedContentType: "Moment",
        status: { $in: ["PENDING", "UNDER_REVIEW"] }
      });
      query._id = { $in: reportedMomentIds };
    }

    const moments = await Moment.find(query)
      .populate("userId", "fullName email profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Moment.countDocuments(query);

    await logAdminActivity(req, "CONTENT_MODERATE", `Viewed content moderation list (page ${page})`);

    res.json({
      content: moments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching content for moderation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Hide/unhide content
router.put("/content/:contentId/hide", adminProtectRoute, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { hidden, reason } = req.body;

    const moment = await Moment.findById(contentId);
    if (!moment) {
      return res.status(404).json({ message: "Content not found" });
    }

    moment.isHidden = hidden;
    moment.hiddenReason = hidden ? reason : null;
    await moment.save();

    await logAdminActivity(
      req, 
      "CONTENT_MODERATE", 
      `${hidden ? "Hidden" : "Unhidden"} content`, 
      contentId, 
      "Moment", 
      { reason }
    );

    res.json({ message: `Content ${hidden ? "hidden" : "unhidden"} successfully` });
  } catch (error) {
    console.error("Error updating content visibility:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete content
router.delete("/content/:contentId", adminProtectRoute, async (req, res) => {
  try {
    const { contentId } = req.params;

    const moment = await Moment.findByIdAndDelete(contentId);
    if (!moment) {
      return res.status(404).json({ message: "Content not found" });
    }

    await logAdminActivity(req, "CONTENT_DELETE", "Deleted content", contentId, "Moment");

    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
