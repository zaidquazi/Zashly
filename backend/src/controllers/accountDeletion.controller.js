import logger from "../monitoring/logger.js";
import User from "../models/User.js";
import AccountDeletionRequest from "../models/AccountDeletionRequest.js";
import {
  gatherUserExportData,
  permanentlyDeleteUser,
  DELETION_CONFIRM_PHRASE,
} from "../services/userData.service.js";
import { getClientIp } from "../utils/security/client.util.js";

export async function exportMyData(req, res) {
  try {
    const userId = req.user._id;
    const exportData = await gatherUserExportData(userId);
    if (!exportData) {
      return res.status(404).json({ message: "User not found" });
    }

    const pending = await AccountDeletionRequest.findOne({
      user: userId,
      status: "pending",
    });
    if (pending && !pending.dataDownloadedAt) {
      pending.dataDownloadedAt = new Date();
      await pending.save();
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="zashly-data-export-${userId}.json"`
    );
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    logger.error("exportMyData:", error.message);
    res.status(500).json({ message: "Failed to export data" });
  }
}

export async function getMyDeletionRequest(req, res) {
  try {
    const request = await AccountDeletionRequest.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("adminApprovedBy", "fullName email")
      .lean();

    res.status(200).json({ request: request || null });
  } catch (error) {
    logger.error("getMyDeletionRequest:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function submitDeletionRequest(req, res) {
  try {
    const userId = req.user._id;
    const { password, confirmPhrase, confirmEmail, reason, dataDownloaded } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be deleted through this flow. Contact system owner.",
      });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const validPassword = await user.matchPassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (confirmPhrase?.trim() !== DELETION_CONFIRM_PHRASE) {
      return res.status(400).json({
        message: `Confirmation phrase must be exactly: ${DELETION_CONFIRM_PHRASE}`,
      });
    }

    if (
      !confirmEmail ||
      confirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()
    ) {
      return res.status(400).json({ message: "Email confirmation does not match your account" });
    }

    if (!dataDownloaded) {
      return res.status(400).json({
        message: "You must download your data export before submitting a deletion request",
      });
    }

    const existing = await AccountDeletionRequest.findOne({
      user: userId,
      status: "pending",
    });
    if (existing) {
      return res.status(409).json({
        message: "You already have a pending deletion request",
        request: existing,
      });
    }

    const request = await AccountDeletionRequest.create({
      user: userId,
      status: "pending",
      reason: reason?.trim()?.slice(0, 500) || "",
      confirmationPhrase: confirmPhrase.trim(),
      dataDownloadedAt: new Date(),
      requestIp: getClientIp(req),
      requestUserAgent: req.headers["user-agent"]?.slice(0, 500) || null,
    });

    res.status(201).json({
      message:
        "Deletion request submitted. An administrator must approve it before your account is permanently removed.",
      request,
    });
  } catch (error) {
    logger.error("submitDeletionRequest:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function cancelDeletionRequest(req, res) {
  try {
    const request = await AccountDeletionRequest.findOne({
      user: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "No pending deletion request found" });
    }

    request.status = "cancelled";
    await request.save();

    res.status(200).json({
      message: "Deletion request cancelled. Your account will not be deleted.",
    });
  } catch (error) {
    logger.error("cancelDeletionRequest:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAccountDeletionRequests(req, res) {
  try {
    const requests = await AccountDeletionRequest.find()
      .populate("user", "fullName email profilePic role createdAt")
      .populate("adminApprovedBy", "fullName email")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    logger.error("getAccountDeletionRequests:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function approveAccountDeletion(req, res) {
  try {
    const { requestId } = req.params;
    const adminId = req.user._id;

    const request = await AccountDeletionRequest.findById(requestId).populate(
      "user",
      "fullName email role"
    );
    if (!request) {
      return res.status(404).json({ message: "Deletion request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }
    if (!request.user) {
      return res.status(404).json({ message: "User no longer exists" });
    }
    if (request.user.role === "admin") {
      request.status = "rejected";
      request.adminNote = "Admin accounts cannot be deleted";
      request.adminApprovedBy = adminId;
      await request.save();
      return res.status(400).json({ message: "Cannot delete admin accounts" });
    }

    const targetUserId = request.user._id;
    const result = await permanentlyDeleteUser(targetUserId);
    if (!result.ok) {
      return res.status(400).json({ message: result.error });
    }

    const { logAdminAction } = await import("../lib/adminUtils.js");
    await logAdminAction({
      adminId,
      action: "APPROVE_ACCOUNT_DELETION",
      targetUserId,
      details: {
        userEmail: result.userEmail,
        userName: result.userName,
        eraseSummary: result.summary,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: `Account for ${result.userName} has been permanently deleted`,
      summary: result.summary,
    });
  } catch (error) {
    logger.error("approveAccountDeletion:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectAccountDeletion(req, res) {
  try {
    const { requestId } = req.params;
    const adminId = req.user._id;
    const { adminNote } = req.body || {};

    const request = await AccountDeletionRequest.findById(requestId).populate(
      "user",
      "fullName email"
    );
    if (!request) {
      return res.status(404).json({ message: "Deletion request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    request.status = "rejected";
    request.adminApprovedBy = adminId;
    request.adminNote = adminNote?.trim()?.slice(0, 500) || "";
    await request.save();

    const { logAdminAction } = await import("../lib/adminUtils.js");
    await logAdminAction({
      adminId,
      action: "REJECT_ACCOUNT_DELETION",
      targetUserId: request.user?._id,
      details: { userEmail: request.user?.email, adminNote: request.adminNote },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "Account deletion request rejected",
      request,
    });
  } catch (error) {
    logger.error("rejectAccountDeletion:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
