import { motion, AnimatePresence } from "framer-motion";
import { X, Crown } from "lucide-react";
import ProfileAvatar from "../../../components/ProfileAvatar";
import useCallStore from "../store/callSlice";

export function ParticipantsPanel() {
  const { participants, showParticipants, activeSpeakerId, setShowParticipants, isHost } =
    useCallStore();

  if (!showParticipants) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 280, opacity: 0 }}
        className="call-participants-panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Participants ({participants.length})</h3>
          <button type="button" onClick={() => setShowParticipants(false)} className="btn btn-ghost btn-sm btn-circle text-white">
            <X className="size-4" />
          </button>
        </div>
        <ul className="p-3 space-y-2 overflow-y-auto max-h-[60vh]">
          {participants.map((p) => (
            <li
              key={p.identity}
              className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                activeSpeakerId === p.identity ? "bg-primary/30 ring-1 ring-primary/50" : "bg-white/5"
              }`}
            >
              <ProfileAvatar src="" name={p.name} size="w-9 h-9" textSize="text-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {p.name}
                  {p.isLocal ? " (You)" : ""}
                </p>
                {activeSpeakerId === p.identity && (
                  <p className="text-xs text-primary">Speaking</p>
                )}
              </div>
              {!p.isLocal && isHost && (
                <Crown className="size-3 text-amber-400 opacity-50" />
              )}
            </li>
          ))}
        </ul>
      </motion.aside>
    </AnimatePresence>
  );
}

export default ParticipantsPanel;
