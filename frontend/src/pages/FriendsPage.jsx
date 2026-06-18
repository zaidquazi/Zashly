import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WifiIcon, WifiOffIcon, UsersIcon } from "lucide-react";

import { getUserFriends } from "../lib/api";
import FriendCard from "../components/FriendCard";
import useAuthUser from "../hooks/useAuthUser.js";
import useSocket from "../hooks/useSocket.js";
import { useOnlineRoster, isUserOnline, isRosterReady, getOnlineUserIds } from "../hooks/useSocket.js";

const FriendsPage = () => {
  const { authUser } = useAuthUser();
  const { isConnected, emit } = useSocket();
  const [filterStatus, setFilterStatus] = useState("online");

  useOnlineRoster();

  const { data: apiFriends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const rosterAvailable = isRosterReady();
  const friends = apiFriends.map((f) => ({
    ...f,
    isOnline: rosterAvailable ? isUserOnline(f._id) : f.isOnline,
  }));

  useEffect(() => {
    if (!isConnected || !authUser?._id) return;

    const timers = [
      setTimeout(() => emit("request-online-roster"), 1000),
      setTimeout(() => emit("request-online-roster"), 3000),
      setTimeout(() => emit("request-online-roster"), 6000),
      setTimeout(() => emit("request-online-roster"), 10000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isConnected, authUser?._id, emit]);

  const onlineCount = friends.filter((f) => f.isOnline).length;
  const offlineCount = friends.filter((f) => !f.isOnline).length;

  const filteredFriends = friends.filter((friend) =>
    filterStatus === "online" ? friend.isOnline : !friend.isOnline
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
          <div className="flex gap-4 items-center">
            {import.meta.env.DEV && (
              <button 
                className="btn btn-xs btn-outline"
                onClick={() => {
                  console.log("--- DEBUG INFO ---");
                  console.log("Roster Ready:", isRosterReady());
                  console.log("Global Roster IDs:", Array.from(getOnlineUserIds()));
                  console.log("API Friends:", apiFriends.map(f => ({ id: f._id, name: f.fullName, apiIsOnline: f.isOnline })));
                  console.log("Merged Friends:", friends.map(f => ({ id: f._id, name: f.fullName, mergedIsOnline: f.isOnline })));
                  console.log("isConnected:", isConnected);
                }}
              >
                Debug Roster
              </button>
            )}
            <span className="text-sm text-base-content/50">{friends.length} total</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`btn btn-sm flex items-center gap-2 transition-all ${
              filterStatus === "online" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilterStatus("online")}
          >
            <WifiIcon size={14} />
            Online
            <span
              className={`badge badge-xs ml-0.5 ${
                filterStatus === "online" ? "badge-primary-content" : "badge-neutral"
              }`}
            >
              {onlineCount}
            </span>
          </button>

          <button
            type="button"
            className={`btn btn-sm flex items-center gap-2 transition-all ${
              filterStatus === "offline" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilterStatus("offline")}
          >
            <WifiOffIcon size={14} />
            Offline
            <span
              className={`badge badge-xs ml-0.5 ${
                filterStatus === "offline" ? "badge-primary-content" : "badge-neutral"
              }`}
            >
              {offlineCount}
            </span>
          </button>
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <UsersIcon className="mx-auto mb-3 text-base-content/30" size={48} />
            <h3 className="font-semibold text-lg mb-1">No friends yet</h3>
            <p className="text-base-content/60 text-sm">
              Connect instantly, talk live, and meet friends — only on Zashly.
            </p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            {filterStatus === "online" ? (
              <>
                <WifiIcon className="mx-auto mb-3 text-base-content/30" size={48} />
                <h3 className="font-semibold text-lg mb-1">No friends online</h3>
                <p className="text-base-content/60 text-sm">
                  None of your friends are online right now. Check back later!
                </p>
              </>
            ) : (
              <>
                <WifiOffIcon className="mx-auto mb-3 text-base-content/30" size={48} />
                <h3 className="font-semibold text-lg mb-1">No offline friends</h3>
                <p className="text-base-content/60 text-sm">
                  All your friends are currently online — great timing!
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFriends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;