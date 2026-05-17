import { useEffect, useRef, useCallback } from "react";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "./useAuthUser";
import useSocket from "./useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const useNotifications = () => {
  const { authUser } = useAuthUser();
  const notificationSoundRef = useRef(null);
  const hasPermissionRef = useRef(false);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // â”€â”€ Request browser notification permission on mount â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      hasPermissionRef.current = true;
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        hasPermissionRef.current = perm === "granted";
      });
    }
  }, []);

  // â”€â”€ Create a reusable Audio element â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const audio = new Audio(`/notification.mp3?v=${Date.now()}`);
    audio.volume = 0.6;
    audio.preload = "auto";
    audio.onerror = () => {
      notificationSoundRef.current = new Audio(
        `/notification.mp3?nocache=${Date.now()}`
      );
      notificationSoundRef.current.volume = 0.6;
    };
    notificationSoundRef.current = audio;
  }, []);

  // â”€â”€ Play notification sound â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const playSound = useCallback(() => {
    try {
      const audio = notificationSoundRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Browsers block autoplay until user interacts â€” silently ignore
        });
      }
    } catch {
      }
  }, []);

  // â”€â”€ Show browser notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const showBrowserNotification = useCallback((title, body, icon, onClick) => {
    if (!hasPermissionRef.current) return;

    try {
      const notification = new Notification(title, {
        body: body || "New message",
        icon: icon || "/icon.png",
        badge: "/icon.png",
        tag: `zashly-msg-${Date.now()}`,
  silent: true,
      });

      notification.onclick = () => {
        window.focus();
        if (onClick) onClick();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    } catch {
    }
  }, []);

  // ── Listener: New Friend Request (Socket.io) ──────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewFriendRequest = (data) => {
      playSound();
      
      const senderName = data.senderName || "Someone";
      const senderAvatar = data.sender?.profilePic || "/avatar.png";

      showBrowserNotification(
        "New Friend Request",
        `${senderName} sent you a friend request.`,
        senderAvatar,
        () => {
          window.location.href = "/notifications";
        }
      );

      toast.success(`${senderName} sent you a friend request!`, {
        icon: "👥",
        duration: 5000,
      });

      // Refresh the notifications page if the user is on it
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    };

    const handleNewNotification = (data) => {
      playSound();

      const senderName = data.sender?.fullName || "Someone";
      const senderAvatar = data.sender?.profilePic || "/avatar.png";

      let body = "";
      switch (data.type) {
        case "like":
          body = `${senderName} liked your post.`;
          break;
        case "comment":
          body = `${senderName} commented on your post.`;
          break;
        case "spark_like":
          body = `${senderName} liked your spark.`;
          break;
        case "spark_comment":
          body = `${senderName} commented on your spark.`;
          break;
        case "follow":
          body = `${senderName} started following you.`;
          break;
        default:
          body = "You have a new notification.";
      }

      showBrowserNotification("New Notification", body, senderAvatar, () => {
        window.location.href = "/notifications";
      });

      toast.success(body, {
        icon: "🔔",
        duration: 5000,
      });

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket.on("new-friend-request", handleNewFriendRequest);
    socket.on("new-notification", handleNewNotification);
    return () => {
      socket.off("new-friend-request", handleNewFriendRequest);
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, playSound, showBrowserNotification, queryClient]);

  // ── Listener: Stream Chat message.new ──────────────────────────
  useEffect(() => {
    if (!authUser?._id || !tokenData?.token || !STREAM_API_KEY) return;

    let client;
    let listenerCleanup;

    const setup = async () => {
      try {
        client = StreamChat.getInstance(STREAM_API_KEY);
        const userId = String(authUser._id);

        if (!client.userID) {
          const userImage =
            authUser.profilePic && !authUser.profilePic.startsWith("data:")
              ? authUser.profilePic
              : "";
          await client.connectUser(
            { id: userId, name: authUser.fullName, image: userImage },
            tokenData.token
          );
        }

        const handler = (event) => {
          if (event?.user?.id === userId) return;
          if (!event?.message) return;

          // ── Check if user is currently viewing this chat ──
          const currentPath = window.location.pathname;
          const channelId = event.channel_id || event?.cid?.split(":")[1];

          // 1-on-1: /chat/<otherUserId> — channel id is sorted ids joined with "-"
          // Group:  /group/<groupId>   — channel id is the groupId
          const isViewingThisChat =
            currentPath === `/chat/${event.user.id}` ||
            currentPath === `/group/${channelId}`;

          if (isViewingThisChat) return;

          // ── Play sound ──────────────────────────────────
          playSound();

          // ── Determine notification content ──────────────
          const senderName = event.user?.name || event.user?.id || "Someone";
          const senderAvatar = event.user?.image || "/icon.png";

          let messagePreview = event.message.text || "";
          if (!messagePreview && event.message.attachments?.length > 0) {
            const type = event.message.attachments[0].type;
            if (type === "image") messagePreview = "📷 Photo";
            else if (type === "video") messagePreview = "🎥 Video";
            else if (type === "audio") messagePreview = "🎙️ Voice message";
            else if (type === "file") messagePreview = "📎 File";
            else messagePreview = "📎 Attachment";
          }

          if (messagePreview.length > 80) {
            messagePreview = messagePreview.slice(0, 77) + "...";
          }

          const channelName = event.channel?.name;
          const title = channelName
            ? `${senderName} in ${channelName}`
            : senderName;

          // ── Show browser notification ───────────────────
          showBrowserNotification(title, messagePreview, senderAvatar, () => {
            if (channelName) {
              window.location.href = `/group/${channelId}`;
            } else {
              window.location.href = `/chat/${event.user.id}`;
            }
          });
        };

        client.on("message.new", handler);
        listenerCleanup = () => client.off("message.new", handler);
      } catch (err) {
        console.error("useNotifications setup error:", err);
      }
    };

    setup();

    return () => {
      if (listenerCleanup) listenerCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id, authUser?.fullName, authUser?.profilePic, tokenData?.token, playSound, showBrowserNotification]);
};

export default useNotifications;
