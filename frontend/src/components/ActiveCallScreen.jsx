import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MonitorUp,
  Maximize,
  Minimize2,
  Copy,
} from "lucide-react";
import useCallStore from "../store/useCallStore";
import { formatCallDuration } from "../lib/webrtc";
import useSocket from "../hooks/useSocket";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";

const VideoTile = ({ stream, name, isMuted, isCameraOff, isLocal, isActiveSpeaker }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOff]); // Re-run if camera toggles to ensure srcObject is attached

  // Always play remote audio via a hidden <audio> element
  // This ensures audio works even when the <video> element is not rendered
  useEffect(() => {
    if (audioRef.current && stream && !isLocal) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }
  }, [stream, isLocal]);

  return (
    <div className={`meeting-tile ${isActiveSpeaker ? "active-speaker" : ""}`}>
      {/* 
          Keep video element in DOM even if camera is off.
          This prevents track detachment issues and ensures faster resume.
      */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`meeting-video ${isLocal ? "local-mirror" : ""} ${isCameraOff ? "hidden" : ""}`}
        style={{ display: stream && !isCameraOff ? "block" : "none" }}
      />
      
      {(isCameraOff || !stream) && (
        <div className="meeting-avatar-fallback">
          {(name || "?")[0].toUpperCase()}
        </div>
      )}

      {/* Hidden audio element for remote streams — ensures audio always plays */}
      {!isLocal && (
        <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      )}

      <div className="meeting-tile-overlay">
        <span className="meeting-username">
          {name} {isLocal && "(You)"}
        </span>
        <div className="meeting-mic-status">
          {isMuted ? <MicOff size={16} color="#ea4335" /> : <Mic size={16} color="#10b981" />}
        </div>
      </div>
    </div>
  );
};

const ActiveCallScreen = ({ onEndCall, startCall }) => {
  const {
    callState,
    callType,
    type,
    callerName,
    targetName,
    groupName,
    isMuted,
    isCameraOff,
    callDuration,
    participants,
    localStream,
    remoteStreams,
    peerConnections,
    toggleMute,
    toggleCamera,
    callId,
  } = useCallStore();

  const { socket } = useSocket();
  const { authUser } = useAuthUser();

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("participants"); // "participants" | "chat"
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const cameraTrackRef = useRef(null);



  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isVideo = callType === "video";
  const isConnected = callState === "connected";
  const isGroup = type === "group";
  const displayName = isGroup ? groupName : targetName || callerName || "Unknown";

  // Build grid participants
  const gridItems = useMemo(() => {
    const items = [];
    
    // 1. Add Local User
    items.push({
      id: "local",
      stream: localStream,
      name: "You",
      isLocal: true,
      isMuted,
      isCameraOff: !isVideo || isCameraOff, // Force camera off if it's a voice call
    });

    // 2. Add Remote Users
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      // Find info from participants list
      const participant = participants.find((p) => p.userId === userId);
      const name = participant ? participant.userName : (targetName || callerName || "Unknown");
      const remoteIsCameraOff = participant ? participant.isCameraOff : (!stream || stream.getVideoTracks().length === 0);
      const remoteIsMuted = participant ? participant.isMuted : (!stream || stream.getAudioTracks().length === 0);

      items.push({
        id: userId,
        stream,
        name,
        isLocal: false,
        isCameraOff: remoteIsCameraOff,
        isMuted: remoteIsMuted,
      });
    });

    return items;
  }, [localStream, remoteStreams, participants, isMuted, isCameraOff, isVideo, targetName, callerName]);

  const getGridClass = (count) => {
    if (count === 1) return "grid-1";
    if (count === 2) return "grid-2";
    if (count <= 4) return "grid-4";
    if (count <= 6) return "grid-6";
    if (count <= 9) return "grid-9";
    return "grid-more";
  };

  const handleCopyLink = () => {
    // Basic invite link copy (mock for now, can implement real room links later)
    navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied!");
  };

  const toggleSidebar = (tab) => {
    if (showSidebar && sidebarTab === tab) {
      setShowSidebar(false);
    } else {
      setSidebarTab(tab);
      setShowSidebar(true);
    }
  };

  const handleToggleMute = () => {
    toggleMute();
    socket?.emit("call:status-update", {
      callId,
      userId: authUser._id,
      isMuted: !isMuted,
      isCameraOff: isCameraOff,
    });
  };

  const handleToggleCamera = () => {
    toggleCamera();
    socket?.emit("call:status-update", {
      callId,
      userId: authUser._id,
      isMuted: isMuted,
      isCameraOff: !isCameraOff,
    });
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing manually
        const currentTrack = localStream.getVideoTracks()[0];
        if (currentTrack) {
          currentTrack.stop();
          // Trigger onended manually if stopping doesn't fire it reliably
          if (currentTrack.onended) currentTrack.onended();
        }
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];

      // Store the original camera track
      if (localStream) {
        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack) {
          cameraTrackRef.current = currentVideoTrack;
          // Temporarily disable the camera track so we don't send two active streams conceptually (optional)
          
          // Replace track in all peer connections
          Object.values(peerConnections).forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
          });

          // Update local stream to show screen share
          // Create a new MediaStream so React detects the change
          const newStream = new MediaStream([
            ...localStream.getAudioTracks(),
            screenTrack
          ]);
          useCallStore.getState().setLocalStream(newStream);
        }
      }

      setIsScreenSharing(true);

      // Handle when the user stops screen sharing from the browser UI
      screenTrack.onended = () => {
        setIsScreenSharing(false);
        if (localStream && cameraTrackRef.current) {
          // Replace track back to camera
          Object.values(peerConnections).forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(cameraTrackRef.current);
            }
          });

          const restoredStream = new MediaStream([
            ...localStream.getAudioTracks(),
            cameraTrackRef.current
          ]);
          useCallStore.getState().setLocalStream(restoredStream);
          cameraTrackRef.current = null;
        }
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
      toast.error("Failed to share screen");
    }
  };



  return (
    <div className="meeting-container">
      {/* ── Top Bar ────────────────────────────────────────── */}
      <div className="meeting-top-bar">
        <div className="meeting-top-left">
          <div className="meeting-title">{displayName}</div>
          <div className="meeting-timer">
            {isConnected ? formatCallDuration(callDuration) : "Connecting..."}
          </div>
        </div>
        <div className="meeting-top-right">
          <div className="meeting-connection-badge">
            <span className="connection-dot"></span>
            {isConnected ? "Connected" : "Connecting"}
          </div>
        </div>
      </div>

      {/* ── Main Layout (Grid + Sidebar) ───────────────────── */}
      <div className="meeting-main-area">
        <div className="meeting-grid-area">
          <div className={`meeting-grid ${getGridClass(gridItems.length)}`}>
            {gridItems.map((item) => (
              <VideoTile
                key={item.id}
                stream={item.stream}
                name={item.name}
                isLocal={item.isLocal}
                isMuted={item.isMuted}
                isCameraOff={item.isCameraOff}
              />
            ))}
          </div>
        </div>

        {/* ── Sidebar ────────────────────────────────────────── */}
        {showSidebar && (
          <div className="meeting-sidebar">
            <div className="meeting-sidebar-header">
              <h3>{sidebarTab === "participants" ? "Participants" : "In-Call Chat"}</h3>
              <button onClick={() => setShowSidebar(false)} className="close-btn">✕</button>
            </div>
            
            {sidebarTab === "participants" && (
              <div className="meeting-sidebar-content participants-list">
                <div className="participant-item">
                  <div className="participant-info">
                    <div className="participant-avatar">Y</div>
                    <span>You</span>
                  </div>
                  <div className="participant-controls">
                    {isMuted ? <MicOff size={16} color="#ea4335" /> : <Mic size={16} />}
                  </div>
                </div>
                {participants.map((p) => (
                  <div key={p.userId} className="participant-item">
                    <div className="participant-info">
                      {p.userPic ? (
                        <img src={p.userPic} alt={p.userName} className="participant-avatar-img" />
                      ) : (
                        <div className="participant-avatar">{(p.userName || "?")[0].toUpperCase()}</div>
                      )}
                      <span>{p.userName}</span>
                    </div>
                    <div className="participant-controls">
                       {/* Remote user icons */}
                       <Mic size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}


          </div>
        )}
      </div>

      {/* ── Bottom Control Bar ─────────────────────────────── */}
      <div className="meeting-bottom-bar">
        <div className="control-group">
          <button
            className={`meeting-btn ${isMuted ? "active" : ""}`}
            onClick={handleToggleMute}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          <button
            className={`meeting-btn ${isCameraOff || !isVideo ? "active" : ""}`}
            onClick={handleToggleCamera}
            disabled={!isVideo}
          >
            {isCameraOff || !isVideo ? <VideoOff size={24} /> : <Video size={24} />}
            <span>{isCameraOff || !isVideo ? "Start Video" : "Stop Video"}</span>
          </button>
        </div>

        <div className="control-group">
          <button className={`meeting-btn ${isScreenSharing ? "active-tab" : ""}`} onClick={handleScreenShare}>
            <MonitorUp size={24} />
            <span>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</span>
          </button>

          <button className="meeting-btn" onClick={handleCopyLink}>
            <Copy size={24} />
            <span>Invite</span>
          </button>

          <button
            className={`meeting-btn ${showSidebar && sidebarTab === "participants" ? "active-tab" : ""}`}
            onClick={() => toggleSidebar("participants")}
          >
            <Users size={24} />
            <span>Participants</span>
          </button>


        </div>

        <div className="control-group">
          <button className="meeting-btn-end" onClick={onEndCall}>
            <PhoneOff size={20} />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveCallScreen;
