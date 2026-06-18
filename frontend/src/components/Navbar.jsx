import { Link, useLocation, useNavigate } from "react-router";
import ProfileAvatar from "./ProfileAvatar";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  LoaderPinwheel,
  SearchIcon,
  XIcon,
  UserCheckIcon,
  HeartIcon,
  MessageCircleIcon,
  ClockIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import SearchUserProfile from "./SearchUserProfile";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

// 🧩 Import the search API
import { searchUsers, sendFriendRequest, getFriendRequests, getNotifications } from "../lib/api";

const Navbar = ({ showSidebar }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
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

  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 10000, 
    enabled: !!authUser,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 15000,
    enabled: !!authUser,
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const unreadNotifications = (notifications || []).filter(n => !n.isRead);
  const totalUnread = incomingRequests.length + unreadNotifications.length;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between w-full">
            {/* LOGO */}
            <div className={`flex items-center gap-4 ${showSidebar ? "lg:hidden" : ""}`}>
              <Link to="/app" className="flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95">
                <LoaderPinwheel className="size-8 sm:size-9 text-primary animate-spin-slow" />
                <span className="text-2xl sm:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider drop-shadow-sm">
                  Zashly
                </span>
              </Link>
              
              {!showSidebar && location.pathname.startsWith('/admin') && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 cursor-default">
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">Admin Console</span>
                </div>
              )}
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
                {searchTerm && (
                  <div className="absolute top-9 left-0 w-full bg-base-200 border border-base-300 rounded-lg shadow-md z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-center text-sm text-base-content/50 flex items-center justify-center gap-2">
                        <span className="loading loading-spinner loading-xs text-primary" />
                        <span>Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
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
                      ))
                    ) : (
                      <div className="p-3 text-center text-sm text-base-content/50">
                        No users found
                      </div>
                    )}
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
                  <div className="indicator">
                    <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                    {totalUnread > 0 && (
                      <span className="badge badge-sm badge-primary indicator-item">{totalUnread}</span>
                    )}
                  </div>
                </button>

                {isNotifyOpen && (
                  <div className="fixed md:absolute top-16 left-4 right-4 md:left-auto md:right-0 mt-2 md:w-80 bg-base-200 border border-base-300 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top md:origin-top-right">
                    <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-300/30">
                      <h3 className="font-bold text-lg">Notifications</h3>
                      <Link to="/notifications" onClick={() => setIsNotifyOpen(false)} className="text-xs text-primary font-medium hover:underline">View all</Link>
                    </div>
                    <div className="max-h-[60vh] md:max-h-96 overflow-y-auto p-2">
                      {totalUnread === 0 && (!notifications || notifications.length === 0) ? (
                        <div className="py-12 flex flex-col items-center text-center gap-3">
                          <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center opacity-20">
                            <BellIcon size={32} />
                          </div>
                          <p className="text-sm text-base-content/50">No new notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {/* Friend Requests */}
                          {incomingRequests.slice(0, 3).map((req) => (
                            <Link
                              key={req._id}
                              to="/notifications"
                              onClick={() => setIsNotifyOpen(false)}
                              className="flex items-start gap-3 p-2 hover:bg-base-300 rounded-xl transition-colors"
                            >
                              <ProfileAvatar src={req.sender?.profilePic} name={req.sender?.fullName} size="w-10 h-10" />
                              <div className="flex-1">
                                <p className="text-sm"><span className="font-semibold">{req.sender?.fullName}</span> sent you a friend request</p>
                                <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                                  <UserCheckIcon size={12} /> Pending Request
                                </p>
                              </div>
                            </Link>
                          ))}
                          
                          {/* Other Notifications */}
                          {(notifications || []).slice(0, 5).map((n) => (
                            <Link
                              key={n._id}
                              to="/notifications"
                              onClick={() => setIsNotifyOpen(false)}
                              className={`flex items-start gap-3 p-2 hover:bg-base-300 rounded-xl transition-colors ${!n.isRead ? 'bg-base-300/50' : ''}`}
                            >
                              <div className="relative">
                                <ProfileAvatar src={n.sender?.profilePic} name={n.sender?.fullName} size="w-10 h-10" />
                                <div className={`absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border-2 border-base-200 ${n.type === 'like' ? 'bg-error text-white' : 'bg-info text-white'}`}>
                                  {n.type === 'like' ? <HeartIcon size={10} fill="currentColor" /> : <MessageCircleIcon size={10} />}
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-semibold">{n.sender?.fullName}</span>{' '}
                                  {n.type === 'like' ? 'liked your spark' : n.type === 'comment' ? `commented: "${n.content}"` : 'interacted with you'}
                                </p>
                                <p className="text-[10px] opacity-50 mt-0.5 flex items-center gap-1">
                                  <ClockIcon size={10} />
                                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 👤 Profile Avatar Link */}
              <Link
                to="/settings"
                className="flex items-center p-1 rounded-full hover:bg-base-300 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                title="Settings"
              >
                <ProfileAvatar
                  src={authUser?.profilePic}
                  name={authUser?.fullName}
                  size="w-10 h-10"
                  textSize="text-base"
                  className="shadow-sm"
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
