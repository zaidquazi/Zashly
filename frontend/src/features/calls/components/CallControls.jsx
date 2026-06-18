import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomContext } from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Maximize,
  Minimize,
  LogOut,
} from "lucide-react";
import useCallStore from "../store/callSlice";
import { useCallSession } from "../hooks/useCallSession";
import ScreenShareButton from "./ScreenShareButton";
import CallTimer from "./CallTimer";
import NetworkIndicator from "./NetworkIndicator";

export function CallControls({ onLeave, showEndForHost = false }) {
  const room = useRoomContext();
  const { hangUp } = useCallSession();
  const {
    micEnabled,
    cameraEnabled,
    callType,
    isGroup,
    isHost,
    isFullscreen,
    showParticipants,
    setMicEnabled,
    setCameraEnabled,
    setShowParticipants,
    setFullscreen,
  } = useCallStore();

  const toggleMic = useCallback(async () => {
    const next = !micEnabled;
    await room?.localParticipant?.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, [room, micEnabled, setMicEnabled]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraEnabled;
    await room?.localParticipant?.setCameraEnabled(next);
    setCameraEnabled(next);
  }, [room, cameraEnabled, setCameraEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const handleLeave = () => {
    onLeave?.();
    hangUp();
  };

  return (
    <div className="call-controls-bar">
      <div className="flex items-center gap-3 mb-2">
        <CallTimer />
        <NetworkIndicator />
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={toggleMic}
          className={`call-control-btn ${!micEnabled ? "danger" : ""}`}
          title={micEnabled ? "Mute" : "Unmute"}
        >
          {micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </motion.button>

        {callType === "video" && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={toggleCamera}
            className={`call-control-btn ${!cameraEnabled ? "danger" : ""}`}
            title={cameraEnabled ? "Camera off" : "Camera on"}
          >
            {cameraEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
          </motion.button>
        )}

        <ScreenShareButton />

        {isGroup && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setShowParticipants(!showParticipants)}
            className={`call-control-btn ${showParticipants ? "active" : ""}`}
            title="Participants"
          >
            <Users className="size-5" />
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={toggleFullscreen}
          className="call-control-btn"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
        </motion.button>

        {isGroup && !isHost ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handleLeave}
            className="call-control-btn warning"
            title="Leave call"
          >
            <LogOut className="size-5" />
          </motion.button>
        ) : null}

        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={handleLeave}
          className="call-control-btn hangup"
          title={showEndForHost || isHost ? "End call" : "End call"}
        >
          <PhoneOff className="size-5" />
        </motion.button>
      </div>
    </div>
  );
}

export default CallControls;
