import { axiosInstance } from "../../../lib/axios";

export async function getCallConfig() {
  const res = await axiosInstance.get("/calls/config");
  return res.data;
}

export async function createCallRoom(payload) {
  const res = await axiosInstance.post("/calls/create-room", payload);
  return res.data;
}

export async function getCallToken({ callId, roomName }) {
  const res = await axiosInstance.post("/calls/token", { callId, roomName });
  return res.data;
}

export async function endCallApi({ callId, roomName }) {
  const res = await axiosInstance.post("/calls/end", { callId, roomName });
  return res.data;
}

export async function getCallHistory({ page = 1, limit = 30 } = {}) {
  const res = await axiosInstance.get("/calls/history", { params: { page, limit } });
  return res.data;
}

export async function getCallById(id) {
  const res = await axiosInstance.get(`/calls/${id}`);
  return res.data;
}

export async function deleteCallRecord(id) {
  const res = await axiosInstance.delete(`/calls/${id}`);
  return res.data;
}

export async function removeParticipantApi({ callId, roomName, participantId }) {
  const res = await axiosInstance.post("/calls/remove-participant", {
    callId,
    roomName,
    participantId,
  });
  return res.data;
}
