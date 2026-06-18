import { useState } from "react";
import { Link } from "react-router";
import ProfileAvatar from "./ProfileAvatar";
import { removeFriend, blockUser } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { UserMinusIcon, ShieldBanIcon, AlertTriangleIcon, XIcon } from "lucide-react";

const FriendCard = ({ friend }) => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  // null | "remove" | "block"
  const [confirmAction, setConfirmAction] = useState(null);

  const { mutate: removeFriendMutation, isPending: isRemoving } = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      toast.success(`Removed ${friend.fullName} from friends`);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      setConfirmAction(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove friend");
      setConfirmAction(null);
    },
  });

  const { mutate: blockUserMutation, isPending: isBlocking } = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      toast.success(`Blocked ${friend.fullName}`);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      setConfirmAction(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to block user");
      setConfirmAction(null);
    },
  });

  const canSeeLastSeen = friend.privacySettings?.lastSeen !== "nobody";
  const isPending = isRemoving || isBlocking;

  const dialogConfig = {
    remove: {
      title: "Remove Friend",
      description: (
        <>
          Are you sure you want to remove <span className="font-semibold">{friend.fullName}</span> from your friends list? You can always send them a new friend request later.
        </>
      ),
      confirmLabel: "Remove",
      confirmClass: "btn-warning",
      icon: <UserMinusIcon size={22} />,
      iconBg: "bg-warning/15 text-warning",
      onConfirm: () => removeFriendMutation(friend._id),
      loading: isRemoving,
    },
    block: {
      title: "Block User",
      description: (
        <>
          Are you sure you want to block <span className="font-semibold">{friend.fullName}</span>? They will be removed from your friends list and won't be able to message you.
        </>
      ),
      confirmLabel: "Block",
      confirmClass: "btn-error",
      icon: <ShieldBanIcon size={22} />,
      iconBg: "bg-error/15 text-error",
      onConfirm: () => blockUserMutation(friend._id),
      loading: isBlocking,
    },
  };

  const dialog = confirmAction ? dialogConfig[confirmAction] : null;

  return (
    <>
      <div className="card bg-base-200 hover:shadow-md transition-shadow">
        <div className="card-body p-4">
          {/* USER INFO */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative shrink-0">
              <ProfileAvatar src={friend.profilePic} name={friend.fullName} size="w-12 h-12" textSize="text-lg" />
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
              className="btn btn-outline btn-warning btn-sm tooltip tooltip-top"
              data-tip="Remove Friend"
              disabled={isRemoving}
              onClick={() => setConfirmAction("remove")}
            >
              {isRemoving ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <UserMinusIcon size={15} />
              )}
            </button>
            <button
              className="btn btn-outline btn-error btn-sm tooltip tooltip-top"
              data-tip="Block"
              disabled={isBlocking}
              onClick={() => setConfirmAction("block")}
            >
              {isBlocking ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <ShieldBanIcon size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirmation Dialog Modal ── */}
      {dialog && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-sm mx-4 animate-scale-in">
            {/* Close button */}
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
              onClick={() => !isPending && setConfirmAction(null)}
              disabled={isPending}
            >
              <XIcon size={16} />
            </button>

            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center pt-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dialog.iconBg}`}>
                {dialog.icon}
              </div>
              <h3 className="text-lg font-bold">{dialog.title}</h3>
              <p className="text-sm text-base-content/60 mt-2 px-2 leading-relaxed">
                {dialog.description}
              </p>
            </div>

            {/* Actions */}
            <div className="modal-action justify-center gap-3 mt-6">
              <button
                className="btn btn-ghost btn-sm min-w-[5rem]"
                onClick={() => setConfirmAction(null)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                className={`btn btn-sm min-w-[5rem] ${dialog.confirmClass}`}
                onClick={dialog.onConfirm}
                disabled={isPending}
              >
                {dialog.loading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  dialog.confirmLabel
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/40"
            onClick={() => !isPending && setConfirmAction(null)}
          />
        </div>
      )}
    </>
  );
};

export default FriendCard;
