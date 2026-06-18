import { motion } from "framer-motion";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import ProfileAvatar from "../../../components/ProfileAvatar";
import useCallStore from "../store/callSlice";
import { useCallSession } from "../hooks/useCallSession";

export function IncomingCallModal() {
  const { incomingCall, callState } = useCallStore();
  const { answerIncomingCall, declineIncoming } = useCallSession();

  if (callState !== "incoming" || !incomingCall) return null;

  const isVideo = incomingCall.callType === "video";
  const isGroup = incomingCall.callMode === "group";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative call-glass-modal max-w-sm w-full text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mx-auto mb-4 w-fit"
        >
          <ProfileAvatar
            src={incomingCall.callerPic}
            name={incomingCall.callerName || "Caller"}
            size="w-24 h-24"
            textSize="text-3xl"
          />
        </motion.div>

        <h2 className="text-xl font-bold text-white mb-1">
          {isGroup ? "Group Call" : incomingCall.callerName}
        </h2>
        <p className="text-white/70 text-sm mb-6 flex items-center justify-center gap-2">
          {isVideo ? <Video className="size-4" /> : <Mic className="size-4" />}
          Incoming {isVideo ? "video" : "voice"} call
        </p>

        <div className="flex gap-4 justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={declineIncoming}
            className="call-action-btn reject"
            aria-label="Reject"
          >
            <PhoneOff className="size-7" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={answerIncomingCall}
            className="call-action-btn accept"
            aria-label="Accept"
          >
            <Phone className="size-7" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default IncomingCallModal;
