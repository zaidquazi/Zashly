import { motion, AnimatePresence } from "framer-motion";
import { Eye, Heart, MessageCircle, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMomentReplies } from "../../lib/api";
import ProfileAvatar from "../ProfileAvatar";

export default function ViewerInsights({ isOpen, onClose, moment }) {
  const { data: replies = [] } = useQuery({
    queryKey: ["momentReplies", moment?.id],
    queryFn: () => getMomentReplies(moment?.id),
    enabled: !!moment?.id && isOpen,
  });

  if (!moment) return null;

  const viewsCount = moment.viewers?.length || 0;
  const reactions = replies.filter(r => r.emoji);
  const textReplies = replies.filter(r => r.text);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[120] bg-base-100 dark:bg-[#111] rounded-t-3xl p-4 sm:p-6 shadow-2xl border-t border-white/10 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) onClose();
            }}
          >
            <div className="w-12 h-1.5 bg-base-content/20 rounded-full mx-auto mb-6 shrink-0" />
            
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Story Insights</h2>
                <p className="text-xs text-base-content/60">Only you can see this</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 shrink-0">
              <div className="bg-base-200/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-base-content/5">
                <Eye className="w-5 h-5 text-blue-500 mb-2" />
                <span className="text-2xl font-bold">{viewsCount}</span>
                <span className="text-xs text-base-content/60 font-medium">Views</span>
              </div>
              <div className="bg-base-200/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-base-content/5">
                <Heart className="w-5 h-5 text-red-500 mb-2" />
                <span className="text-2xl font-bold">{reactions.length}</span>
                <span className="text-xs text-base-content/60 font-medium">Reactions</span>
              </div>
              <div className="bg-base-200/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-base-content/5">
                <MessageCircle className="w-5 h-5 text-green-500 mb-2" />
                <span className="text-2xl font-bold">{textReplies.length}</span>
                <span className="text-xs text-base-content/60 font-medium">Replies</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 space-y-4">
              {replies.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-base-content/70 mb-3 sticky top-0 bg-base-100 dark:bg-[#111] py-2 z-10">Recent Interactions</h3>
                  <div className="space-y-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex items-center gap-3 bg-base-200/30 p-3 rounded-xl border border-base-content/5">
                        <ProfileAvatar 
                          src={reply.userId?.profilePic} 
                          name={reply.userId?.fullName || "User"} 
                          size="w-10 h-10" 
                          className="bg-base-300 ring-1 ring-base-content/10 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{reply.userId?.fullName || "User"}</p>
                          {reply.text && <p className="text-xs text-base-content/70 truncate">{reply.text}</p>}
                        </div>
                        {reply.emoji && (
                          <div className="text-2xl bg-base-100 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                            {reply.emoji}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                  <MessageCircle className="w-12 h-12 mb-3 stroke-[1.5]" />
                  <p className="text-sm font-medium">No interactions yet</p>
                  <p className="text-xs mt-1">Reactions and replies will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
