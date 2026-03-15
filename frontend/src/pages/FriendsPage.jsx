import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { WifiIcon, WifiOffIcon } from "lucide-react";

import { getUserFriends } from "../lib/api";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import useAuthUser from "../hooks/useAuthUser.js";

const FriendsPage = () => {
  const [filterStatus, setFilterStatus] = useState("online");
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const socket = io("http://localhost:5002", { 
    withCredentials: true,
    transports: ['websocket', 'polling'] // Ensure connection works
  });

  // Add connection status logging
  socket.on('connect', () => {
    console.log('Socket connected successfully:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    onSuccess: (data) => {
      console.log("Friends data loaded:", data);
    }
  });

  useEffect(() => {
    if (authUser) {
      console.log("Setting up socket for user:", authUser._id);
      const userId = authUser._id.toString(); // Ensure it's a string
      
      // Emit that current user is online
      socket.emit("user-online", userId);
      console.log("Emitted user-online for:", userId);
      
      // Listen for friend status changes
      socket.on("friendStatusChange", (updatedFriend) => {
        console.log("Received friend status change:", updatedFriend);
        console.log("Current friends before update:", friends);
        
        queryClient.setQueryData(["friends"], (oldFriends = []) => {
          console.log("Updating friends list:", oldFriends);
          const updatedFriends = oldFriends.map((f) => {
            const shouldUpdate = f._id === updatedFriend.userId || f._id?.toString() === updatedFriend.userId;
            console.log(`Friend ${f._id} should update: ${shouldUpdate}`);
            return shouldUpdate ? { ...f, isOnline: updatedFriend.isOnline } : f;
          });
          console.log("Friends after update:", updatedFriends);
          return updatedFriends;
        });
      });
    }

    return () => {
      socket.off("friendStatusChange");
    };
  }, [authUser, queryClient]);

  //  Count online/offline
  const onlineCount = friends.filter((f) => f.isOnline).length;
  const offlineCount = friends.filter((f) => !f.isOnline).length;

  // Filter by status
  const filteredFriends = friends.filter((friend) =>
    filterStatus === "online" ? friend.isOnline : !friend.isOnline
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8">
        {/* Online / Offline Filter */}
        <div className="flex items-center gap-3">
          <button
            className={`btn btn-sm flex items-center gap-2 ${
              filterStatus === "online" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilterStatus("online")}
          >
            <WifiIcon size={16} /> Online ({onlineCount})
          </button>

          <button
            className={`btn btn-sm flex items-center gap-2 ${
              filterStatus === "offline" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilterStatus("offline")}
          >
            <WifiOffIcon size={16} /> Offline ({offlineCount})
          </button>
        </div>

        {/* Friends List */}
        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : filteredFriends.length === 0 ? (
          <NoFriendsFound />
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
