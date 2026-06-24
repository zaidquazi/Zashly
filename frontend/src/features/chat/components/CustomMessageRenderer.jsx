import {
  useMessageContext,
  MessageSimple,
  MessageProvider,
  useChatContext
} from "stream-chat-react";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2, Trash2, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { deleteGroupMessage } from "../lib/groupApi";
import VoiceMessageBubble from "./VoiceMessageBubble";
import PollBubble from "./PollBubble";
import CustomMessageActionBar from "./CustomMessageActionBar";
import DoubleTickIndicator from "./DoubleTickIndicator";
import ProfileAvatar from "./ProfileAvatar";

/**
 * Derive tick status from Stream message state.
 *  - "read"      → at least one other user has read it
 *  - "delivered"  → message has been delivered to others
 *  - "sent"       → message was sent but not yet delivered
 */
function getTickStatus(message) {
  // Stream uses `readBy` or `read_by` to track readers
  const readBy = message?.readBy || message?.read_by || [];
  if (readBy.length > 0) return "read";

  // Stream marks status on the message
  const status = message?.status;
  if (status === "received") return "delivered";
  return "sent";
}

/**
 * Custom message renderer that intercepts Stream Chat messages and renders:
 * - VoiceMessageBubble (with action bar) for voice messages
 * - PollBubble (with action bar) for poll messages
 * - Default Stream rendering for everything else
 *
 * The outer .cmr-row div takes full width and pushes own-messages to the RIGHT.
 */
const CustomMessageRenderer = ({ socket, isGroupChat, isGroupAdmin, ...restProps }) => {
  const ctx = useMessageContext();
  const { message, isMyMessage } = ctx;
  const { client } = useChatContext();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const imageAttachments = message?.attachments?.filter(
    (att) => att.type === "image" || att.image_url || att.thumb_url
  ) || [];

  const handlePrevImage = useCallback((e) => {
    e.stopPropagation();
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  }, [lightboxIndex]);

  const handleNextImage = useCallback((e) => {
    e.stopPropagation();
    if (lightboxIndex < imageAttachments.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  }, [lightboxIndex, imageAttachments.length]);

  const handleDownload = useCallback(async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "downloaded-image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, "_blank");
    }
  }, []);

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "";
    }
  };

  const formatMsgDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return `Today at ${formatMsgTime(dateStr)}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${formatMsgTime(dateStr)}`;
      } else {
        return `${date.toLocaleDateString()} at ${formatMsgTime(dateStr)}`;
      }
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    if (lightboxIndex === -1) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxIndex(-1);
      } else if (e.key === "ArrowLeft" && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      } else if (e.key === "ArrowRight" && lightboxIndex < imageAttachments.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, imageAttachments]);

  const handleMessageClickCapture = useCallback((e) => {
    const target = e.target;
    const imgEl = target.tagName === 'IMG' ? target : target.closest('img');
    const isGalleryClick = target.closest('.str-chat__gallery') || target.closest('.str-chat__message-attachment--image');

    if ((imgEl || isGalleryClick) && imageAttachments.length > 0) {
      // Don't intercept clicks on avatar or action menus, just actual chat photos
      const isSystemIcon = imgEl && (
        imgEl.classList.contains('str-chat__avatar-image') || 
        imgEl.closest('.str-chat__avatar') ||
        imgEl.closest('.str-chat__message-actions')
      );
      if (isSystemIcon) return;

      e.preventDefault();
      e.stopPropagation();

      let index = -1;
      if (imgEl) {
        const src = imgEl.src;
        index = imageAttachments.findIndex(
          (att) => att.image_url === src || att.thumb_url === src || att.asset_url === src || src.includes(att.image_url) || src.includes(att.thumb_url)
        );
      }

      setLightboxIndex(index !== -1 ? index : 0);
    }
  }, [imageAttachments]);

  const isOwn = isMyMessage();
  const senderName = message?.user?.name || "Unknown";
  const tickStatus = isOwn ? getTickStatus(message) : null;

  // Hide completely if deleted for me
  try {
    const deletedForMe = JSON.parse(localStorage.getItem("deletedMessagesForMe") || "[]");
    if (message?.id && deletedForMe.includes(message.id)) {
      return null;
    }
  } catch (e) {
    // Ignore parse errors
  }

  // If the message has been deleted globally, let Stream native renderer handle it
  // (it will display the "Message deleted" tombstone)
  if (message?.type === "deleted" || message?.deleted_at) {
    return <MessageSimple {...restProps} />;
  }

  // Check for voice message attachment
  const voiceAttachment = message?.attachments?.find(
    (att) => att.type === "voice_message"
  );

  // Check for poll message (our custom field — NOT Stream's native poll_id)
  const pollId = message?.custom_poll_id;

  if (voiceAttachment) {
    return (
      <div className={`premium-bubble-wrapper ${isOwn ? "own" : "other"}`}>
        <CustomMessageActionBar isOwn={isOwn} isGroupAdmin={isGroupAdmin} isGroupChat={isGroupChat}>
          <VoiceMessageBubble
            audioSrc={voiceAttachment.audio_src}
            duration={voiceAttachment.duration}
            isOwn={isOwn}
            senderName={senderName}
            isGroupChat={isGroupChat}
          />
          {isOwn && tickStatus && (
            <div className="cmr-tick-row">
              <DoubleTickIndicator status={tickStatus} />
            </div>
          )}
        </CustomMessageActionBar>
      </div>
    );
  }

  if (pollId) {
    return (
      <div className={`premium-bubble-wrapper ${isOwn ? "own" : "other"}`}>
        <CustomMessageActionBar isOwn={isOwn} isGroupAdmin={isGroupAdmin} isGroupChat={isGroupChat}>
          <PollBubble
            pollId={pollId}
            isOwn={isOwn}
            senderName={senderName}
            isGroupChat={isGroupChat}
            socket={socket}
          />
          {isOwn && tickStatus && (
            <div className="cmr-tick-row">
              <DoubleTickIndicator status={tickStatus} />
            </div>
          )}
        </CustomMessageActionBar>
      </div>
    );
  }

  // Logic for standard text messages delete
  const handleCustomDelete = async (type) => {
    if (!message?.id) return;
    
    setDeleting(type);
    try {
      if (type === "everyone") {
        if (!isOwn && isGroupAdmin && isGroupChat) {
          const groupId = client.activeChannels[message.cid]?.id;
          if (groupId) {
            await deleteGroupMessage(groupId, message.id);
          }
        } else {
          await client.deleteMessage(message.id, { hard: true });
        }
        toast.success("Deleted for everyone");
      } else if (type === "me") {
        try {
          const deletedForMe = JSON.parse(localStorage.getItem("deletedMessagesForMe") || "[]");
          if (!deletedForMe.includes(message.id)) {
            deletedForMe.push(message.id);
            localStorage.setItem("deletedMessagesForMe", JSON.stringify(deletedForMe));
          }
        } catch (e) {
          // ignore
        }
        
        const channel = client.activeChannels[message.cid];
        if (channel) {
          channel.state.removeMessage({ id: message.id });
        }
        toast.success("Deleted for me");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete message");
    } finally {
      setDeleting(null);
      setDeleteModalOpen(false);
    }
  };

  const overriddenCtx = {
    ...ctx,
    handleDelete: (e) => {
      e?.preventDefault();
      setDeleteModalOpen(true);
    }
  };

  const activeAttachment = lightboxIndex !== -1 ? imageAttachments[lightboxIndex] : null;
  const activeImgUrl = activeAttachment?.image_url || activeAttachment?.asset_url || activeAttachment?.thumb_url;

  const lightboxModal = lightboxIndex !== -1 && activeImgUrl
    ? createPortal(
        <div 
          className="fixed inset-0 bg-neutral-950/95 backdrop-blur-sm z-[99999] flex flex-col justify-between select-none animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(-1)}
        >
          {/* Header */}
          <div 
            className="w-full h-16 px-6 bg-neutral-900/80 backdrop-blur-md flex items-center justify-between text-white border-b border-neutral-800 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <ProfileAvatar 
                src={message.user?.image || message.user?.profilePic} 
                name={message.user?.name || message.user?.fullName || "User"} 
                size="w-10 h-10"
                textSize="text-base"
                className="border border-neutral-700"
              />
              <div>
                <div className="font-semibold text-[15px] text-neutral-100">{message.user?.name || "User"}</div>
                <div className="text-[12px] text-neutral-400">
                  {formatMsgDate(message.created_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {imageAttachments.length > 1 && (
                <span className="text-sm text-neutral-400 mr-2 bg-neutral-800/80 px-2.5 py-1 rounded-full">
                  {lightboxIndex + 1} / {imageAttachments.length}
                </span>
              )}
              <button 
                onClick={() => handleDownload(activeImgUrl, activeAttachment?.fallback || 'image.jpg')}
                className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition active:scale-95"
                title="Download"
              >
                <Download className="size-5" />
              </button>
              <button 
                onClick={() => setLightboxIndex(-1)}
                className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition active:scale-95"
                title="Close"
              >
                <X className="size-6" />
              </button>
            </div>
          </div>

          {/* Body / Main Viewport */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            {imageAttachments.length > 1 && lightboxIndex > 0 && (
              <button 
                onClick={handlePrevImage}
                className="absolute left-6 p-3 rounded-full bg-neutral-900/60 hover:bg-neutral-800/80 text-white transition active:scale-95 border border-neutral-800 z-10"
                title="Previous image"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            <img 
              src={activeImgUrl} 
              alt="Preview" 
              className="max-w-[90vw] max-h-[75vh] object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200 select-none"
              onClick={(e) => e.stopPropagation()}
            />

            {imageAttachments.length > 1 && lightboxIndex < imageAttachments.length - 1 && (
              <button 
                onClick={handleNextImage}
                className="absolute right-6 p-3 rounded-full bg-neutral-900/60 hover:bg-neutral-800/80 text-white transition active:scale-95 border border-neutral-800 z-10"
                title="Next image"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* Footer (Caption) */}
          {message.text && (
            <div 
              className="w-full py-4 px-6 bg-neutral-900/80 backdrop-blur-md text-center text-neutral-200 border-t border-neutral-800 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm max-w-2xl mx-auto break-words whitespace-pre-wrap">{message.text}</p>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div onClickCapture={handleMessageClickCapture} className="contents">
        <MessageProvider value={overriddenCtx}>
          <MessageSimple {...restProps} />
        </MessageProvider>
      </div>
      {lightboxModal}

      {/* Delete Selection Modal */}
      {deleteModalOpen && (
        <div className="modal modal-open z-[100] cursor-default">
          <div className="modal-box max-w-sm chat-modal-3d" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 text-center">Delete Message?</h3>
            <div className="flex flex-col gap-3">
              {(isOwn || (isGroupAdmin && isGroupChat)) && (
                <button 
                  className="btn btn-error btn-outline flex items-center justify-center gap-2"
                  onClick={() => handleCustomDelete("everyone")}
                  disabled={deleting !== null}
                >
                  {deleting === "everyone" ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  {deleting === "everyone" ? "Deleting…" : "Delete for everyone"}
                </button>
              )}
              
              <button 
                className="btn btn-error flex items-center justify-center gap-2"
                onClick={() => handleCustomDelete("me")}
                disabled={deleting !== null}
              >
                {deleting === "me" ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {deleting === "me" ? "Deleting…" : "Delete for me"}
              </button>

              <button 
                className="btn btn-ghost mt-2" 
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting !== null}
              >
                Cancel
              </button>
            </div>
          </div>
          <div 
            className="modal-backdrop bg-black/40" 
            onClick={(e) => {
              e.stopPropagation();
              if (deleting === null) setDeleteModalOpen(false);
            }}
          ></div>
        </div>
      )}
    </>
  );
};

export default CustomMessageRenderer;
