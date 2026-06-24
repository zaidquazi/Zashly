import axios from "axios";
import { getApiBaseUrl } from "./platform";

const BASE_URL = getApiBaseUrl();

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
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

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("zashly_access_token");
  const refreshToken = localStorage.getItem("zashly_refresh_token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (refreshToken) {
    config.headers["x-refresh-token"] = refreshToken;
  }
  
  return config;
});

/**
 * Auto-refresh access token on 401 TOKEN_EXPIRED — CSRF-safe (cookie-only auth).
 */
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data?.accessToken) {
      localStorage.setItem("zashly_access_token", response.data.accessToken);
    }
    if (response.data?.refreshToken) {
      localStorage.setItem("zashly_refresh_token", response.data.refreshToken);
    }
    
    if (response.config.url?.includes("/auth/logout")) {
      localStorage.removeItem("zashly_access_token");
      localStorage.removeItem("zashly_refresh_token");
    }
    
    return response;
  },
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
        localStorage.removeItem("zashly_access_token");
        localStorage.removeItem("zashly_refresh_token");
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
