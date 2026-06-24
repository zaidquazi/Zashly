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
    <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 sm:backdrop-blur-sm bg-gradient-to-br sm:from-transparent sm:to-transparent from-slate-900 via-slate-800 to-slate-900" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative call-glass-modal w-full h-full sm:max-w-sm sm:h-auto sm:rounded-2xl text-center flex flex-col justify-center border-0 sm:border"
      >
        <div className="flex-1 flex flex-col justify-center items-center mt-12 sm:mt-0">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mx-auto mb-6 w-fit"
          >
            <ProfileAvatar
              src={incomingCall.callerPic}
              name={incomingCall.callerName || "Caller"}
              size="w-32 h-32 sm:w-24 sm:h-24"
              textSize="text-4xl sm:text-3xl"
            />
          </motion.div>

          <h2 className="text-3xl sm:text-xl font-bold text-white mb-2">
            {isGroup ? "Group Call" : incomingCall.callerName}
          </h2>
          <p className="text-white/70 text-lg sm:text-sm mb-12 sm:mb-6 flex items-center justify-center gap-2">
            {isVideo ? <Video className="size-5 sm:size-4" /> : <Mic className="size-5 sm:size-4" />}
            Incoming {isVideo ? "video" : "voice"} call
          </p>
        </div>

        <div className="flex gap-8 sm:gap-4 justify-center pb-16 sm:pb-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={declineIncoming}
            className="call-action-btn reject !w-16 !h-16 sm:!w-14 sm:!h-14"
            aria-label="Reject"
          >
            <PhoneOff className="size-8 sm:size-7" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={answerIncomingCall}
            className="call-action-btn accept !w-16 !h-16 sm:!w-14 sm:!h-14"
            aria-label="Accept"
            style={{ animation: "pulse 2s infinite" }}
          >
            <Phone className="size-8 sm:size-7" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default IncomingCallModal;
