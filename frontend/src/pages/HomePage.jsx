import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link } from "react-router";
import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon
} from "lucide-react";
import Moments from "../components/Moments";
import RecentChats from "../components/RecentChats";

import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import useAuthUser from "../hooks/useAuthUser";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs?.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        if (req.recipient) {
          outgoingIds.add(req.recipient._id);
        } else if (req.recipientId) {
          outgoingIds.add(req.recipientId);
        }
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  const { authUser } = useAuthUser();

  const filteredFriends = friends;

  return (
    <main className="p-4 sm:p-6 lg:p-8" aria-label="Home dashboard">
      <div className="container mx-auto space-y-10">
        <div className="space-y-8">
          {authUser?.role !== "admin" && <Moments />}
          <RecentChats />
        </div>
      </div>
    </main>
  );
};

export default HomePage;
