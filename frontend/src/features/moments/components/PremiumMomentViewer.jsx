import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ChevronUp, Pause, Play } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteMoment, getAuthUser } from "../../lib/api";
import ReactionsBottomSheet from "./ReactionsBottomSheet";
import ViewerInsights from "./ViewerInsights";
import ProfileAvatar from "../ProfileAvatar";
import { formatDistanceToNow } from "date-fns";

export default function PremiumMomentViewer({ open, moments, index, onClose, onSeen }) {
  const [currentIndex, setCurrentIndex] = useState(index);
  const current = moments[currentIndex];
  
  const [isPaused, setIsPaused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  
  const progressRef = useRef(null);
  const videoRef = useRef(null);
  const lastSeenIdRef = useRef(null);
  const animRef = useRef(null);
  const handleNextRef = useRef(null);
  
  const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: getAuthUser });
  const authUserId = authUser?.user?._id || authUser?.user?.id || authUser?._id || authUser?.id || "";
  const isOwner = !!(authUserId && current?.userId && String(current.userId) === String(authUserId));

  const role = authUser?.user?.role || authUser?.role;
  const canDelete = isOwner || role === "developer" || role === "admin";

  const handleNext = useCallback(() => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, moments.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    setIsManuallyPaused(false);
  }, [currentIndex]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    if (!open || !current) {
      lastSeenIdRef.current = null;
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
      return;
    }
    
    if (lastSeenIdRef.current !== current.id) {
      onSeen(current.id);
      lastSeenIdRef.current = current.id;
    }

    const duration = Math.min(current.duration || 5000, 50000);

    if (progressRef.current) {
      if (animRef.current) animRef.current.cancel();
      
      // Use Web Animations API for reliable pause/resume
      animRef.current = progressRef.current.animate(
        [{ width: '0%' }, { width: '100%' }],
        { duration, easing: 'linear', fill: 'forwards' }
      );
      
      animRef.current.onfinish = () => {
        if (handleNextRef.current) handleNextRef.current();
      };
    }

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.log("Video play error:", e));
    }

    return () => {
      if (animRef.current) animRef.current.cancel();
    };
  }, [open, current?.id]); // Only restart when the moment actually changes

  // Handle Play/Pause separately to avoid resetting the animation
  const effectivelyPaused = isPaused || isManuallyPaused || sheetOpen || insightsOpen;

  useEffect(() => {
    if (!open || !current) return;

    if (effectivelyPaused) {
      if (animRef.current && animRef.current.playState === 'running') {
        animRef.current.pause();
      }
      if (videoRef.current) videoRef.current.pause();
    } else {
      if (animRef.current && animRef.current.playState === 'paused') {
        animRef.current.play();
      }
      if (videoRef.current) videoRef.current.play().catch(e => console.log(e));
    }
  }, [effectivelyPaused, open, current?.id]);

  // Gestures
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);
  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);

  const handleTap = (e) => {
    // ignore taps if sheet or insights are open
    if (sheetOpen || insightsOpen) return;
    
    const { clientX } = e;
    const width = window.innerWidth;
    if (clientX < width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  if (!current) return null;

  const currentUserMoments = moments.filter(m => m.userId === current.userId);
  const userMomentIndex = currentUserMoments.findIndex(m => m.id === current.id);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black sm:bg-black/90 flex flex-col items-center justify-center overflow-hidden touch-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full h-full sm:w-[400px] sm:h-[80vh] bg-black relative sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) onClose(); // swipe down
              if (info.offset.y < -50) { // swipe up
                if (isOwner) setInsightsOpen(true);
                else setSheetOpen(true);
              }
            }}
          >
            {/* Top Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-50 px-2 pt-2 sm:pt-4 flex gap-1 pointer-events-none">
              {currentUserMoments.map((m, idx) => (
                <div key={m.id} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                  <div
                    ref={idx === userMomentIndex ? progressRef : null}
                    className={`h-full bg-white rounded-full ${idx < userMomentIndex ? "w-full" : "w-0"}`}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-4 sm:top-6 left-0 right-0 z-50 px-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-3">
                <ProfileAvatar 
                  src={current.avatar} 
                  name={current.username} 
                  size="w-10 h-10" 
                  className="ring-2 ring-white/20 bg-base-300 shadow-md"
                />
                <div className="drop-shadow-md">
                  <p className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow-md">{current.username}</p>
                  <p className="text-white/80 text-xs drop-shadow-md font-medium">{formatDistanceToNow(new Date(current.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <button 
                  className="btn btn-circle btn-sm btn-ghost text-white hover:bg-black/40 bg-black/20 backdrop-blur-sm border-0" 
                  onClick={(e) => { e.stopPropagation(); setIsManuallyPaused(p => !p); }}
                  title={isManuallyPaused ? "Play" : "Pause"}
                >
                  {isManuallyPaused ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Pause className="w-4 h-4 fill-current" />}
                </button>
                {canDelete && (
                  <OwnerDeleteButton momentId={current.id} onDeleted={onClose} />
                )}
                <button className="btn btn-circle btn-sm btn-ghost text-white hover:bg-black/40 bg-black/20 backdrop-blur-sm border-0" onClick={onClose}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div 
              className="flex-1 w-full h-full relative flex items-center justify-center cursor-pointer select-none"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={handleTap}
            >
              {current.type === "video" ? (
                <video
                  ref={videoRef}
                  src={current.url}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  draggable={false}
                />
              ) : current.type === "text" ? (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                  style={{ backgroundColor: current.metadata?.bgColor || '#6366f1' }}
                >
                  <p className="text-white font-bold text-2xl sm:text-4xl break-words whitespace-pre-wrap font-sans drop-shadow-lg leading-snug">
                    {current.metadata?.text || ""}
                  </p>
                </div>
              ) : (
                <img src={current.url} alt="" className="w-full h-full object-cover" draggable={false} />
              )}
              
              {/* Bottom Swipe Indicator */}
              <div 
                className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center animate-bounce opacity-80 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOwner) setInsightsOpen(true);
                  else setSheetOpen(true);
                }}
              >
                <ChevronUp className="w-7 h-7 text-white drop-shadow-xl pointer-events-none" />
                <span className="text-white text-sm font-semibold tracking-wide drop-shadow-xl pointer-events-none">
                  {isOwner ? "Swipe up for insights" : "Swipe up to reply"}
                </span>
              </div>
            </div>
            
            <ReactionsBottomSheet 
              isOpen={sheetOpen} 
              onClose={() => setSheetOpen(false)} 
              momentId={current.id} 
            />
            
            <ViewerInsights 
              isOpen={insightsOpen} 
              onClose={() => setInsightsOpen(false)} 
              moment={current} 
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
      onDeleted?.(); 
    },
  });
  return (
    <button
      className="btn btn-circle btn-sm btn-error text-white shadow-lg border-0 hover:bg-red-600"
      onClick={(e) => { e.stopPropagation(); delMutation.mutate(); }}
      title="Delete Moment"
      disabled={delMutation.isPending}
    >
      {delMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
