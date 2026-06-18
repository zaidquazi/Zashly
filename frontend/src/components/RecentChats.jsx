import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getAuthUser, getStreamToken, getUserFriends } from "../lib/api";
import { connectStreamUser } from "../lib/streamClient";
import { StreamChat } from "stream-chat";
import ProfileAvatar from "../components/ProfileAvatar";
import NotificationBadge from "../components/NotificationBadge";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export default function RecentChats() {
  const navigate = useNavigate();

  const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: getAuthUser });
  const { data: tokenData } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });
  const { data: friends = [] } = useQuery({ queryKey: ["friends"], queryFn: getUserFriends });

  const auth = useMemo(() => (authUser && authUser.user ? authUser.user : authUser), [authUser]);

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // { channelId: count }

  // ── Compute unread counts from channels ────────────────────
  const refreshUnreadCounts = useCallback((channelList) => {
    const counts = {};
    channelList.forEach((ch) => {
      try {
        const count = ch.countUnread?.() ?? 0;
        if (count > 0) {
          counts[ch.id] = count;
        }
      } catch {
        // countUnread may not be available
      }
    });
    setUnreadCounts(counts);
  }, []);

  useEffect(() => {
    let client;
    let mounted = true;

    const init = async () => {
      if (!auth || !tokenData?.token || !STREAM_API_KEY) {
        setLoading(false);
        return;
      }
      try {
        const userId = auth?._id || auth?.id || auth?.userId;
        if (!userId) throw new Error('The "id" field on the user is missing');
        setCurrentUserId(userId);

        client = await connectStreamUser(auth, tokenData.token);
        if (!client) {
          setLoading(false);
          return;
        }

        const fetchChannels = async () => {
          try {
            const qs = await client.queryChannels(
              { type: "messaging", members: { $in: [userId] } },
              [
                { last_message_at: -1 },
                { updated_at: -1 },
              ],
              { watch: true, state: true, limit: 20 }
            );
            if (!mounted) return;
            setChannels(qs);
            refreshUnreadCounts(qs);
          } catch (err) {
            console.error("RecentChats fetchChannels error", err);
          }
        };

        await fetchChannels();

        const onMessageNew = async (event) => {
          if (!event?.channel) return;
          const evCh = event.channel;
          setChannels((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) return prev;
            const idx = prev.findIndex((c) => c.id === evCh.id);
            if (idx === -1) {
              // Not in current list, re-query
              fetchChannels();
              return prev;
            }
            const updated = [...prev];
            updated[idx] = evCh;
            // Move updated channel to top by recency
            updated.sort((a, b) => {
              const aTs = a.state?.last_message_at || a.state?.updated_at || a.state?.messages?.slice(-1)[0]?.created_at;
              const bTs = b.state?.last_message_at || b.state?.updated_at || b.state?.messages?.slice(-1)[0]?.created_at;
              return new Date(bTs) - new Date(aTs);
            });
            // Refresh unread counts with the updated list
            refreshUnreadCounts(updated);
            return updated;
          });
        };

        // Listen for mark-read events to update badges in real-time
        const onMarkRead = () => {
          setChannels((prev) => {
            refreshUnreadCounts(prev);
            return prev;
          });
        };

        const onAddedToChannel = async () => {
          await fetchChannels();
        };

        const onChannelUpdated = async () => {
          await fetchChannels();
        };

        client.on("message.new", onMessageNew);
        client.on("message.read", onMarkRead);
        client.on("notification.mark_read", onMarkRead);
        client.on("notification.added_to_channel", onAddedToChannel);
        client.on("channel.updated", onChannelUpdated);

        const cleanup = () => {
          client.off("message.new", onMessageNew);
          client.off("message.read", onMarkRead);
          client.off("notification.mark_read", onMarkRead);
          client.off("notification.added_to_channel", onAddedToChannel);
          client.off("channel.updated", onChannelUpdated);
        };
        init.cleanup = cleanup;
      } catch (e) {
        console.error("RecentChats init error", e);
      } finally {
        mounted && setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (init.cleanup) init.cleanup();
      // Do not disconnect here to avoid race with ChatPage
    };
  }, [auth, tokenData, refreshUnreadCounts]);

  const items = useMemo(() => {
    if (channels?.length) {
      return channels
        .map((ch) => {
          const members = Object.values(ch.state.members || {});
          // Only show direct messages (max 2 members, no custom group name)
          if (members.length > 2 || ch.data?.name) return null;

          const meId = currentUserId || auth?._id || auth?.id || auth?.userId;
          const otherMember = members.find((m) => (m.user?.id || m.user_id) !== meId);
          if (!otherMember) return null;
          const other = otherMember.user || { id: otherMember.user_id, name: otherMember.user_id, image: "" };
          const lastMsg = (ch.state.messages || []).slice(-1)[0];
          const preview = lastMsg?.text || (lastMsg?.attachments?.length ? "Attachment" : "");
          const ts = ch.state.last_message_at || ch.state.updated_at || lastMsg?.created_at;
          const unread = unreadCounts[ch.id] || 0;
          return {
            channelId: ch.id,
            id: other.id,
            name: other.name || other.fullName || "User",
            avatar: other.image || other.profilePic || "",
            lastText: preview,
            lastTime: ts ? new Date(ts) : null,
            unread,
          };
        })
        .filter(Boolean);
    }
    return (friends || []).map((f) => ({
      id: f._id || f.id,
      name: f.fullName || f.username,
      avatar: f.profilePic || "",
      lastText: "",
      lastTime: null,
      unread: 0,
    }));
  }, [channels, auth, friends, currentUserId, unreadCounts]);

  const compact = auth?.appSettings?.general?.compactChatList ?? false;

  if (loading) return null;
  if (!items?.length) return null;

  const formatTime = (d) => {
    if (!d) return "";
    try {
      return d.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
  };

  return (
    <section className="mt-6 space-y-3">
      <h3 className="text-lg font-semibold"> Chats</h3>
      <div className="block">
        <ul className="flex flex-col divide-y divide-base-200">
          {items.map((u, i) => (
            <li key={u.channelId || u.id || i}>
              <div
                className={`relative flex items-center gap-3 px-1 hover:bg-base-200/40 transition-colors cursor-pointer ${
                  compact ? "py-2" : "py-3"
                }`}
                onClick={() => navigate(`/chat/${u.id}`)}
              >
                <ProfileAvatar
                  src={u.avatar}
                  name={u.name}
                  size={compact ? "w-9 h-9" : "w-12 h-12"}
                  textSize={compact ? "text-sm" : "text-lg"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className={`font-medium truncate ${u.unread > 0 ? "font-bold" : ""}`}>{u.name}</div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <NotificationBadge count={u.unread} show={u.unread > 0} color="green" />
                      <div className={`text-[10px] sm:text-xs whitespace-nowrap ${u.unread > 0 ? "text-primary font-semibold" : "opacity-60"}`}>
                        {formatTime(u.lastTime)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm truncate ${u.unread > 0 ? "opacity-90 font-medium" : "opacity-70"}`}>
                    {u.lastText || "Tap to message"}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
