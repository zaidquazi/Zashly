import { axiosInstance, executeTokenRefresh } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const logoutAllDevices = async () => {
  const response = await axiosInstance.post("/auth/logout-all");
  return response.data;
};

export const refreshSession = async () => {
  return executeTokenRefresh();
};

export const getActiveSessions = async () => {
  const response = await axiosInstance.get("/auth/sessions");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 401 && import.meta.env.DEV) {
      console.warn(
        "getAuthUser failed:",
        error?.response?.data?.message || error?.message || error
      );
    }
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends", {
    params: { _t: Date.now() },
  });
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function rejectFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/reject`);
  return response.data;
}

export async function removeFriend(userId) {
  const response = await axiosInstance.delete(`/users/friends/${userId}`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}


export const searchUsers = async (query) => {
  const response = await axiosInstance.get("/users/search", {
    params: { query },
  });
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axiosInstance.put("/users/profile", profileData);
  return response.data;
};

export async function getMoments() {
  const res = await axiosInstance.get("/moments");
  return res.data;
}

export async function createMoment({ mediaUrl, type, durationMs }) {
  const res = await axiosInstance.post("/moments", { mediaUrl, type, durationMs });
  return res.data;
}

export async function markMomentViewed(id) {
  const res = await axiosInstance.post(`/moments/${id}/view`);
  return res.data;
}

export async function deleteMoment(id) {
  const res = await axiosInstance.delete(`/moments/${id}`);
  return res.data;
}

export async function getMomentReplies(id) {
  const res = await axiosInstance.get(`/moments/${id}/replies`);
  return res.data;
}

export async function createMomentReply(id, payload) {
  const res = await axiosInstance.post(`/moments/${id}/replies`, payload);
  return res.data;
}

export async function createPoll(data) {
  const res = await axiosInstance.post("/chat/polls", data);
  return res.data;
}

export async function votePoll(pollId, optionIndex) {
  const res = await axiosInstance.post(`/chat/polls/${pollId}/vote`, { optionIndex });
  return res.data;
}

export async function getPoll(pollId) {
  const res = await axiosInstance.get(`/chat/polls/${pollId}`);
  return res.data;
}

export async function blockUser(userId) {
  const res = await axiosInstance.post(`/users/block/${userId}`);
  return res.data;
}

export async function unblockUser(userId) {
  const res = await axiosInstance.post(`/users/unblock/${userId}`);
  return res.data;
}

export async function updateSettings(settingsData) {
  const res = await axiosInstance.put("/users/settings", settingsData);
  return res.data;
}

export async function getBlockedUsers() {
  const res = await axiosInstance.get("/users/blocked");
  return res.data;
}

export async function getNotifications() {
  const res = await axiosInstance.get("/notifications");
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await axiosInstance.put("/notifications/mark-all-read");
  return res.data;
}

export const DELETION_CONFIRM_PHRASE = "DELETE MY ACCOUNT";

export async function getMyDeletionRequest() {
  const res = await axiosInstance.get("/users/me/deletion-request");
  return res.data;
}

export async function downloadMyDataExport() {
  const res = await axiosInstance.get("/users/me/data-export", {
    responseType: "blob",
  });
  return res.data;
}

export async function submitAccountDeletionRequest(payload) {
  const res = await axiosInstance.post("/users/me/deletion-request", payload);
  return res.data;
}

export async function cancelAccountDeletionRequest() {
  const res = await axiosInstance.delete("/users/me/deletion-request");
  return res.data;
}

export async function checkUsernameAvailability(username) {
  const res = await axiosInstance.get("/usernames/availability", {
    params: { q: username }
  });
  return res.data;
}