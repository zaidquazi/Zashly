import { axiosInstance } from "./axios";

// â”€â”€ Group CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createGroup({ name, description, memberIds }) {
  const res = await axiosInstance.post("/groups", { name, description, memberIds });
  return res.data;
}

export async function getMyGroups() {
  const res = await axiosInstance.get("/groups");
  return res.data;
}

export async function getGroupById(groupId) {
  const res = await axiosInstance.get(`/groups/${groupId}`);
  return res.data;
}

export async function updateGroup(groupId, data) {
  const res = await axiosInstance.put(`/groups/${groupId}`, data);
  return res.data;
}

// â”€â”€ Member management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function addGroupMembers(groupId, memberIds) {
  const res = await axiosInstance.post(`/groups/${groupId}/members`, { memberIds });
  return res.data;
}

export async function removeGroupMember(groupId, userId) {
  const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
  return res.data;
}


export async function deleteGroupMessage(groupId, messageId) {
  const res = await axiosInstance.delete(`/groups/${groupId}/messages/${messageId}`);
  return res.data;
}

export async function transferGroupAdmin(groupId, newAdminId) {
  const res = await axiosInstance.put(`/groups/${groupId}/admin`, { newAdminId });
  return res.data;
}

export async function setMemberTags(groupId, userId, tags) {
  const res = await axiosInstance.put(`/groups/${groupId}/members/${userId}/tags`, { tags });
  return res.data;
}