import { axiosInstance } from "./axios";

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

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
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

// Moments (Stories)
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
