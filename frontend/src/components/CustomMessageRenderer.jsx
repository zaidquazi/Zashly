import {
  useMessageContext,
  MessageSimple,
} from "stream-chat-react";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import VoiceMessageBubble from "./VoiceMessageBubble";
import PollBubble from "./PollBubble";
import CustomMessageActionBar from "./CustomMessageActionBar";
import DoubleTickIndicator from "./DoubleTickIndicator";
import { useMultiSelect } from "../context/MultiSelectContext";
import useLongPress from "../hooks/useLongPress";
import { Check } from "lucide-react";

const WhatsAppLightbox = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex(prev => Math.max(0, prev - 1));
      if (e.key === 'ArrowRight') setCurrentIndex(prev => Math.min(images.length - 1, prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, images.length]);

  if (!images || images.length === 0) return null;
  const currentImage = images[currentIndex];

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="flex justify-between items-center p-4 z-10 bg-gradient-to-b from-black/50 to-transparent absolute top-0 w-full">
        <div className="flex items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div className="text-white font-medium">
            {images.length > 1 ? `${currentIndex + 1} of ${images.length}` : 'Image'}
          </div>
        </div>
        <a 
          href={currentImage} 
          download 
          target="_blank" 
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()} 
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <Download className="size-6" />
        </a>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative mt-16">
        <img 
          src={currentImage} 
          alt="Attachment" 
          className="max-w-full max-h-full object-contain select-none transition-transform duration-300" 
          onClick={(e) => e.stopPropagation()}
        />
        
        {currentIndex > 0 && (
          <button 
            className="absolute left-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(c => c - 1); }}
          >
            ❮
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button 
            className="absolute right-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(c => c + 1); }}
          >
            ❯
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

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
  const { message, isMyMessage } = useMessageContext();
  const [lightboxData, setLightboxData] = useState(null);
  
  // Selection Mode State
  const { isSelectionMode, selectedMessages, toggleSelection, startSelection } = useMultiSelect();
  const isSelected = selectedMessages.some(m => m.id === message?.id);

  const isOwn = isMyMessage();
  const senderName = message?.user?.name || "Unknown";
  const tickStatus = isOwn ? getTickStatus(message) : null;

  const handleSelectionClick = (e) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(message);
    }
  };

  const handleLongPress = () => {
    if (!isSelectionMode && message && message.type !== 'deleted' && !message.deleted_at) {
      startSelection(message);
    }
  };

  const longPressProps = useLongPress(handleLongPress, undefined, { shouldPreventDefault: false, delay: 400 });

  const handleContextMenu = (e) => {
    if (!isSelectionMode && message && message.type !== 'deleted' && !message.deleted_at) {
      e.preventDefault();
      startSelection(message);
    }
  };

  const handleMessageClickCapture = (e) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(message);
      return;
    }

    // Ensure we only trigger on images that are part of Stream's attachment gallery/image
    const imgEl = e.target.closest('.str-chat__gallery-image img, .str-chat__message-attachment--image img');
    const galleryEl = e.target.closest('.str-chat__gallery-image, .str-chat__message-attachment--image, .str-chat__gallery');
    
    if (imgEl || galleryEl) {
      e.preventDefault();
      e.stopPropagation();
      
      const imageAttachments = message?.attachments?.filter(a => a.type === 'image') || [];
      let imageUrls = imageAttachments.map(a => a.image_url || a.fallback || a.asset_url || a.thumb_url).filter(Boolean);
      
      if (imageUrls.length === 0 && imgEl?.src) {
        imageUrls = [imgEl.src];
      }

      let initialIndex = 0;
      if (imgEl?.src && imageUrls.length > 0) {
        // Try to match the clicked image source to set correct initial index
        const clickedSrc = imgEl.src;
        const matchedIndex = imageUrls.findIndex(url => clickedSrc.includes(url) || url.includes(clickedSrc));
        if (matchedIndex !== -1) initialIndex = matchedIndex;
      }

      if (imageUrls.length > 0) {
        setLightboxData({ images: imageUrls, initialIndex });
      }
    }
  };

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

  let content = null;

  if (voiceAttachment) {
    content = (
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
  } else if (pollId) {
    content = (
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
  } else {
    // Default Stream Chat message rendering with capture for images
    content = (
      <div onClickCapture={handleMessageClickCapture}>
        <MessageSimple {...restProps} />
        {lightboxData && (
          <WhatsAppLightbox 
            images={lightboxData.images} 
            initialIndex={lightboxData.initialIndex} 
            onClose={() => setLightboxData(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div 
      className={`message-selectable-wrapper ${isSelectionMode ? 'message-selection-mode' : ''}`}
      {...longPressProps}
      onContextMenu={handleContextMenu}
      onClickCapture={handleSelectionClick}
    >
      {isSelected && (
        <>
          <div className="message-selected-overlay" />
          <div className="selection-checkbox">
            <Check className="size-4" strokeWidth={3} />
          </div>
        </>
      )}
      {content}
    </div>
  );
};

export default CustomMessageRenderer;
