import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import useCallStore from "../store/useCallStore";

/**
 * WhatsApp-style incoming call modal overlay.
 * Full-screen dark overlay with caller info, ringing animation,
 * and Accept/Decline buttons.
 */
const IncomingCallModal = ({ onAccept, onDecline }) => {
  const {
    callerName,
    callerPic,
    callType,
    type,
    groupName,
  } = useCallStore();

  const containerRef = useRef(null);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isVideo = callType === "video";
  const isGroup = type === "group";

  return (
    <div className="incoming-call-overlay" ref={containerRef}>
      {/* Background particles */}
      <div className="call-bg-particles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="call-particle" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
      </div>

      <div className="incoming-call-content">
        {/* Call type indicator */}
        <div className="call-type-badge">
          {isVideo ? (
            <Video className="call-type-icon" size={16} />
          ) : (
            <Phone className="call-type-icon" size={16} />
          )}
          <span>
            {isGroup ? "Group " : ""}
            {isVideo ? "Video" : "Voice"} Call
          </span>
        </div>

        {/* Caller avatar with ring animation */}
        <div className="caller-avatar-container">
          <div className="ring-pulse ring-pulse-1" />
          <div className="ring-pulse ring-pulse-2" />
          <div className="ring-pulse ring-pulse-3" />

          <div className="caller-avatar">
            {callerPic && !callerPic.startsWith("data:") ? (
              <img
                src={callerPic}
                alt={callerName}
                className="caller-avatar-img"
              />
            ) : (
              <div className="caller-avatar-fallback">
                {(callerName || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Caller info */}
        <div className="caller-info">
          <h2 className="caller-name">{callerName || "Unknown"}</h2>
          {isGroup && groupName && (
            <p className="caller-group-name">{groupName}</p>
          )}
          <p className="caller-status">
            <span className="ringing-dot" />
            Ringing...
          </p>
        </div>

        {/* Encrypted badge */}
        <div className="encrypted-badge">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2v2h1v4H9v-4h1V9c0-1.1.9-2 2-2zm-1 2v2h2V9h-2z" />
          </svg>
          <span>End-to-end encrypted</span>
        </div>

        {/* Action buttons */}
        <div className="call-action-buttons">
          <button
            className="call-action-btn decline-btn"
            onClick={onDecline}
            title="Decline"
          >
            <div className="call-btn-icon-wrap">
              <PhoneOff size={28} />
            </div>
            <span className="call-btn-label">Decline</span>
          </button>

          <button
            className="call-action-btn accept-btn"
            onClick={onAccept}
            title="Accept"
          >
            <div className="call-btn-icon-wrap">
              {isVideo ? <Video size={28} /> : <Phone size={28} />}
            </div>
            <span className="call-btn-label">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
