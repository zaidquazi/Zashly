import { useState, useEffect, useCallback } from "react";
import {
  MessageSquareIcon,
  EyeIcon,
  Trash2Icon,
  TrashIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  UserIcon
} from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "../ProfileAvatar";
import ConfirmModal from "./ConfirmModal";
import {
  getAdminGroups,
  deleteGroup,
  getGroupMessages,
  deleteMessage,
} from "../../lib/adminApi";

const GroupsView = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [viewingGroup, setViewingGroup] = useState(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminGroups();
      setGroups(data);
    } catch (err) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDeleteGroup = async (group) => {
    setActionLoading(group._id);
    try {
      await deleteGroup(group._id);
      toast.success(`Group "${group.name}" eradicated`);
      setConfirmAction(null);
      setViewingGroup(null);
      fetchGroups();
    } catch (err) {
      toast.error("Failed to delete group");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <MessageSquareIcon className="size-5 sm:size-6 text-primary" />
              Community Control
            </h2>
            <p className="text-[10px] sm:text-xs text-base-content/50 mt-1">Audit active groups and message history</p>
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
           <span className="loading loading-spinner loading-lg text-primary" />
           <p className="text-sm font-medium opacity-50">Mapping group clusters...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-base-200 border border-base-300 rounded-2xl p-24 text-center">
           <p className="text-base-content/30 italic">No active groups detected on platform</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groups.map((group) => (
            <div
              key={group._id}
              className={`bg-base-200 border border-base-300 rounded-2xl transition-all duration-300 ${viewingGroup?._id === group._id ? 'ring-2 ring-primary/20 shadow-xl' : 'hover:border-base-content/10'}`}
            >
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <ProfileAvatar
                    src={group.avatar}
                    name={group.name}
                    size="w-12 h-12"
                    textSize="text-sm"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-base truncate">{group.name}</p>
                    <div className="flex items-center gap-3 text-xs text-base-content/40 mt-0.5">
                       <span className="flex items-center gap-1"><UserIcon className="size-3" /> {group.memberCount} members</span>
                       <span className="flex items-center gap-1"><ClockIcon className="size-3" /> Admin: {group.admin?.fullName || "System"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                   <button
                    className={`btn btn-circle btn-sm ${viewingGroup?._id === group._id ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-ghost text-base-content/60'} transition-all`}
                    onClick={() => setViewingGroup(viewingGroup?._id === group._id ? null : group)}
                  >
                    <EyeIcon className="size-4" />
                  </button>
                  <button
                    className="btn btn-circle btn-sm btn-ghost text-error/40 hover:text-error hover:bg-error/10 transition-colors"
                    onClick={() => setConfirmAction({ type: "deleteGroup", group })}
                    disabled={actionLoading === group._id}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </div>

              {/* Expandable message viewer */}
              {viewingGroup?._id === group._id && (
                <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-base-300/40 rounded-xl p-4 border border-base-300/50">
                    <MessageViewer groupId={group._id} groupName={group.name} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmAction?.type === "deleteGroup" && (
        <ConfirmModal
          title="Critical: Terminate Group"
          message={`Are you sure you want to permanently delete "${confirmAction.group.name}"? This will erase all ${confirmAction.group.memberCount} memberships and every single message ever sent within this community.`}
          confirmLabel="Terminate Community"
          confirmClass="btn-error"
          requireConfirmText={true}
          loading={actionLoading === confirmAction.group._id}
          onConfirm={() => handleDeleteGroup(confirmAction.group)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

/* --- INNER COMPONENT: MESSAGE VIEWER --- */
function MessageViewer({ groupId, groupName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGroupMessages(groupId, page);
      setMessages(data.messages);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error("Audit failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [groupId, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleDeleteMsg = async (msgId) => {
    setDeletingId(msgId);
    try {
      await deleteMessage(msgId);
      toast.success("Message expunged");
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      toast.error("Expunge failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="py-10 text-center"><span className="loading loading-spinner text-primary" /></div>;

  if (messages.length === 0) return <div className="py-10 text-center text-xs opacity-30 italic">Clear channel: no messages detected</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-base-300 pb-2">
         <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40">Secure Message Feed</h3>
         <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">{messages.length} pkts</span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg._id} className="flex gap-3 group bg-base-100 p-2.5 rounded-lg border border-transparent hover:border-base-300 transition-all">
             <ProfileAvatar src={msg.sender?.profilePic} name={msg.sender?.fullName} size="w-7 h-7" textSize="text-[10px]" />
             <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold truncate">{msg.sender?.fullName || "REDACTED"}</span>
                   <span className="text-[9px] opacity-30 font-mono">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-start gap-2">
                   <p className="text-xs text-base-content/80 break-words flex-1">
                      {msg.type === "image" ? <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded italic">IMAGE_BLOB</span> : msg.content}
                   </p>
                   <button 
                     className="btn btn-ghost btn-xs size-6 p-0 text-error opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={() => handleDeleteMsg(msg._id)}
                     disabled={deletingId === msg._id}
                   >
                     <TrashIcon className="size-3" />
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-base-300/50">
           <button className="btn btn-xs btn-ghost" onClick={() => setPage(p => Math.max(1, p -1))} disabled={page === 1}><ChevronLeftIcon className="size-3" /></button>
           <span className="text-[10px] font-bold opacity-40">{page} / {totalPages}</span>
           <button className="btn btn-xs btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRightIcon className="size-3" /></button>
        </div>
      )}
    </div>
  );
}

export default GroupsView;
