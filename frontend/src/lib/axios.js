import axios from "axios";

const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
let envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

if (envApiUrl.includes("localhost") && currentHost !== "localhost") {
  envApiUrl = envApiUrl.replace("localhost", currentHost);
}

const BASE_URL = envApiUrl ? `${envApiUrl}/api` : `/api`;

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // httpOnly cookies — never store JWT in localStorage
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

let isRefreshing = false;
let refreshQueue = [];
let activeRefreshPromise = null;

export const executeTokenRefresh = () => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const response = await axiosInstance.post("/auth/refresh");
      return response.data;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
};

function processQueue(error) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  refreshQueue = [];
}

/**
 * Auto-refresh access token on 401 TOKEN_EXPIRED — CSRF-safe (cookie-only auth).
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (
      status === 401 &&
      (code === "TOKEN_EXPIRED" || code === "MISSING_TOKEN") &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => axiosInstance(original));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await executeTokenRefresh();
        processQueue(null);
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError);
        // Do NOT force window.location.href here. 
        // Returning the rejected promise allows useQuery to naturally return null,
        // and App.jsx handles the soft <Navigate /> redirect, preventing a jarring reload.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
