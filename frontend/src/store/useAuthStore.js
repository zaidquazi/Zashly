import { create } from "zustand";
import { login as loginApi, logout as logoutApi } from "../lib/api";
import toast from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isLoading: false,

  login: async (loginData) => {
    try {
      set({ isLoading: true });
      const response = await loginApi(loginData);
      
      if (response.success) {
        set({ authUser: response.user });
        toast.success("Logged in successfully");
        return true;
      } else {
        toast.error(response.message || "Login failed");
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await logoutApi();
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      set({ authUser: null });
    }
  },

  setAuthUser: (user) => set({ authUser: user }),
}));
