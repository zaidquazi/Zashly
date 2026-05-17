import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WifiIcon, WifiOffIcon, UsersIcon } from "lucide-react";

import { getUserFriends } from "../lib/api";
import FriendCard from "../components/FriendCard";
import useAuthUser from "../hooks/useAuthUser.js";
import useSocket from "../hooks/useSocket.js";

const FriendsPage = () => {
  const [filterStatus, setFilterStatus] = useState("online");
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const { socket, isConnected, emit } = useSocket();

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // ── Emit "user-online" and refetch friends when socket connects ───────────
  // Refetch ensures we get the up-to-date isOnline values from the live
  // onlineUsers Map (the API now cross-references it).
  useEffect(() => {
    if (isConnected && authUser?._id) {
      emit("user-online", authUser._id);
      // Invalidate so the query re-runs and picks up accurate isOnline from API
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    }
  }, [isConnected, authUser?._id, emit, queryClient]);

  // ── Handle full online-users roster sent by server on connect ─────────────
  // Fixes the race condition: "User A was already online when I loaded the page."
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsersList = (onlineUserIds) => {
      // onlineUserIds is string[] of every currently-online userId
      const onlineSet = new Set(onlineUserIds);
      queryClient.setQueryData(["friends"], (oldFriends = []) =>
        oldFriends.map((f) => ({
          ...f,
          isOnline: onlineSet.has(f._id?.toString()),
        }))
      );
    };

    socket.on("online-users-list", handleOnlineUsersList);
    return () => socket.off("online-users-list", handleOnlineUsersList);
  }, [socket, queryClient]);

  // ── Real-time friend connect / disconnect ──────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleFriendStatusChange = ({ userId, isOnline }) => {
      queryClient.setQueryData(["friends"], (oldFriends = []) =>
        oldFriends.map((f) =>
          f._id === userId || f._id?.toString() === userId
            ? { ...f, isOnline }
            : f
        )
      );
    };

    socket.on("friendStatusChange", handleFriendStatusChange);
    return () => socket.off("friendStatusChange", handleFriendStatusChange);
  }, [socket, queryClient]);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const onlineCount = friends.filter((f) => f.isOnline).length;
  const offlineCount = friends.filter((f) => !f.isOnline).length;

  // ── Filter friends by active tab ───────────────────────────────────────────
  const filteredFriends = friends.filter((friend) =>
    filterStatus === "online" ? friend.isOnline : !friend.isOnline
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
          <span className="text-sm text-base-content/50">{friends.length} total</span>
        </div>

        {/* ── Online / Offline Toggle ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
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

        {/* ── Friends List ─────────────────────────────────────────────────── */}
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
