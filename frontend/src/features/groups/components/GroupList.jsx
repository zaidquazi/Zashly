import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyGroups } from "../lib/groupApi";
import { PlusIcon, UsersIcon, MessageSquareIcon } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import NotificationBadge from "./NotificationBadge";
import useSocket from "../hooks/useSocket";
import { useEffect } from "react";

/**
 * GroupList — shows all groups the user belongs to.
 * Displayed on the HomePage alongside RecentChats.
 */
export default function GroupList() {
  const navigate = useNavigate();
  const { on } = useSocket();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: groups = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["myGroups"],
    queryFn: getMyGroups,
  });

  // Listen for new groups (when someone adds you to a group)
  useEffect(() => {
    const unsub = on("group-created-for-user", () => {
      refetch();
    });
    return unsub;
  }, [on, refetch]);

  // Listen for group updates
  useEffect(() => {
    const unsub = on("group-updated", () => {
      refetch();
    });
    return unsub;
  }, [on, refetch]);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return d.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return d.toLocaleDateString("en-IN", { weekday: "short" });
      }
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  const getGroupAvatar = (group) => {
    if (group.avatar) return group.avatar;
    // Use first 2 letters of group name as fallback
    return null;
  };

  const getGroupInitials = (name) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) return null;

  return (
    <>
      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquareIcon className="size-5 text-primary" />
            Groups
          </h3>
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="size-4" />
            New
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-6 opacity-60">
            <UsersIcon className="size-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No groups yet</p>
            <button
              className="btn btn-primary btn-sm mt-2"
              onClick={() => setShowCreateModal(true)}
            >
              Create your first group
            </button>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-base-200">
            {groups.map((group) => {
              const avatar = getGroupAvatar(group);
              const lastMsg = group.lastMessage;
              const lastMsgText = lastMsg
                ? lastMsg.type === "system"
                  ? lastMsg.content
                  : `${lastMsg.sender?.fullName || "Someone"}: ${lastMsg.content}`
                : "No messages yet";

              return (
                <li key={group._id}>
                  <div
                    className="relative flex items-center gap-3 py-3 px-1 hover:bg-base-200/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/group/${group._id}`)}
                  >
                    {/* Group Avatar */}
                    <div className="avatar placeholder">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt={group.name} />
                        ) : (
                          <span className="text-sm font-bold">
                            {getGroupInitials(group.name)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium truncate">{group.name}</div>
                        <div className="text-xs opacity-60 whitespace-nowrap">
                          {formatTime(lastMsg?.createdAt || group.updatedAt)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm opacity-70 truncate flex-1">
                          {lastMsgText}
                        </div>
                        <NotificationBadge count={group.unreadCount || 0} show={(group.unreadCount || 0) > 0} color="green" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
