import { motion } from "framer-motion";
import { Maximize2, Phone } from "lucide-react";
import useCallStore from "../store/callSlice";
import CallTimer from "./CallTimer";

export function FloatingCallWindow() {
  const { callState, isMinimized, setMinimized, remoteUser, groupInfo } = useCallStore();

  if (callState !== "connected" || !isMinimized) return null;

  const label = remoteUser?.name || groupInfo?.name || "Call";

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 right-4 z-[180] call-floating-pill"
    >
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="flex items-center gap-3"
      >
        <span className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Phone className="size-5 text-emerald-400" />
        </span>
        <div className="text-left">
          <p className="text-sm font-medium text-white">{label}</p>
          <CallTimer />
        </div>
        <Maximize2 className="size-4 text-white/70" />
      </button>
    </motion.div>
  );
}

export default FloatingCallWindow;
