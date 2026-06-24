import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { getMyGroups } from "../lib/groupApi";
import { XIcon, SearchIcon, SendIcon, Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "./ProfileAvatar";
import { useChatContext } from "stream-chat-react";
import useAuthUser from "../hooks/useAuthUser";

const ForwardModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTargets, setSelectedTargets] = useState(new Set()); // IDs of users/groups
  const [isForwarding, setIsForwarding] = useState(false);

  const { client } = useChatContext();
  const { authUser } = useAuthUser();

  useEffect(() => {
    const handleOpen = (e) => {
      setSelectedMessages(e.detail || []);
      setIsOpen(true);
      setSelectedTargets(new Set());
      setSearchTerm("");
    };
    window.addEventListener("openForwardModal", handleOpen);
    return () => window.removeEventListener("openForwardModal", handleOpen);
  }, []);

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: isOpen,
  });

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["myGroups"],
    queryFn: getMyGroups,
    enabled: isOpen,
  });

  const filteredTargets = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const mappedFriends = friends.map(f => ({ ...f, type: 'user', id: f._id || f.id }));
    const mappedGroups = groups.map(g => ({ ...g, type: 'group', id: g._id || g.id }));
    
    const combined = [...mappedFriends, ...mappedGroups];
    
    if (!term) return combined;
    
    return combined.filter(t => {
      const name = t.type === 'user' ? (t.fullName || t.username) : t.name;
      return (name || "").toLowerCase().includes(term);
    });
  }, [friends, groups, searchTerm]);

  const toggleTarget = (targetId) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const handleForward = async () => {
    if (!client || !authUser) return;
    setIsForwarding(true);
    
    try {
      const authId = String(authUser._id);
      const targetList = Array.from(selectedTargets);

      for (const targetId of targetList) {
        const targetObj = filteredTargets.find(t => t.id === targetId);
        if (!targetObj) continue;

        let channel;
        if (targetObj.type === 'group') {
          channel = client.channel('messaging', targetId);
        } else {
          const channelId = [authId, targetId].sort().join("-");
          channel = client.channel('messaging', channelId);
        }

        // Just ensure channel is watched/ready locally (don't need full watch if just sending)
        await channel.create();

        for (const msg of selectedMessages) {
          // Clone necessary parts of the message
          const newMsg = {
            text: msg.text,
            attachments: msg.attachments,
            // don't copy id, created_at, user, etc.
          };
          await channel.sendMessage(newMsg);
        }
      }

      toast.success(`Forwarded to ${selectedTargets.size} chat(s)`);
      setIsOpen(false);
    } catch (err) {
      console.error("Forwarding failed", err);
      toast.error("Failed to forward messages");
    } finally {
      setIsForwarding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <div className="flex items-center gap-2">
            <Forward className="size-5 text-primary" />
            <h3 className="text-lg font-bold">Forward to...</h3>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => setIsOpen(false)}
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative mb-3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              className="input input-bordered w-full pl-10 input-sm"
              placeholder="Search friends and groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-lg border border-base-300">
            {(loadingFriends || loadingGroups) ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-sm" />
              </div>
            ) : filteredTargets.length === 0 ? (
              <div className="text-center py-6 text-sm opacity-60">
                No chats match your search.
              </div>
            ) : (
              filteredTargets.map((target) => {
                const isSelected = selectedTargets.has(target.id);
                const name = target.type === 'user' ? target.fullName : target.name;
                const pic = target.type === 'user' ? target.profilePic : target.avatar;

                return (
                  <label
                    key={target.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-base-200 ${
                      isSelected ? "bg-primary/10" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={isSelected}
                      onChange={() => toggleTarget(target.id)}
                    />
                    <ProfileAvatar src={pic} name={name} size="w-9 h-9" textSize="text-sm" />
                    <span className="text-sm font-medium truncate flex-1">
                      {name}
                    </span>
                    {target.type === 'group' && <span className="badge badge-sm badge-outline">Group</span>}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="p-5 border-t border-base-300">
          <button
            className="btn btn-primary w-full"
            disabled={selectedTargets.size === 0 || isForwarding}
            onClick={handleForward}
          >
            {isForwarding ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Forwarding...
              </>
            ) : (
              <>
                <SendIcon className="size-4" />
                Send ({selectedTargets.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
