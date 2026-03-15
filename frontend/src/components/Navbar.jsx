import { Link, useLocation, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  LogOutIcon,
  ShipWheelIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";

// 🧩 Import the search API
import { searchUsers, sendFriendRequest } from "../lib/api";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [requestedIds, setRequestedIds] = useState(new Set());

  // 🧠 Logout popup
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logoutMutation();
    setShowLogoutConfirm(false);
    toast.success("Logged out successfully!");
  };

  // 🔍 Search users (friends + new)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setIsSearching(true);
        const data = await searchUsers(searchTerm);
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(fetchUsers, 400); // debounce for better UX
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSelectUser = (user) => {
    if (user.isFriend) {
      setSearchTerm("");
      setSearchResults([]);
      navigate(`/chat/${user._id}`);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      await sendFriendRequest(userId);
      setRequestedIds((prev) => new Set(prev).add(userId));
      toast.success("Friend request sent");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <>
      <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between w-full">
            {/* LOGO - ONLY IN CHAT PAGE */}
            {isChatPage && (
              <div className="pl-5">
                <Link to="/" className="flex items-center gap-2.5">
                  <ShipWheelIcon className="size-9 text-primary" />
                  <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                    Zashly
                  </span>
                </Link>
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4 ml-auto relative">
              {/* 🔍 Search Bar - Desktop */}
              <div className="relative hidden sm:block w-52 md:w-64">
                <SearchIcon className="absolute left-3 top-2 text-base-content/60 size-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full pl-10 input-sm"
                />

                {/* 🧭 Search Results Dropdown */}
                {searchTerm && searchResults.length > 0 && (
                  <div className="absolute top-9 left-0 w-full bg-base-200 border border-base-300 rounded-lg shadow-md z-50">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 p-2 w-full hover:bg-base-300"
                      >
                        <img
                          src={user.profilePic || "/default-avatar.png"}
                          alt={user.fullName}
                          className="size-8 rounded-full"
                        />
                        <span className="text-sm flex-1 truncate">{user.fullName}</span>
                        {user.isFriend ? (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleSelectUser(user)}
                          >
                            Message
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-xs"
                            disabled={requestedIds.has(user._id)}
                            onClick={() => handleAddFriend(user._id)}
                          >
                            {requestedIds.has(user._id) ? "Requested" : "Add Friend"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 🕓 Loading Indicator */}
                {isSearching && (
                  <div className="absolute top-2 right-3">
                    <span className="loading loading-spinner loading-sm" />
                  </div>
                )}
              </div>

              {/* 🔍 Mobile Search */}
              <button
                className="btn btn-ghost btn-circle sm:hidden"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
              >
                <SearchIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>

              {showMobileSearch && (
                <div className="absolute top-16 left-0 w-full bg-base-200 border-b border-base-300 px-4 py-2 sm:hidden">
                  <div className="relative w-full">
                    <SearchIcon className="absolute left-3 top-3 text-base-content/60 size-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input input-bordered w-full pl-10"
                      autoFocus
                    />
                    {searchTerm && (
                      <XIcon
                        className="absolute right-3 top-3 text-base-content/60 size-4 cursor-pointer"
                        onClick={() => setSearchTerm("")}
                      />
                    )}

                    {/* Mobile Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 bg-base-200 rounded-lg border border-base-300 shadow-md max-h-64 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center gap-3 p-2 w-full hover:bg-base-300"
                          >
                            <img
                              src={user.profilePic || "/default-avatar.png"}
                              alt={user.fullName}
                              className="size-8 rounded-full"
                            />
                            <span className="text-sm flex-1 truncate">{user.fullName}</span>
                            {user.isFriend ? (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => handleSelectUser(user)}
                              >
                                Message
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary btn-xs"
                                disabled={requestedIds.has(user._id)}
                                onClick={() => handleAddFriend(user._id)}
                              >
                                {requestedIds.has(user._id) ? "Requested" : "Add Friend"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 🔔 Notifications */}
              <Link to="/notifications">
                <button className="btn btn-ghost btn-circle">
                  <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                </button>
              </Link>

              <ThemeSelector />

              {/* 👤 Avatar */}
              <div className="avatar">
                <div className="w-9 rounded-full">
                  <img
                    src={authUser?.profilePic || `https://picsum.photos/seed/default-avatar/200/200.jpg`}
                    alt="User Avatar"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* 🚪 Logout */}
              <button
                className="btn btn-ghost btn-circle"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 🧠 Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-base-200 rounded-xl shadow-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold mb-2">Log Out?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="btn btn-sm btn-error text-white"
                onClick={confirmLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Log Out"}
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={logoutMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
