import { Link } from "react-router";
import ProfileAvatar from "./ProfileAvatar";
import { blockUser } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

const FriendCard = ({ friend }) => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  const { mutate: blockUserMutation } = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      toast.success(`Blocked ${friend.fullName}`);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to block user");
    },
  });

  const canSeeLastSeen = friend.privacySettings?.lastSeen !== "nobody";

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar with online dot */}
          <div className="relative shrink-0">
            <ProfileAvatar src={friend.profilePic} name={friend.fullName} size="w-12 h-12" textSize="text-lg" />
            {/* Online / Offline indicator dot */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-200
                ${friend.isOnline ? "bg-success" : "bg-base-content/20"}`}
              title={friend.isOnline ? "Online" : "Offline"}
            />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>
            <p className={`text-xs ${friend.isOnline ? "text-success" : "text-base-content/40"}`}>
              {friend.isOnline ? (
                "Online"
              ) : (
                <>
                  {canSeeLastSeen && friend.lastSeen ? (
                    `Last seen ${formatDistanceToNow(new Date(friend.lastSeen))} ago`
                  ) : (
                    "Offline"
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/chat/${friend._id}`} className="btn btn-primary btn-sm flex-1">
            Message
          </Link>
          <button 
            className="btn btn-outline btn-error btn-sm"
            onClick={(e) => {
              e.preventDefault();
              if (window.confirm(`Are you sure you want to block ${friend.fullName}?`)) {
                blockUserMutation(friend._id);
              }
            }}
          >
            Block
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendCard;

