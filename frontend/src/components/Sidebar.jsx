import { useState } from "react";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  HomeIcon,
  ShipWheelIcon,
  UsersIcon,
  MenuIcon,
  XIcon,
  SettingsIcon,
  ChevronUpIcon,
  UserIcon,
} from "lucide-react";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* 📱 Mobile menu button */}
      <button
        className="lg:hidden fixed top-2 left-3 z-50 btn btn-square btn-ghost"
        onClick={toggleSidebar}
      >
        {isOpen ? <XIcon className="size-0" /> : <MenuIcon className="size-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40
          w-48 h-screen bg-base-200 border-r border-base-300 flex flex-col
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-base-300 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              Zashly
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/"
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
              currentPath === "/" ? "btn-active" : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            <HomeIcon className="size-5 text-base-content opacity-70" />
            <span>Home</span>
          </Link>

          <Link
            to="/friends"
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
              currentPath === "/friends" ? "btn-active" : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            <UsersIcon className="size-5 text-base-content opacity-70" />
            <span>Friends</span>
          </Link>

          <Link
            to="/notifications"
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
              currentPath === "/notifications" ? "btn-active" : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            <BellIcon className="size-5 text-base-content opacity-70" />
            <span>Notifications</span>
          </Link>
        </nav>

        {/* User Profile Section with Dropdown */}
        <div className="p-4 border-t border-base-300 mt-auto">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-base-300 rounded-lg p-2 transition-colors"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img
                  src={authUser?.profilePic || "/default-avatar.png"}
                  alt="User Avatar"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{authUser?.fullName}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="size-2 rounded-full bg-success inline-block" />
                Online
              </p>
            </div>
            <ChevronUpIcon
              className={`size-4 transition-transform ${
                isProfileDropdownOpen ? "" : "rotate-180"
              }`}
            />
          </div>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="mt-2 space-y-1">
              <Link
                to="/edit-profile"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case btn-sm ${
                  currentPath === "/edit-profile" ? "btn-active" : ""
                }`}
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setIsOpen(false);
                }}
              >
                <UserIcon className="size-4 text-base-content opacity-70" />
                <span>Edit Profile</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
