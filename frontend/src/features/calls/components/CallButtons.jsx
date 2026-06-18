import { Phone, Video } from "lucide-react";
import { useCallSession } from "../hooks/useCallSession";
import useCallStore from "../store/callSlice";

export function CallButtons({ targetId, targetName, targetPic, disabled = false }) {
  const { startPersonalCall } = useCallSession();
  const callState = useCallStore((s) => s.callState);

  const busy = disabled || callState !== "idle";

  return (
    <>
      <button
        type="button"
        className="premium-icon-btn call-voice"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          startPersonalCall({
            targetId,
            targetName,
            targetPic,
            type: "voice",
          });
        }}
        title="Voice call"
      >
        <Phone className="size-5" />
      </button>
      <button
        type="button"
        className="premium-icon-btn call-video"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          startPersonalCall({
            targetId,
            targetName,
            targetPic,
            type: "video",
          });
        }}
        title="Video call"
      >
        <Video className="size-5" />
      </button>
    </>
  );
}

export default CallButtons;
