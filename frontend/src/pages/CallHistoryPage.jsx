import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Trash2,
  Mic,
} from "lucide-react";
import { getCallHistory, deleteCallRecord } from "../features/calls/services/callApi";
import ProfileAvatar from "../components/ProfileAvatar";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import "../features/calls/call-ui.css";

function statusIcon(status, callType) {
  if (status === "missed") return <PhoneMissed className="size-4 text-red-400" />;
  if (status === "rejected") return <PhoneMissed className="size-4 text-amber-400" />;
  return callType === "video" ? (
    <Video className="size-4 text-sky-400" />
  ) : (
    <Mic className="size-4 text-emerald-400" />
  );
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const CallHistoryPage = () => {
  const { authUser } = useAuthUser();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["callHistory"],
    queryFn: () => getCallHistory(),
  });

  const records = data?.records || [];

  const handleDelete = async (id) => {
    try {
      await deleteCallRecord(id);
      toast.success("Removed from history");
      refetch();
    } catch {
      toast.error("Could not delete");
    }
  };

  const getOtherParty = (record) => {
    if (record.callMode === "group") return { name: "Group call", image: "" };
    const callerId = record.callerId?._id;
    if (String(callerId) === String(authUser?._id)) {
      const other = record.participants?.[0];
      return { name: other?.fullName || "Unknown", image: other?.profilePic || "" };
    }
    return {
      name: record.callerId?.fullName || "Unknown",
      image: record.callerId?.profilePic || "",
    };
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Call History</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-base-content/60">
          <Phone className="size-12 mx-auto mb-4 opacity-40" />
          <p>No calls yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {records.map((record) => {
            const other = getOtherParty(record);
            const isOutgoing = String(record.callerId?._id) === String(authUser?._id);
            return (
              <li
                key={record._id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-base-200/80 hover:bg-base-200 transition-colors"
              >
                <ProfileAvatar src={other.image} name={other.name} size="w-12 h-12" textSize="text-base" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{other.name}</p>
                  <p className="text-sm text-base-content/60 flex items-center gap-2">
                    {isOutgoing ? (
                      <PhoneOutgoing className="size-3" />
                    ) : (
                      <PhoneIncoming className="size-3" />
                    )}
                    {record.status} · {formatDuration(record.duration)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {statusIcon(record.status, record.callType)}
                  <p className="text-xs text-base-content/50 mt-1">
                    {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => handleDelete(record._id)}
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CallHistoryPage;
