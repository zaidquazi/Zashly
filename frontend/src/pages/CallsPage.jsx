import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllCallHistory, 
  deleteCallLog, 
  clearCallHistory 
} from "../lib/callApi";
import useAuthUser from "../hooks/useAuthUser";
import { formatDistanceToNow, format } from "date-fns";
import { 
  PhoneIcon, 
  VideoIcon, 
  PhoneIncomingIcon, 
  PhoneOutgoingIcon, 
  PhoneMissedIcon,
  Trash2Icon,
  MoreVerticalIcon,
  RefreshCcwIcon
} from "lucide-react";
import ProfileAvatar from "../components/ProfileAvatar";
import toast from "react-hot-toast";
import useStartCall from "../hooks/useStartCall";
import { useState } from "react";
import { Link } from "react-router";

const CallsPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const { startCall } = useStartCall();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["callHistory"],
    queryFn: getAllCallHistory,
  });

  const { mutate: deleteLog } = useMutation({
    mutationFn: deleteCallLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callHistory"] });
      toast.success("Call log deleted");
    },
  });

  const { mutate: clearHistory, isPending: isClearing } = useMutation({
    mutationFn: clearCallHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callHistory"] });
      toast.success("Call history cleared");
      setShowClearConfirm(false);
    },
  });

  const handleCallAgain = (e, call, isVideo) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Determine target based on call type
    if (call.type === "group") {
      startCall({
        targetId: call.targetId,
        targetName: call.targetName,
        type: "group",
        callType: isVideo ? "video" : "voice"
      });
    } else {
      // 1-on-1 call: Target is the other user
      const isCaller = call.callerId?._id === authUser._id;
      const otherUserId = isCaller ? call.targetId : call.callerId?._id;
      
      if (!otherUserId) {
        toast.error("Cannot call unknown or deleted user");
        return;
      }

      const otherUserName = isCaller ? call.targetName : call.callerId?.fullName;
      const otherUserPic = isCaller ? null : call.callerId?.profilePic;

      startCall({
        targetId: otherUserId,
        targetName: otherUserName || "Unknown User",
        targetPic: otherUserPic,
        type: "one-on-one",
        callType: isVideo ? "video" : "voice"
      });
    }
  };

  const handleDelete = (e, logId) => {
    e.preventDefault();
    e.stopPropagation();
    deleteLog(logId);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-base-content">Calls</h1>
        
        {calls.length > 0 && (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <MoreVerticalIcon className="size-5" />
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
              <li>
                <button onClick={() => setShowClearConfirm(true)} className="text-error">
                  <Trash2Icon className="size-4" />
                  Clear call log
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-base-content/60 space-y-4">
          <div className="p-4 bg-base-200 rounded-full">
            <PhoneIcon className="size-10" />
          </div>
          <p className="text-lg">No recent calls</p>
          <p className="text-sm">Your recent voice and video calls will appear here.</p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden">
          <ul className="divide-y divide-base-200">
            {calls.map((call) => {
              const isCaller = call.callerId?._id === authUser._id;
              
              // For 1-on-1, determine the other person
              const otherUserName = isCaller ? call.targetName : call.callerId?.fullName;
              const otherUserPic = isCaller ? null : call.callerId?.profilePic; // Note: targetPic not always stored, might fallback to default
              
              // Determine status and icon
              let statusIcon;
              let statusColor;
              let statusText;

              if (call.type === "group") {
                // Group calls
                statusIcon = isCaller ? <PhoneOutgoingIcon className="size-4" /> : <PhoneIncomingIcon className="size-4" />;
                statusColor = call.status === "ended" || call.status === "answered" ? "text-success" : "text-error";
                statusText = isCaller ? "Outgoing Group Call" : "Incoming Group Call";
              } else {
                // 1-on-1 calls
                if (isCaller) {
                  statusIcon = <PhoneOutgoingIcon className="size-4" />;
                  statusColor = call.status === "ended" || call.status === "answered" ? "text-success" : "text-base-content/50";
                  statusText = "Outgoing";
                } else {
                  if (call.status === "ringing" || call.status === "missed") {
                    statusIcon = <PhoneMissedIcon className="size-4" />;
                    statusColor = "text-error";
                    statusText = "Missed";
                  } else {
                    statusIcon = <PhoneIncomingIcon className="size-4" />;
                    statusColor = "text-success";
                    statusText = "Incoming";
                  }
                }
              }

              // Format date nicely
              const date = new Date(call.createdAt);
              const isToday = new Date().toDateString() === date.toDateString();
              const timeString = format(date, "h:mm a");
              const dateString = isToday ? "Today" : format(date, "MMM d");

              // Determine link destination (if group, open group, else open 1on1 chat)
              const linkTo = call.type === "group" ? `/groups/${call.targetId}` : `/chat/${isCaller ? call.targetId : call.callerId?._id}`;

              return (
                <li key={call._id} className="hover:bg-base-200 transition-colors group relative">
                  <Link to={linkTo} className="flex items-center gap-4 p-4">
                    
                    {/* Avatar */}
                    {call.type === "group" ? (
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-12 h-12">
                          <span className="text-xl">{call.targetName?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      </div>
                    ) : (
                      <ProfileAvatar src={otherUserPic} name={otherUserName} size="w-12 h-12" />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-base truncate ${call.status === "missed" && !isCaller ? "text-error" : ""}`}>
                        {otherUserName || "Unknown User"}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-sm text-base-content/70 mt-0.5">
                        <span className={`shrink-0 ${statusColor}`}>{statusIcon}</span>
                        <span className="truncate">{statusText}</span>
                        {call.duration > 0 && (
                          <span className="shrink-0">
                            • {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, "0")}
                          </span>
                        )}
                        <span className="shrink-0 text-xs sm:text-sm">
                          • {dateString}, {timeString}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        className="btn btn-circle btn-ghost btn-sm"
                        onClick={(e) => handleCallAgain(e, call, false)}
                      >
                        <PhoneIcon className="size-5 text-primary" />
                      </button>
                      <button 
                        className="btn btn-circle btn-ghost btn-sm"
                        onClick={(e) => handleCallAgain(e, call, true)}
                      >
                        <VideoIcon className="size-5 text-primary" />
                      </button>
                      <button 
                        className="btn btn-circle btn-ghost btn-sm text-error md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(e, call._id)}
                        title="Delete log"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-base-100 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Clear Call History?</h3>
            <p className="text-base-content/80 mb-6">
              This will permanently delete your entire call log. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error text-white" 
                onClick={() => clearHistory()}
                disabled={isClearing}
              >
                {isClearing ? <span className="loading loading-spinner loading-sm"></span> : "Clear History"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallsPage;
