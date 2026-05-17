import { axiosInstance } from "./axios";

export const initiateCallLog = async (callData) => {
  try {
    const res = await axiosInstance.post("/calls/initiate", callData);
    return res.data;
  } catch (error) {
    console.error("Failed to initiate call log:", error);
    throw error;
  }
};

export const answerCallLog = async (data) => {
  try {
    const res = await axiosInstance.post("/calls/answer", data);
    return res.data;
  } catch (error) {
    console.error("Failed to answer call log:", error);
    throw error;
  }
};

export const endCallLog = async (endData) => {
  try {
    const res = await axiosInstance.post("/calls/end", endData);
    return res.data;
  } catch (error) {
    console.error("Failed to end call log:", error);
    throw error;
  }
};

export const getCallHistory = async (targetId) => {
  try {
    const res = await axiosInstance.get(`/calls/history/${targetId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch call history:", error);
    throw error;
  }
};

export const getAllCallHistory = async () => {
  try {
    const res = await axiosInstance.get("/calls/history");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch all call history:", error);
    throw error;
  }
};

export const deleteCallLog = async (logId) => {
  try {
    const res = await axiosInstance.delete(`/calls/${logId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to delete call log:", error);
    throw error;
  }
};

export const clearCallHistory = async () => {
  try {
    const res = await axiosInstance.delete("/calls/history/clear");
    return res.data;
  } catch (error) {
    console.error("Failed to clear call history:", error);
    throw error;
  }
};

export const checkUserOnline = async (userId) => {
  try {
    const res = await axiosInstance.get(`/calls/check-online/${userId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to check user online:", error);
    return { isOnline: false };
  }
};
