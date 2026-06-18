import { useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import { MonitorUp, MonitorOff } from "lucide-react";
import { motion } from "framer-motion";
import useCallStore from "../store/callSlice";

export function ScreenShareButton() {
  const room = useRoomContext();
  const { screenShareEnabled, setScreenShareEnabled } = useCallStore();

  const toggle = useCallback(async () => {
    if (!room?.localParticipant) return;
    try {
      if (screenShareEnabled) {
        await room.localParticipant.setScreenShareEnabled(false);
        setScreenShareEnabled(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
        setScreenShareEnabled(true);
      }
    } catch {
      /* permission denied */
    }
  }, [room, screenShareEnabled, setScreenShareEnabled]);

  const Icon = screenShareEnabled ? MonitorOff : MonitorUp;

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      type="button"
      onClick={toggle}
      className={`call-control-btn ${screenShareEnabled ? "active" : ""}`}
      title={screenShareEnabled ? "Stop sharing" : "Share screen"}
    >
      <Icon className="size-5" />
    </motion.button>
  );
}

export default ScreenShareButton;
