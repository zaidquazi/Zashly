import {
  useMessageContext,
  MessageSimple,
} from "stream-chat-react";
import VoiceMessageBubble from "./VoiceMessageBubble";
import PollBubble from "./PollBubble";
import CustomMessageActionBar from "./CustomMessageActionBar";
import DoubleTickIndicator from "./DoubleTickIndicator";

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

  const isOwn = isMyMessage();
  const senderName = message?.user?.name || "Unknown";
  const tickStatus = isOwn ? getTickStatus(message) : null;

  // If the message has been deleted, let Stream native renderer handle it
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
      <div className={`cmr-row ${isOwn ? "cmr-row-own" : "cmr-row-other"}`}>
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
      <div className={`cmr-row ${isOwn ? "cmr-row-own" : "cmr-row-other"}`}>
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

  // Default Stream Chat message rendering
  return <MessageSimple {...restProps} />;
};

export default CustomMessageRenderer;
