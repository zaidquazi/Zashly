import { Phone, Video } from "lucide-react";

/**
 * Call buttons — Voice + Video
 * Used in both ChatPage (1-on-1) and GroupChatPage
 */
function CallButton({ onVoiceCall, onVideoCall, compact = false }) {
  if (compact) {
    return (
      <div className="call-buttons-compact">
        <button
          onClick={onVoiceCall}
          className="call-btn-trigger voice"
          title="Voice Call"
        >
          <Phone size={18} />
        </button>
        <button
          onClick={onVideoCall}
          className="call-btn-trigger video"
          title="Video Call"
        >
          <Video size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="call-buttons-bar">
      <button
        onClick={onVoiceCall}
        className="call-btn-trigger voice"
        title="Voice Call"
      >
        <Phone size={18} />
      </button>
      <button
        onClick={onVideoCall}
        className="call-btn-trigger video"
        title="Video Call"
      >
        <Video size={18} />
      </button>
    </div>
  );
}

export default CallButton;
