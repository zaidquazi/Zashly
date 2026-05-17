import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useStartCall from "../hooks/useStartCall";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import CustomMessageRenderer from "../components/CustomMessageRenderer";
import CustomMessageInput from "../components/CustomMessageInput";
import UserProfileModal from "../components/UserProfileModal";
import ChatEffectsWrapper from "../components/ChatEffectsWrapper";

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChannelStateContext,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import io from "socket.io-client";
import ProfileAvatar from "../components/ProfileAvatar";
import { Phone, Video, Trash2Icon } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5002";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const socketRef = useRef(null);

  const { authUser } = useAuthUser();
  const { startCall } = useStartCall();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const receiveSoundRef = useRef(null);
  const sendSoundRef = useRef(null);


  const CustomHeader = () => {
    const { channel } = useChannelStateContext();
    if (!channel) return null;

    const members = Object.values(channel.state.members);
    const otherMember = members.find((m) => m.user.id !== authUser?._id);
    const displayUser = otherMember?.user || {};
    const isOnline = displayUser.online;

    return (
      <div className="chat-header-3d">
        <div 
          className="chat-header-user"
          onClick={() => setShowProfile(true)}
        >
          <div className="chat-header-avatar-wrap">
            <ProfileAvatar 
              src={displayUser.image || displayUser.profilePic} 
              name={displayUser.name || displayUser.fullName || "User"} 
              size="w-10 h-10" 
              textSize="text-base" 
            />
            {isOnline && (
              <span className="chat-status-dot chat-status-online" />
            )}
          </div>
          <div className="chat-header-info">
            <p className="chat-header-name">
              {displayUser.name || displayUser.fullName || "User"}
            </p>
            <p className="chat-header-status">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            className="chat-header-action-btn"
            onClick={handleVoiceCall}
            title="Voice Call"
          >
            <Phone className="size-4 sm:size-5 text-success" />
          </button>

          <button
            className="chat-header-action-btn"
            onClick={handleVideoCall}
            title="Video Call"
          >
            <Video className="size-4 sm:size-5 text-primary" />
          </button>

          <button
            className="chat-header-action-btn chat-header-action-danger"
            onClick={(e) => {
              e.stopPropagation();
              setShowClearModal(true);
            }}
            title="Clear Chat"
          >
            <Trash2Icon className="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    );
  };

  const handleClearChat = async () => {
    try {
      await channel.truncate();
      toast.success("Chat cleared successfully");
      setShowClearModal(false);
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat");
    }
  };

  // Connect socket for poll real-time updates
  useEffect(() => {
    if (!authUser) return;
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [authUser]);

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);
        const desiredId = String(authUser._id);
        // Only pass image if it's a URL, not a base64 string (base64 exceeds Stream's 5KB user data limit)
        const userImage = authUser.profilePic && !authUser.profilePic.startsWith('data:') ? authUser.profilePic : '';
        if (!client.userID) {
          await client.connectUser(
            {
              id: desiredId,
              name: authUser.fullName,
              image: userImage,
            },
            tokenData.token
          );
        } else if (client.userID !== desiredId) {
          await client.disconnectUser();
          await client.connectUser(
            {
              id: desiredId,
              name: authUser.fullName,
              image: userImage,
            },
            tokenData.token
          );
        }

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        const shouldMarkRead = authUser?.privacySettings?.readReceipts !== false;
        await currChannel.watch({ mark_read: shouldMarkRead });

        // Get target user info from channel members
        const members = Object.values(currChannel.state.members);
        const target = members.find((m) => m.user_id !== desiredId);
        if (target?.user) {
          setTargetUser({
            id: target.user.id,
            name: target.user.name || "User",
            image: target.user.image || "",
            createdAt: target.user.created_at,
          });
        }

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVoiceCall = () => {
    startCall({
      callType: "voice",
      type: "one-on-one",
      targetId: targetUserId,
      targetName: targetUser?.name || "User",
      targetPic: targetUser?.image || "",
    });
  };

  const handleVideoCall = () => {
    startCall({
      callType: "video",
      type: "one-on-one",
      targetId: targetUserId,
      targetName: targetUser?.name || "User",
      targetPic: targetUser?.image || "",
    });
  };

  // Custom message component wrapper
  const MessageWithExtras = useCallback(
    (props) => (
      <CustomMessageRenderer
        {...props}
        socket={socketRef.current}
        isGroupChat={false}
      />
    ),
    []
  );


  if (loading || !chatClient || !channel) return <ChatLoader />;

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
    <div className="h-full relative overflow-hidden">
      <audio ref={receiveSoundRef} src="/message-receive.mp3" preload="auto" />
      <audio ref={sendSoundRef} src="/message-send.mp3" preload="auto" />

      <Chat client={chatClient}>
        <Channel channel={channel}>
          <ChatEffectsWrapper showBackground={showThreeBackground}>
            {({ onSendParticles }) => (
              <div 
                className={`w-full h-full relative transition-all duration-500 ${authUser?.chatWallpaper ? 'bg-transparent' : 'chat-3d-bg'}`}
                style={chatWallpaperStyle}
              >
                <Window>
                  <CustomHeader />
                  <MessageList Message={MessageWithExtras} />
                  <MessageInput focus Input={(props) => <CustomMessageInput {...props} isGroupChat={false} onSendParticles={onSendParticles} />} />
                </Window>
                
                {showProfile && (
                  <UserProfileModal 
                    user={targetUser} 
                    onClose={() => setShowProfile(false)}
                    onStartVoiceCall={handleVoiceCall}
                    onStartVideoCall={handleVideoCall}
                  />
                )}

                {/* Clear Chat Confirmation Modal */}
                {showClearModal && (
                  <div className="modal modal-open z-[100]">
                    <div className="modal-box chat-modal-3d">
                      <h3 className="font-bold text-lg">Clear Chat?</h3>
                      <p className="py-4">Are you sure you want to delete all messages in this chat? This action cannot be undone.</p>
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
    </div>
  );
};

export default ChatPage;
