import { axiosInstance } from "./axios";

// â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAdminStats() {
  const res = await axiosInstance.get("/admin/stats");
  return res.data;
}

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAdminUsers({ search = "", page = 1 } = {}) {
  const res = await axiosInstance.get("/admin/users", {
    params: { search, page },
  });
  return res.data;
}

export async function banUser(userId) {
  const res = await axiosInstance.post(`/admin/users/${userId}/ban`);
  return res.data;
}

export async function unbanUser(userId) {
  const res = await axiosInstance.post(`/admin/users/${userId}/unban`);
  return res.data;
}

export async function deleteUser(userId) {
  const res = await axiosInstance.delete(`/admin/users/${userId}`);
  return res.data;
}

// â”€â”€ Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAdminGroups() {
  const res = await axiosInstance.get("/admin/groups", { params: { limit: 100 } });
  return res.data.groups || res.data;
}

export async function deleteGroup(groupId) {
  const res = await axiosInstance.delete(`/admin/groups/${groupId}`);
  return res.data;
}

export async function getGroupMessages(groupId, page = 1) {
  const res = await axiosInstance.get(`/admin/groups/${groupId}/messages`, {
    params: { page },
  });
  return res.data;
}

// â”€â”€ Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function deleteMessage(messageId) {
  const res = await axiosInstance.delete(`/admin/messages/${messageId}`);
  return res.data;
}
export async function toggleShadowBan(userId) {
  const res = await axiosInstance.post(`/admin/users/${userId}/shadow-ban`);
  return res.data;
}

export async function applyStrike(userId, reason) {
  const res = await axiosInstance.post(`/admin/users/${userId}/strike`, { reason });
  return res.data;
}

export async function forceLogout(userId) {
  const res = await axiosInstance.post(`/admin/users/${userId}/logout`);
  return res.data;
}

// â”€â”€ Moderation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAdminReports() {
  const res = await axiosInstance.get("/admin/reports", { params: { limit: 100 } });
  return res.data.reports || res.data;
}

export async function resolveReport(reportId, status) {
  const res = await axiosInstance.post(`/admin/reports/${reportId}/resolve`, { status });
  return res.data;
}

export async function getAdminLogs(page = 1) {
  const res = await axiosInstance.get("/admin/logs", { params: { page } });
  return res.data;
}

// â”€â”€ Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function banIp(ip, reason) {
  const res = await axiosInstance.post("/admin/security/ip-ban", { ip, reason });
  return res.data;
}

// â”€â”€ System Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAppConfig() {
  const res = await axiosInstance.get("/admin/config");
  return res.data;
}

export async function updateAppConfig(data) {
  const res = await axiosInstance.patch("/admin/config", data);
  return res.data;
}

export async function getAnalyticsData(range = "30") {
  const res = await axiosInstance.get("/admin/analytics", { params: { range } });
  return res.data;
}

// ── Password Reset Appeals ──
export async function getPendingPasswordResets() {
  const res = await axiosInstance.get("/admin/password-resets");
  return res.data;
}

export async function approvePasswordReset(requestId) {
  const res = await axiosInstance.post(`/admin/password-resets/${requestId}/approve`);
  return res.data;
}

export async function rejectPasswordReset(requestId) {
  const res = await axiosInstance.post(`/admin/password-resets/${requestId}/reject`);
  return res.data;
}

export async function getAccountDeletionRequests() {
  const res = await axiosInstance.get("/admin/account-deletions");
  return res.data;
}

export async function approveAccountDeletion(requestId) {
  const res = await axiosInstance.post(
    `/admin/account-deletions/${requestId}/approve`
  );
  return res.data;
}

export async function rejectAccountDeletion(requestId, adminNote = "") {
  const res = await axiosInstance.post(
    `/admin/account-deletions/${requestId}/reject`,
    { adminNote }
  );
  return res.data;
}
