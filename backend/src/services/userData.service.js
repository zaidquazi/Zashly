import User from "../models/User.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import Moment from "../models/Moment.js";
import MomentReply from "../models/MomentReply.js";
import FriendRequest from "../models/FriendRequest.js";
import Report from "../models/Report.js";
import Spark from "../models/Spark.js";
import SparkComment from "../models/SparkComment.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import Poll from "../models/Poll.js";
import RefreshToken from "../models/RefreshToken.js";
import EmailVerification from "../models/EmailVerification.js";
import AccountRecovery from "../models/AccountRecovery.js";
import AccountDeletionRequest from "../models/AccountDeletionRequest.js";

export const DELETION_CONFIRM_PHRASE = "DELETE MY ACCOUNT";

/** Gather exportable user data (profile + related records).*/
export async function gatherUserExportData(userId) {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) return null;

  const [messages, moments, momentReplies, friendRequests, groups, reports, sparks, notifications] =
    await Promise.all([
      Message.find({ sender: userId }).sort({ createdAt: -1 }).lean(),
      Moment.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      MomentReply.find({ sender: userId }).sort({ createdAt: -1 }).lean(),
      FriendRequest.find({
        $or: [{ sender: userId }, { recipient: userId }],
      }).lean(),
      Group.find({ members: userId }).select("name description createdAt members admins").lean(),
      Report.find({
        $or: [{ reporter: userId }, { reportedUser: userId }],
      }).lean(),
      Spark.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      Notification.find({
        $or: [{ recipient: userId }, { sender: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    messages: { count: messages.length, data: messages },
    moments: { count: moments.length, data: moments },
    momentReplies: { count: momentReplies.length, data: momentReplies },
    friendRequests: { count: friendRequests.length, data: friendRequests },
    groups: { count: groups.length, data: groups },
    reports: { count: reports.length, data: reports },
    sparks: { count: sparks.length, data: sparks },
    notifications: { count: notifications.length, data: notifications },
  };
}

/* Permanently erase a user and all associated data.*/
export async function permanentlyDeleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return { ok: false, error: "User not found" };
  }
  if (user.role === "admin") {
    return { ok: false, error: "Cannot delete an admin account" };
  }

  const userName = user.fullName;
  const id = user._id;

  const results = await Promise.allSettled([
    Message.deleteMany({ sender: id }),
    Moment.deleteMany({ user: id }),
    MomentReply.deleteMany({ sender: id }),
    Spark.deleteMany({ user: id }),
    SparkComment.deleteMany({ user: id }),
    Post.deleteMany({ user: id }),
    Comment.deleteMany({ user: id }),
    FriendRequest.deleteMany({
      $or: [{ sender: id }, { recipient: id }],
    }),
    Report.deleteMany({ $or: [{ reporter: id }, { reportedUser: id }] }),
    Notification.deleteMany({
      $or: [{ recipient: id }, { sender: id }],
    }),
    Poll.deleteMany({ createdBy: id }),
    RefreshToken.deleteMany({ user: id }),
    EmailVerification.deleteMany({ user: id }),
    AccountRecovery.deleteMany({ user: id }),
    AccountDeletionRequest.deleteMany({ user: id }),
    User.updateMany({ friends: id }, { $pull: { friends: id } }),
    User.updateMany({ blockedUsers: id }, { $pull: { blockedUsers: id } }),
    Group.updateMany({ members: id }, { $pull: { members: id, admins: id, pendingMembers: id } }),
    Group.deleteMany({ admin: id }),
    Moment.updateMany({}, { $pull: { viewers: id, likes: id } }),
    Message.updateMany({}, { $pull: { readBy: id } }),
  ]);

  await User.findByIdAndDelete(id);

  const summary = {};
  const labels = [
    "messages","moments",
    "momentReplies",
    "posts",
    "comments",
    "friendRequests",
    "reports",
    "notifications",
    "polls",
    "refreshTokens",
    "emailVerifications",
    "passwordResetRequests",
    "accountDeletionRequests",
    "friendsListCleanup",
    "blockedUsersCleanup",
    "groupMembershipCleanup","ownedGroupsDeleted",
    "momentRefsCleanup","readByCleanup",
  ];
  results.forEach((r, i) => {
    summary[labels[i]] =
      r.status === "fulfilled"
        ? (r.value?.deletedCount ?? r.value?.modifiedCount ?? "done")
        : "error";
  });

  return { ok: true, userName, userEmail: user.email, summary };
}