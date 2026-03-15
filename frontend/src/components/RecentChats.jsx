import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getAuthUser, getStreamToken, getUserFriends } from "../lib/api";
import { StreamChat } from "stream-chat";

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

        client = StreamChat.getInstance(STREAM_API_KEY);
        if (!client.userID) {
          // Only pass image if it's a URL, not a base64 string (base64 breaks WebSocket URL length limits)
          const userImage = auth?.profilePic && !auth.profilePic.startsWith('data:') ? auth.profilePic : '';
          await client.connectUser(
            {
              id: userId,
              name: auth?.fullName || auth?.username || "User",
              image: userImage,
            },
            tokenData.token
          );
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
            return updated;
          });
        };

        const onAddedToChannel = async () => {
          await fetchChannels();
        };

        const onChannelUpdated = async () => {
          await fetchChannels();
        };

        client.on("message.new", onMessageNew);
        client.on("notification.added_to_channel", onAddedToChannel);
        client.on("channel.updated", onChannelUpdated);

        const cleanup = () => {
          client.off("message.new", onMessageNew);
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
  }, [auth, tokenData]);

  const items = useMemo(() => {
    if (channels?.length) {
      return channels
        .map((ch) => {
          const members = Object.values(ch.state.members || {});
          const meId = currentUserId || auth?._id || auth?.id || auth?.userId;
          const otherMember = members.find((m) => (m.user?.id || m.user_id) !== meId);
          if (!otherMember) return null;
          const other = otherMember.user || { id: otherMember.user_id, name: otherMember.user_id, image: "" };
          const lastMsg = (ch.state.messages || []).slice(-1)[0];
          const preview = lastMsg?.text || (lastMsg?.attachments?.length ? "Attachment" : "");
          const ts = ch.state.last_message_at || ch.state.updated_at || lastMsg?.created_at;
          return {
            id: other.id,
            name: other.name || other.fullName || "User",
            avatar: other.image || other.profilePic || "",
            lastText: preview,
            lastTime: ts ? new Date(ts) : null,
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
    }));
  }, [channels, auth, friends, currentUserId]);

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
          {items.map((u) => (
            <li key={u.id}>
              <div
                className="relative flex items-center gap-3 py-3 px-1 hover:bg-base-200/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/chat/${u.id}`)}
              >
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} />
                    ) : (
                      <div className="bg-base-300 w-full h-full" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-xs opacity-60 whitespace-nowrap">{formatTime(u.lastTime)}</div>
                  </div>
                  <div className="text-sm opacity-70 truncate">
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
