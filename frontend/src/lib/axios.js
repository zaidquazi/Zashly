import axios from "axios";

// API base URL - use environment variable or fallback to localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5002/api";

// Create a single axios instance
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
  headers: {
    "Content-Type": "application/json",
  },
});
