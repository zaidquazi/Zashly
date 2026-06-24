import { useEffect, useRef, useCallback } from "react";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { connectStreamUser } from "../lib/streamClient";
import useAuthUser from "./useAuthUser";
import { getNotificationPrefs } from "../utils/appSettings";
import useSocket from "./useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { navigateTo } from "../lib/navigation";
import { isNative } from "../lib/platform";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const MOMENT_TYPES = new Set([
  "like",
  "comment",
  "spark_like",
  "spark_comment",
  "follow",
]);

const useNotifications = () => {
  const { authUser } = useAuthUser();
  const notifPrefs = getNotificationPrefs(authUser);
  const hasPermissionRef = useRef(false);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // ── Request browser notification permission on mount ──────
  useEffect(() => {
    // Skip browser Notification API in Capacitor native — FCM handles push there
    if (isNative()) return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      hasPermissionRef.current = true;
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        hasPermissionRef.current = perm === "granted";
      });
    }
  }, []);

  const playSound = useCallback(() => {
    if (!notifPrefs.soundEnabled) return;
    try {
      const audio = document.getElementById("global-notification-sound");
      if (audio) {
        audio.volume = 0.6;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.debug("Audio play error", err);
          });
        }
      }
    } catch (err) {
      console.debug("Audio play error", err);
    }
  }, [notifPrefs.soundEnabled]);

  const showBrowserNotification = useCallback((title, body, icon, onClick) => {
    if (!notifPrefs.desktopEnabled || !hasPermissionRef.current) return;

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
    } catch (err) {
      console.debug("Notification error", err);
    }
  }, [notifPrefs.desktopEnabled]);

  useEffect(() => {
    if (!socket) return;

    const handleNewFriendRequest = (data) => {
      if (!notifPrefs.friendRequests) return;
      playSound();
      
      const senderName = data.senderName || "Someone";
      const senderAvatar = data.sender?.profilePic || "/avatar.png";

      showBrowserNotification(
        "New Friend Request",
        `${senderName} sent you a friend request.`,
        senderAvatar,
        () => {
          navigateTo("/notifications");
        }
      );

      toast.success(`${senderName} sent you a friend request!`, {
        icon: "👥",
        duration: 5000,
      });

      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    };

    const handleNewNotification = (data) => {
      const isMoment = MOMENT_TYPES.has(data.type);
      if (isMoment && !notifPrefs.moments) return;
      if (!isMoment && !notifPrefs.messages) return;

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
        navigateTo("/notifications");
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
  }, [socket, playSound, showBrowserNotification, queryClient, notifPrefs]);

  useEffect(() => {
    if (!authUser?._id || !tokenData?.token || !STREAM_API_KEY) return;

    let client;
    let listenerCleanup;

    const setup = async () => {
      try {
        const userId = String(authUser._id);
        const connectedClient = await connectStreamUser(authUser, tokenData.token);
        if (!connectedClient) return;
        
        client = connectedClient;

        const handler = (event) => {
          if (event?.user?.id === userId) return;
          if (!event?.message) return;

          const channelName = event.channel?.name;
          const channelId = event.channel?.id;
          const isGroup = Boolean(channelName);
          if (isGroup && !notifPrefs.groups) return;
          if (!isGroup && !notifPrefs.messages) return;

          // ── Always play sound for new incoming messages ──
          playSound();

          const currentPath = window.location.pathname;
          const isViewingThisChat =
            currentPath === `/chat/${event.user.id}` ||
            (channelId && currentPath === `/group/${channelId}`);

          // Don't show toast/browser notification if already viewing the chat
          if (isViewingThisChat) return;

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

          const title = channelName
            ? `${senderName} in ${channelName}`
            : senderName;

          showBrowserNotification(title, messagePreview, senderAvatar, () => {
            if (channelName) {
              navigateTo(`/group/${channelId}`);
            } else {
              navigateTo(`/chat/${event.user.id}`);
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
  }, [
    authUser,
    tokenData?.token,
    playSound,
    showBrowserNotification,
    notifPrefs,
  ]);
};

export default useNotifications;
