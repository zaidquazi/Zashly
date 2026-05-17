import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Trash2, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMomentReply, deleteMoment, getAuthUser, getMomentReplies } from "../lib/api";

export default function MomentViewer({ open, moments, index, onClose, onPrev, onNext, onSeen }) {
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const videoRef = useRef(null);
  const lastTapRef = useRef(0);
  const current = moments[index];
  const queryClient = useQueryClient();
  const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: getAuthUser });
  const [reply, setReply] = useState("");
  const authUserId = authUser?.user?._id || authUser?.user?.id || authUser?._id || authUser?.id || "";
  const isOwner = !!(authUserId && current?.userId && String(current.userId) === String(authUserId));

  useEffect(() => {
    if (!open || !current) return;
    onSeen(current.id);
    if (timerRef.current) clearTimeout(timerRef.current);
    const duration = Math.min(current.duration || 5000, 50000);
    if (progressRef.current) {
      progressRef.current.style.width = "0%";
      progressRef.current.getBoundingClientRect();
      progressRef.current.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        if (progressRef.current) progressRef.current.style.width = "100%";
      });
    }
    timerRef.current = setTimeout(() => {
      onNext();
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button className="absolute top-4 right-4 btn btn-circle btn-ghost text-white" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X />
          </button>

          <button className="absolute left-4 btn btn-circle btn-ghost text-white" onClick={(e) => { e.stopPropagation(); onPrev(); }}>
            <ChevronLeft />
          </button>
          <button className="absolute right-16 btn btn-circle btn-ghost text-white" onClick={(e) => { e.stopPropagation(); onNext(); }}>
            <ChevronRight />
          </button>

          <motion.div
            className="w-[86vw] max-w-[380px] sm:max-w-[440px] md:max-w-[500px] aspect-[9/16] md:aspect-auto md:h-[80vh] bg-black relative rounded-xl overflow-hidden shadow-2xl"
            initial={{ y: 20, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20">
              <div ref={progressRef} className="h-full bg-white" style={{ width: "0%" }} />
            </div>

            {/* Delete own moment */}
            {/* {isOwner && (
              <OwnerDeleteButton momentId={current.id} onDeleted={onClose} />
            )} */}

            {current?.type === "video" ? (
              <video
                ref={videoRef}
                src={current.url}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
                onDoubleClick={(e) => {
                  const el = e.currentTarget;
                  const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
                  if (isFullscreen) {
                    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
                  } else if (el.requestFullscreen) {
                    el.requestFullscreen();
                  } else if (el.webkitRequestFullscreen) {
                    el.webkitRequestFullscreen();
                  } else if (el.webkitEnterFullscreen) {
                    el.webkitEnterFullscreen();
                  }
                }}
                onTouchEnd={(e) => {
                  const now = Date.now();
                  if (now - lastTapRef.current < 300) {
                    e.preventDefault();
                    const el = videoRef.current;
                    if (!el) return;
                    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
                    if (isFullscreen) {
                      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
                    } else if (el.requestFullscreen) {
                      el.requestFullscreen();
                    } else if (el.webkitRequestFullscreen) {
                      el.webkitRequestFullscreen();
                    } else if (el.webkitEnterFullscreen) {
                      el.webkitEnterFullscreen();
                    }
                    lastTapRef.current = 0;
                  } else {
                    lastTapRef.current = now;
                  }
                }}
              />
            ) : (
              <img src={current?.url} alt="moment" className="w-full h-full object-contain" />
            )}

            {/* Replies and quick reactions */}
            <RepliesPane momentId={current?.id} />
            <ReplyInput
              value={reply}
              onChange={setReply}
              momentId={current?.id}
              onSent={() => setReply("")}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OwnerDeleteButton({ momentId, onDeleted }) {
  const queryClient = useQueryClient();
  const delMutation = useMutation({
    mutationFn: () => deleteMoment(momentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
      onDeleted?.(); // Close viewer after successful deletion
    },
  });
  return (
    <button
      className="absolute top-2 left-2 btn btn-xs btn-error text-white"
      onClick={() => delMutation.mutate()}
      title="Delete Moment"
      disabled={delMutation.isLoading}
    >
      {delMutation.isLoading ? "..." : <Trash2 className="w-4 h-4" />}
    </button>
  );
}

function RepliesPane({ momentId }) {
  const { data: replies = [] } = useQuery({
    queryKey: ["momentReplies", momentId],
    queryFn: () => getMomentReplies(momentId),
    enabled: !!momentId,
  });
  return (
    <div className="absolute bottom-14 left-0 right-0 max-h-32 overflow-y-auto px-3 space-y-2">
      {replies.map((r) => (
        <div key={r.id} className="flex items-center gap-2 text-white/90 text-xs bg-black/30 rounded-md p-2">
          <div className="avatar">
            <div className="w-6 rounded-full ring ring-white/20 ring-offset-2 ring-offset-black">
              <img src={r.sender.avatar || "/default-avatar.png"} />
            </div>
          </div>
          <div className="opacity-90">
            <span className="font-medium mr-1">{r.sender.name}</span>
            {r.emoji && <span className="mr-1">{r.emoji}</span>}
            {r.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReplyInput({ value, onChange, momentId, onSent }) {
  const queryClient = useQueryClient();
  const sendMutation = useMutation({
    mutationFn: (payload) => createMomentReply(momentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["momentReplies", momentId] });
      onSent?.();
    },
  });

  const quick = ["😊", "🔥", "❤️", "👍", "😍"];
  const [emojiOpen, setEmojiOpen] = useState(false);

  const send = (payload) => {
    if (!momentId) return;
    sendMutation.mutate(payload);
  };

  return (
    <div className="absolute bottom-2 left-0 right-0 px-3 flex items-center gap-2">
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          className="btn btn-xs bg-white/10 hover:bg-white/20 text-white border-0"
          onClick={() => setEmojiOpen((prev) => !prev)}
        >
          😊
        </button>
        {emojiOpen && (
          <div
            className="absolute bottom-8 left-0 bg-black/80 rounded-lg p-1 flex gap-1"
            onMouseLeave={() => setEmojiOpen(false)}
          >
            {quick.map((e) => (
              <button
                key={e}
                type="button"
                className="btn btn-xs bg-transparent border-0 text-lg"
                onClick={() => {
                  send({ emoji: e });
                  setEmojiOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Reply to moment..."
          className="bg-transparent outline-none text-white text-sm flex-1 placeholder-white/60"
        />
        <button className="btn btn-xs btn-primary" onClick={() => value && send({ text: value })}>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
