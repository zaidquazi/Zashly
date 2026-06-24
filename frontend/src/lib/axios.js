import axios from "axios";
import { getApiBaseUrl } from "./platform";

/**
 * Platform-aware base URL.
 * - Web: "/api" (proxied by Vite dev server) or absolute production URL
 * - Capacitor/Android: absolute URL to backend (required since WebView serves from file://)
 */
const BASE_URL = getApiBaseUrl();

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // httpOnly cookies for web — harmless on native
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

/* ─── Token persistence for Capacitor (WebView can't use httpOnly cookies cross-origin) ── */

const TOKEN_KEY = "zashly_access_token";
const REFRESH_KEY = "zashly_refresh_token";

function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function getStoredRefresh() {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}

function storeTokens(accessToken, refreshToken) {
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch { /* localStorage unavailable — cookies will handle auth */ }
}

function clearTokens() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch { /* safe to ignore */ }
}

/* ─── Request interceptor: attach Bearer token + fix URL resolution ────────────── */

axiosInstance.interceptors.request.use((config) => {
  // Fix for Axios 1.x: When baseURL is an absolute URL with a path (e.g. http://localhost:5002/api)
  // and config.url starts with '/', Axios uses URL resolution which replaces the '/api' path.
  // We manually concatenate them to ensure the '/api' prefix is preserved.
  if (config.baseURL && config.url && config.url.startsWith("/")) {
    config.url = config.baseURL.replace(/\/$/, "") + config.url;
    config.baseURL = ""; // Clear baseURL so Axios uses the fully resolved url
  }

  const token = getStoredToken();
  const refreshToken = getStoredRefresh();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (refreshToken) {
    config.headers["x-refresh-token"] = refreshToken;
  }

  return config;
});

/* ─── Refresh logic ───────────────────────────────────────────────────────────── */

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

/* ─── Response interceptor: persist tokens + auto-refresh on 401 ──────────────── */

axiosInstance.interceptors.response.use(
  (response) => {
    // Persist tokens from auth responses (login, signup, refresh, onboarding)
    if (response.data?.accessToken) {
      storeTokens(response.data.accessToken, response.data.refreshToken);
    }

    // Clear tokens on logout
    if (response.config.url?.includes("/auth/logout")) {
      clearTokens();
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
        clearTokens();
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
