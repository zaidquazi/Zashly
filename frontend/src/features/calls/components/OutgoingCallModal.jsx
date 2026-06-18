import { motion } from "framer-motion";
import { PhoneOff, Video, Mic } from "lucide-react";
import ProfileAvatar from "../../../components/ProfileAvatar";
import useCallStore from "../store/callSlice";
import { useCallSession } from "../hooks/useCallSession";

export function OutgoingCallModal() {
  const { outgoingCall, callState, callType } = useCallStore();
  const { cancelOutgoingCall } = useCallSession();

  if (callState !== "outgoing" || !outgoingCall) return null;

  const display = outgoingCall.remoteUser || outgoingCall.groupInfo;
  const name = display?.name || "Calling...";
  const image = display?.image || display?.avatar || "";
  const isVideo = callType === "video";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative call-glass-modal max-w-sm w-full text-center"
      >
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mx-auto mb-4 w-fit"
        >
          <ProfileAvatar src={image} name={name} size="w-24 h-24" textSize="text-3xl" />
        </motion.div>

        <h2 className="text-xl font-bold text-white mb-1">{name}</h2>
        <p className="text-white/70 text-sm mb-2 flex items-center justify-center gap-2">
          {isVideo ? <Video className="size-4" /> : <Mic className="size-4" />}
          Calling...
        </p>

        <div className="flex justify-center gap-1 mb-6">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={cancelOutgoingCall}
          className="call-action-btn reject mx-auto"
          aria-label="Cancel"
        >
          <PhoneOff className="size-7" />
        </motion.button>
      </motion.div>
    </div>
  );
}

export default OutgoingCallModal;
