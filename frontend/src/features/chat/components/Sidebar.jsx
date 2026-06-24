import { useState } from "react";
import ProfileAvatar from "./ProfileAvatar";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  HomeIcon,
  UsersIcon,
  MessageSquareIcon,
  PhoneIcon,
  MenuIcon,
  XIcon,
  SettingsIcon,
  ChevronUpIcon,
  UserIcon,
  LogOutIcon,
  ShieldAlertIcon,
} from "lucide-react";
import Logo from "./Logo";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          hidden lg:flex fixed top-0 left-0 z-40
          w-48 h-screen bg-base-200 border-r border-base-300 flex-col
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-base-300 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95">
            <Logo className="size-9 text-primary animate-spin-slow" />
            <span className="font-beacon text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-secondary drop-shadow-sm">
              Zashly
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {authUser?.role !== "admin" && (
            <>
              <Link
                to="/app"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/app" ? "btn-active" : ""
                }`}
              >
                <HomeIcon className="size-5 text-base-content opacity-70" />
                <span>Home</span>
              </Link>

              <Link
                to="/friends"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/friends" ? "btn-active" : ""
                }`}
              >
                <UsersIcon className="size-5 text-base-content opacity-70" />
                <span>Friends</span>
              </Link>

              <Link
                to="/groups"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/groups" ? "btn-active" : ""
                }`}
              >
                <MessageSquareIcon className="size-5 text-base-content opacity-70" />
                <span>Groups</span>
              </Link>

              <Link
                to="/calls"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/calls" ? "btn-active" : ""
                }`}
              >
                <PhoneIcon className="size-5 text-base-content opacity-70" />
                <span>Calls</span>
              </Link>

            </>
          )}

          {/* Admin Panel — only for admins */}
          {authUser?.role === "admin" && (
            <Link
              to="/admin"
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                currentPath === "/admin" ? "btn-active" : ""
              }`}
            >
              <ShieldAlertIcon className="size-5 text-primary opacity-90" />
              <span>Admin</span>
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
