import { Link, useLocation, useNavigate } from "react-router";
import ProfileAvatar from "./ProfileAvatar";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  ShipWheelIcon,
  SearchIcon,
  XIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronDownIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import useLogout from "../hooks/useLogout";
import ThemeSelector from "./ThemeSelector";
import SearchUserProfile from "./SearchUserProfile";

// 🧩 Import the search API
import { searchUsers, sendFriendRequest } from "../lib/api";

const Navbar = ({ showSidebar }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notifyRef = useRef(null);

  const isChatPage =
    location.pathname?.startsWith("/chat") ||
    (location.pathname?.startsWith("/group") && location.pathname !== "/groups");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { logoutMutation } = useLogout();

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
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

  // 👤 Open full Instagram-style profile for a user
  const handleOpenProfile = (user) => {
    setSelectedProfile(user);
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
  };

  const handleProfileMessage = (user) => {
    setSearchTerm("");
    setSearchResults([]);
    setShowMobileSearch(false);
    navigate(`/chat/${user._id}`);
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
      <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-40 h-16 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between w-full">
            {/* LOGO */}
            <div className={`flex items-center ${showSidebar ? "lg:hidden" : ""}`}>
              <Link to="/" className="flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95">
                <ShipWheelIcon className="size-8 sm:size-9 text-primary animate-spin-slow" />
                <span className="text-2xl sm:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider drop-shadow-sm">
                  Zashly
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 ml-auto relative">
              {/* 🔍 Search Bar - Desktop */}
              <div className="relative hidden md:block w-52 md:w-64">
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
                  <div className="absolute top-9 left-0 w-full bg-base-200 border border-base-300 rounded-lg shadow-md z-50 overflow-hidden">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 p-2 w-full hover:bg-base-300 cursor-pointer transition-colors"
                        onClick={() => handleOpenProfile(user)}
                      >
                        <ProfileAvatar src={user.profilePic} name={user.fullName} size="w-8 h-8" textSize="text-sm" />
                        <span className="text-sm flex-1 truncate">{user.fullName}</span>
                        {user.isFriend ? (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={(e) => { e.stopPropagation(); handleSelectUser(user); }}
                          >
                            Message
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-xs"
                            disabled={requestedIds.has(user._id)}
                            onClick={(e) => { e.stopPropagation(); handleAddFriend(user._id); }}
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

              {/* 🔍 Mobile Search Toggle */}
              <button
                className="btn btn-ghost btn-circle md:hidden"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
              >
                <SearchIcon className="h-5 w-5 text-base-content opacity-70" />
              </button>

              {/* 🔍 Mobile Search Overlay */}
              {showMobileSearch && (
                <div className="fixed inset-0 h-16 bg-base-100 flex items-center px-4 gap-2 z-[60] animate-in slide-in-from-top duration-200 border-b border-base-300 md:hidden">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60 size-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input bg-base-200 border-none w-full pl-10 pr-10 focus:outline-none focus:ring-1 focus:ring-primary h-11 rounded-xl"
                      autoFocus
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <XIcon className="text-base-content/60 size-5" />
                      </button>
                    )}
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowMobileSearch(false);
                      setSearchTerm("");
                    }}
                  >
                    Cancel
                  </button>

                  {/* Mobile Search Results Overlay */}
                  {searchTerm && (
                    <div className="fixed top-16 left-0 right-0 bottom-0 bg-base-100 z-[59] overflow-y-auto px-4 py-2">
                      {isSearching ? (
                        <div className="flex justify-center py-10">
                          <span className="loading loading-spinner loading-lg text-primary" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-1">
                          {searchResults.map((user) => (
                            <div
                              key={user._id}
                              className="flex items-center gap-4 p-3 hover:bg-base-200 rounded-xl transition-colors border-b border-base-300 last:border-0 cursor-pointer active:scale-[0.98]"
                              onClick={() => handleOpenProfile(user)}
                            >
                              <ProfileAvatar src={user.profilePic} name={user.fullName} size="w-12 h-12" textSize="text-lg" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{user.fullName}</p>
                                <p className="text-xs text-base-content/60 truncate">@{user.fullName.toLowerCase().replace(/\s/g, '')}</p>
                              </div>
                              {user.isFriend ? (
                                <button
                                  className="btn btn-primary btn-sm rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectUser(user);
                                    setShowMobileSearch(false);
                                  }}
                                >
                                  Chat
                                </button>
                              ) : (
                                <button
                                  className="btn btn-outline btn-sm rounded-lg"
                                  disabled={requestedIds.has(user._id)}
                                  onClick={(e) => { e.stopPropagation(); handleAddFriend(user._id); }}
                                >
                                  {requestedIds.has(user._id) ? "Sent" : "Add"}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 opacity-50">
                          <p>No users found matching "{searchTerm}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 🔔 Notifications Dropdown */}
              <div className="relative" ref={notifyRef}>
                <button 
                  className={`btn btn-ghost btn-circle ${isNotifyOpen ? 'bg-base-300' : ''}`}
                  onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                >
                  <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                  {/* Badge can go here if needed */}
                </button>

                {isNotifyOpen && (
                  <div className="fixed md:absolute top-16 left-4 right-4 md:left-auto md:right-0 mt-2 md:w-80 bg-base-200 border border-base-300 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top md:origin-top-right">
                    <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-300/30">
                      <h3 className="font-bold text-lg">Notifications</h3>
                      <Link to="/notifications" onClick={() => setIsNotifyOpen(false)} className="text-xs text-primary font-medium hover:underline">View all</Link>
                    </div>
                    <div className="max-h-[60vh] md:max-h-96 overflow-y-auto p-4 text-center">
                      <div className="py-12 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center opacity-20">
                          <BellIcon size={32} />
                        </div>
                        <p className="text-sm text-base-content/50">No new notifications</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 👤 Avatar Dropdown - Premium WhatsApp Style */}
              <div className="relative" ref={dropdownRef}>
                <div 
                  className={`flex items-center gap-1.5 cursor-pointer p-1 rounded-full transition-all duration-300 ${isProfileOpen ? 'bg-base-300 ring-2 ring-primary/20' : 'hover:bg-base-300'}`}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <ProfileAvatar src={authUser?.profilePic} name={authUser?.fullName} size="w-10 h-10" textSize="text-base" className="shadow-sm" />
                  <ChevronDownIcon className={`size-4 opacity-50 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* User Profile Header */}
                    <div className="p-5 border-b border-base-content/5 bg-base-200/50">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar src={authUser?.profilePic} name={authUser?.fullName} size="w-12 h-12" textSize="text-xl" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base truncate">{authUser?.fullName}</p>
                          <p className="text-xs text-base-content/50 truncate font-medium">{authUser?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <Link
                        to="/edit-profile"
                        className="flex items-center gap-4 px-4 py-3 hover:bg-base-content/5 rounded-xl transition-all duration-200 group"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <div className="size-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UserIcon className="size-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Edit Profile</p>
                          <p className="text-[10px] text-base-content/40 font-medium">Name, bio, profile photo</p>
                        </div>
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center gap-4 px-4 py-3 hover:bg-base-content/5 rounded-xl transition-all duration-200 group"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <div className="size-9 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <SettingsIcon className="size-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Settings</p>
                          <p className="text-[10px] text-base-content/40 font-medium">App preferences & general</p>
                        </div>
                      </Link>

                      <div className="px-1 py-1">
                        <div className="px-3 mb-1">
                          <ThemeSelector variant="menuItem" />
                        </div>
                      </div>

                      <div className="divider opacity-30 my-1 px-4"></div>

                      <div className="space-y-0.5">
                        <Link
                          to="/settings"
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-base-content/5 rounded-xl transition-all duration-200 text-left group opacity-70 hover:opacity-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="size-9 bg-info/10 text-info rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShipWheelIcon className="size-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Account</p>
                            <p className="text-[10px] text-base-content/40 font-medium">Security, account info</p>
                          </div>
                        </Link>

                        <Link
                          to="/settings"
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-base-content/5 rounded-xl transition-all duration-200 text-left group opacity-70 hover:opacity-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="size-9 bg-success/10 text-success rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BellIcon className="size-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Notifications</p>
                            <p className="text-[10px] text-base-content/40 font-medium">Messages, groups, sounds</p>
                          </div>
                        </Link>
                      </div>

                      <div className="divider opacity-30 my-1 px-4"></div>

                      <button
                        className="flex items-center gap-4 px-4 py-3 w-full hover:bg-error/10 text-error rounded-xl transition-all duration-200 text-left group"
                        onClick={handleLogout}
                      >
                        <div className="size-9 bg-error/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <LogOutIcon className="size-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Log Out</p>
                          <p className="text-[10px] text-error/50 font-medium">Sign out from Zashly</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 🧠 Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-base-200 rounded-2xl shadow-2xl p-6 w-80 text-center relative z-[101] animate-in fade-in zoom-in duration-200 border border-base-300">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOutIcon className="size-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Log Out?</h3>
            <p className="text-sm text-base-content/60 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-error text-white w-full"
                onClick={confirmLogout}
                disabled={logoutMutation?.isPending}
              >
                {logoutMutation?.isPending ? "Logging out..." : "Yes, Log Out"}
              </button>
              <button
                className="btn btn-ghost w-full"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={logoutMutation?.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👤 Instagram-style User Profile Modal */}
      {selectedProfile && (
        <SearchUserProfile
          user={selectedProfile}
          onClose={handleCloseProfile}
          onMessage={handleProfileMessage}
          onAddFriend={handleAddFriend}
          isRequested={requestedIds.has(selectedProfile._id)}
        />
      )}
    </>
  );
};

export default Navbar;
