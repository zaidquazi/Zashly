import { useState, useRef, useCallback, useEffect } from "react";
import {
  useChannelStateContext,
  useMessageInputContext,
  MessageInputFlat,
} from "stream-chat-react";
import { Mic, BarChart3, Loader2, Send } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import CreatePollModal from "./CreatePollModal";
import { createPoll } from "../lib/api";
import toast from "react-hot-toast";

/**
 * CustomMessageInputInner renders INSIDE the MessageInput context.
 * It adds Mic + Poll buttons before the default flat input UI.
 * Enhanced with particle burst + ripple on send.
 */
const CustomMessageInputInner = ({ isGroupChat = false, onSendParticles }) => {
  const [showRecorder, setShowRecorder] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [ripple, setRipple] = useState(false);
  const { channel } = useChannelStateContext();
  const sendBtnRef = useRef(null);

  // Watch for message sends to trigger particle effects
  useEffect(() => {
    if (!channel) return;
    const handleNewMessage = (event) => {
      if (event?.user?.id === channel._client?.userID) {
        // Trigger particle burst from send button
        if (onSendParticles && sendBtnRef.current) {
          const rect = sendBtnRef.current.getBoundingClientRect();
          const parent = sendBtnRef.current.closest(".chat-effects-wrapper");
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            onSendParticles(
              rect.left - parentRect.left + rect.width / 2,
              rect.top - parentRect.top + rect.height / 2
            );
          } else {
            onSendParticles();
          }
        }
        // Trigger send button ripple
        setRipple(true);
        setTimeout(() => setRipple(false), 600);
      }
    };
    channel.on("message.new", handleNewMessage);
    return () => channel.off("message.new", handleNewMessage);
  }, [channel, onSendParticles]);

  /**
   * Convert base64 data URL → Blob → File, then upload to Stream CDN.
   * Stream's channel.sendFile() returns { file: "<cdn_url>" }.
   * We store the CDN URL in the attachment so the payload stays tiny.
   */
  const handleVoiceSend = async (base64Audio, durationSec) => {
    setShowRecorder(false);
    setUploadingVoice(true);

    try {
      // 1. base64 → Blob
      const resp = await fetch(base64Audio);
      const blob = await resp.blob();

      // 2. Blob → File (give it a proper name so Stream accepts it)
      const file = new File([blob], `voice-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      // 3. Upload to Stream's CDN
      const { file: cdnUrl } = await channel.sendFile(file);

      // 4. Send a lightweight message referencing the CDN URL
      await channel.sendMessage({
        text: "🎤 Voice message",
        attachments: [
          {
            type: "voice_message",
            audio_src: cdnUrl,   // just the URL — well under 100 KB
            duration: durationSec,
            mime_type: "audio/webm",
          },
        ],
      });
    } catch (err) {
      console.error("Failed to send voice message:", err);
      toast.error("Failed to send voice message. Please try again.");
    } finally {
      setUploadingVoice(false);
    }
  };

  // Create poll in MongoDB then send a reference message via Stream
  const handlePollSubmit = async (pollData) => {
    try {
      const channelId = channel.id;
      const poll = await createPoll({ ...pollData, channelId });
      await channel.sendMessage({
        text: `📊 Poll: ${pollData.question}`,
        custom_poll_id: poll._id,
      });
    } catch (err) {
      console.error("Failed to create poll:", err);
      toast.error("Failed to create poll");
      throw err;
    }
  };

  const { text, handleSubmit } = useMessageInputContext();

  return (
    <>
      {/* Poll Creation Modal */}
      <CreatePollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onSubmit={handlePollSubmit}
      />

      {/* Main Input Row */}
      <div className="premium-input-area items-end relative" style={{ flexWrap: 'nowrap' }}>
        
        {/* Voice Recorder Overlay (absolutely positioned over the entire input area) */}
        {showRecorder && (
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setShowRecorder(false)}
          />
        )}
        {/* Poll button — group chats only */}
        {isGroupChat && (
          <div className="flex items-center justify-center shrink-0" style={{ height: '48px', marginRight: '4px' }}>
            <button
              className="premium-input-btn"
              onClick={() => setShowPollModal(true)}
              title="Create Poll"
              type="button"
            >
              <BarChart3 size={24} />
            </button>
          </div>
        )}

        {/* The Input "Bubble" */}
        <div className="premium-input-container" ref={sendBtnRef}>
          <MessageInputFlat />
        </div>

        {/* WhatsApp-style Mic/Send Button with Ripple */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ height: '48px' }}>
          {text && text.trim().length > 0 ? (
            <button
              className="premium-send-btn-wrapper bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              title="Send Message"
              type="button"
            >
              <Send size={20} className="text-white ml-1" />
            </button>
          ) : (
            <button
              className={`premium-send-btn-wrapper bg-emerald-500 hover:bg-emerald-600 ${ripple ? "wa-mic-ripple-active" : ""}`}
              onClick={() => !uploadingVoice && setShowRecorder(true)}
              title={uploadingVoice ? "Uploading…" : "Record voice message"}
              type="button"
              disabled={uploadingVoice}
            >
              {uploadingVoice ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <Mic size={24} className="text-white" />
              )}
            </button>
          )}
          {ripple && <span className="wa-mic-ripple-ring" />}
        </div>
      </div>
    </>
  );
};

/**
 * CustomMessageInput is passed as the `Input` prop to <MessageInput />.
 * Stream wraps it with the MessageInput context (handleSubmit, textareaRef, etc.)
 */
const CustomMessageInput = (props) => <CustomMessageInputInner {...props} />;

export default CustomMessageInput;
