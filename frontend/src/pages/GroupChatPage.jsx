import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGroupById } from "../lib/groupApi";
import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken } from "../lib/api";
import { connectStreamUser } from "../lib/streamClient";
import GroupInfoPanel from "../components/GroupInfoPanel";
import PinnedMessagesBar from "../components/PinnedMessagesBar";
import ChatEffectsWrapper from "../components/ChatEffectsWrapper";

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChannelStateContext,
  useChatContext,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import "../chat-redesign.css";
import ChatLoader from "../components/ChatLoader";
import { InfoIcon, Trash2Icon, Moon, Sun, Phone, Video } from "lucide-react";
import { useCallSession } from "../features/calls/hooks/useCallSession";
import useCallStore from "../features/calls/store/callSlice";
import CustomMessageRenderer from "../components/CustomMessageRenderer";
import CustomMessageInput from "../components/CustomMessageInput";
import useSocket from "../hooks/useSocket";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
let envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "";

if (envApiUrl.includes("localhost") && currentHost !== "localhost") {
  envApiUrl = envApiUrl.replace("localhost", currentHost);
}

const SOCKET_URL = envApiUrl || `http://${currentHost}:5002`;

// ── Gradient helper ────────────────────────────────────────
function getAvatarGradient(name) {
  const colors = [
    ["#6366f1", "#8b5cf6"], ["#ec4899", "#f43f5e"],
    ["#14b8a6", "#06b6d4"], ["#f59e0b", "#ef4444"],
    ["#22c55e", "#10b981"], ["#3b82f6", "#6366f1"],
    ["#a855f7", "#ec4899"], ["#f97316", "#f59e0b"],
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── Custom header that reads avatar from React Query group cache ──
// Matches Stream's str-chat__header-livestream styling


const GroupChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [chatTheme, setChatTheme] = useState(() => {
    return localStorage.getItem("stream-chat-theme") || "str-chat__theme-dark";
  });

  const toggleChatTheme = () => {
    const newTheme = chatTheme === "str-chat__theme-dark" ? "str-chat__theme-light" : "str-chat__theme-dark";
    setChatTheme(newTheme);
    localStorage.setItem("stream-chat-theme", newTheme);
  };
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const socketRef = useRef(null);
  const { socket } = useSocket();
  const { startGroupCall } = useCallSession();
  const callState = useCallStore((s) => s.callState);

  const CustomGroupHeader = ({ group }) => {
    const { watcher_count } = useChannelStateContext();
    if (!group) return null;
    const [from, to] = getAvatarGradient(group.name);
    const initial = (group.name || "?")[0].toUpperCase();
    const onlineCount = watcher_count ?? 0;

    return (
      <div className="premium-chat-header">
        <div className="premium-chat-header-info" onClick={() => setShowInfo(true)}>
          <div className="relative">
            <div
              className="str-chat__avatar str-chat__avatar--rounded"
              style={{ width: 40, height: 40, flexShrink: 0 }}
            >
              {group.avatar ? (
                <img
                  src={group.avatar}
                  alt={group.name}
                  style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${from}, ${to})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 16,
                  }}
                >
                  {initial}
                </div>
              )}
            </div>
          </div>
          <div className="premium-chat-header-text">
            <p className="premium-chat-header-name">
              {group.name}
            </p>
            <p className="premium-chat-header-status">
              {group.members?.length ?? 0} members{onlineCount > 0 ? `, ${onlineCount} online` : ""}
            </p>
          </div>
        </div>

        <div className="premium-chat-header-actions">
          <button
            type="button"
            className="premium-icon-btn call-voice"
            disabled={callState !== "idle"}
            onClick={(e) => {
              e.stopPropagation();
              startGroupCall({ groupId, groupName: group.name, type: "voice" });
            }}
            title="Group voice call"
          >
            <Phone className="size-4 sm:size-5" />
          </button>
          <button
            type="button"
            className="premium-icon-btn call-video"
            disabled={callState !== "idle"}
            onClick={(e) => {
              e.stopPropagation();
              startGroupCall({ groupId, groupName: group.name, type: "video" });
            }}
            title="Group video call"
          >
            <Video className="size-4 sm:size-5" />
          </button>
          <button
            type="button"
            className="premium-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleChatTheme();
            }}
            title="Toggle Theme"
          >
            {chatTheme === "str-chat__theme-dark" ? (
              <Sun className="size-4 sm:size-5 text-warning" />
            ) : (
              <Moon className="size-4 sm:size-5" />
            )}
          </button>


        </div>
      </div>
    );
  };

  // 1. Fetch Group Details locally from MongoDB
  const {
    data: group,
    isLoading: loadingGroup,
    refetch: refetchGroup,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupById(groupId),
    enabled: !!groupId,
  });



  // 2. Fetch Stream Token
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Connect socket for poll real-time updates and other group chat events
  useEffect(() => {
    if (!socket || !authUser) return;
    socketRef.current = socket;
  }, [socket, authUser, groupId]);

  // 3. Initialize Stream Chat
  useEffect(() => {
    const initChat = async () => {
      // Wait for everything to be ready before connecting
      if (!tokenData?.token || !authUser || !group || !groupId) return;

      try {
        const desiredId = String(authUser._id);
        
        const client = await connectStreamUser(authUser, tokenData.token);
        if (!client) return;

        // Map local members to Stream IDs
        const memberIds = group.members.map(m => String(m._id));
        
        // Ensure current user is in the member list
        if (!memberIds.includes(desiredId)) {
          memberIds.push(desiredId);
        }

        const currChannel = client.channel("messaging", groupId, {
          name: group.name,
          image: group.avatar || "https://getstream.io/random_svg/?id=group",
          members: memberIds,
        });

        const shouldMarkRead = authUser?.privacySettings?.readReceipts !== false;
        await currChannel.watch({ mark_read: shouldMarkRead });

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing stream chat:", error);
        toast.error("Could not connect to group chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Cleanup isn't strictly necessary to disconnect user here as ChatPage might be used next
  }, [tokenData, authUser, group, groupId]);

  // Handle group updates from info panel
  // Updates React Query cache → CustomGroupHeader re-renders instantly
  const handleGroupUpdated = (updatedGroup) => {
    if (updatedGroup) {
      queryClient.setQueryData(["group", groupId], updatedGroup);
      // Only update name on Stream (skip image — Stream rejects base64)
      if (channel) {
        channel.update({ name: updatedGroup.name }).catch(console.error);
      }
    } else {
      refetchGroup();
    }
  };

  const handleClearChat = async () => {
    try {
      await channel.truncate();
      toast.success("Group chat cleared successfully");
      setShowClearModal(false);
    } catch (error) {
      console.error("Error clearing group chat:", error);
      toast.error("Failed to clear group chat");
    }
  };

  // Custom message component wrapper for group chat
  const isAdmin = group?.admin?._id === authUser?._id || group?.admin === authUser?._id;
  const MessageWithExtras = useCallback(
    (props) => (
      <CustomMessageRenderer
        {...props}
        socket={socketRef.current}
        isGroupChat={true}
        isGroupAdmin={isAdmin}
      />
    ),
    [isAdmin]
  );

  const PinnedMessagesSection = () => {
    const { pinnedMessages, channel } = useChannelStateContext();
    const { client } = useChatContext();
    
    if (!pinnedMessages || pinnedMessages.length === 0) return null;

    const handleUnpin = async (messageId) => {
      try {
        const msgToUnpin = pinnedMessages.find(m => m.id === messageId);
        if (msgToUnpin) {
          await client.unpinMessage(msgToUnpin);
          toast.success("Message unpinned");
        }
      } catch (err) {
        toast.error("Failed to unpin");
      }
    };

    const handleJump = (messageId) => {
      // Stream MessageList handles jumping via state if we provide the right props, 
      // but simple scroll-to logic is often handled by internal MessageList.
      // For now, we'll just toast or leave as is if no easy jump API.
      // toast.info("Jumping to message...");
    };

    return <PinnedMessagesBar pinnedMessages={pinnedMessages} onUnpin={handleUnpin} onJumpToMessage={handleJump} />;
  };


  if (loadingGroup || loading || !chatClient || !channel) {
    return <ChatLoader />;
  }

  if (!group) {
    return (
      <div className="h-full gc-outer-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Group not found</p>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => navigate("/app")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const chatWallpaperStyle = authUser?.chatWallpaper
    ? { 
        backgroundImage: `url(${authUser.chatWallpaper})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  const showThreeBackground = !authUser?.chatWallpaper;

  return (
    <div className="h-full overflow-hidden relative">
      <Chat client={chatClient} theme={chatTheme}>
        <Channel channel={channel}>
          <ChatEffectsWrapper showBackground={showThreeBackground}>
            {({ onSendParticles }) => (
              <div 
                className={`w-full h-full relative transition-all duration-500 ${
                  authUser?.chatWallpaper 
                    ? 'bg-transparent' 
                    : chatTheme === 'str-chat__theme-light'
                      ? 'bg-base-100 text-base-content'
                      : 'chat-3d-bg'
                }`}
                style={chatWallpaperStyle}
              >
                {/* Stream Window with custom header that syncs with MongoDB */}
                <Window>
                  <CustomGroupHeader
                    group={group}
                  />
                  <PinnedMessagesSection />
                  <MessageList Message={MessageWithExtras} />
                  <MessageInput
                    focus
                    additionalTextareaProps={{
                      onKeyDown: (e) => {
                        const enterToSend =
                          authUser?.appSettings?.general?.enterToSend ?? true;
                        if (!enterToSend && e.key === "Enter" && !e.shiftKey) {
                          e.stopPropagation();
                        }
                      },
                    }}
                    Input={(props) => (
                      <CustomMessageInput
                        {...props}
                        isGroupChat={true}
                        onSendParticles={onSendParticles}
                      />
                    )}
                  />
                </Window>


                {/* Clear Chat Confirmation Modal */}
                {showClearModal && (
                  <div className="modal modal-open z-[100]">
                    <div className="modal-box chat-modal-3d">
                      <h3 className="font-bold text-lg">Clear Group Chat?</h3>
                      <p className="py-4">Are you sure you want to delete all messages in this group? This action cannot be undone and will affect all members.</p>
                      <div className="modal-action">
                        <button className="btn btn-ghost" onClick={() => setShowClearModal(false)}>Cancel</button>
                        <button className="btn btn-error" onClick={handleClearChat}>Clear All</button>
                      </div>
                    </div>
                    <div className="modal-backdrop bg-black/40" onClick={() => setShowClearModal(false)}></div>
                  </div>
                )}
              </div>
            )}
          </ChatEffectsWrapper>
          
          <Thread />
        </Channel>
      </Chat>

      <GroupInfoPanel
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        group={group}
        onGroupUpdated={handleGroupUpdated}
      />
    </div>
  );
};

export default GroupChatPage;
