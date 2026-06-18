import { useEffect } from "react";
import { motion } from "framer-motion";
import useCallStore from "../store/callSlice";

export function CallTimer() {
  const { startedAt, duration, updateDuration, callState } = useCallStore();

  useEffect(() => {
    if (callState !== "connected" || !startedAt) return;
    updateDuration();
    const id = setInterval(updateDuration, 1000);
    return () => clearInterval(id);
  }, [callState, startedAt, updateDuration]);

  if (callState !== "connected") return null;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const label = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-sm font-mono text-white/80 tabular-nums"
    >
      {label}
    </motion.span>
  );
}

export default CallTimer;
