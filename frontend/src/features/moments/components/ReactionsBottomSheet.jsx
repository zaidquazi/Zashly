import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Mic, Image as ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMomentReply } from "../../lib/api";

const QUICK_REACTIONS = ["❤️", "🔥", "😂", "😍", "👏", "😮"];
const QUICK_REPLIES = ["🔥 Awesome", "😂 LOL", "👏 Nice", "❤️ Love it"];

export default function ReactionsBottomSheet({ isOpen, onClose, momentId }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: (payload) => createMomentReply(momentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["momentReplies", momentId] });
      onClose(); // Close sheet after sending
      setText("");
    },
  });

  const sendReaction = (emoji) => {
    sendMutation.mutate({ emoji });
  };

  const sendText = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMutation.mutate({ text: text.trim() });
    }
  };

  const sendQuickReply = (msg) => {
    sendMutation.mutate({ text: msg });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[120] bg-base-100 dark:bg-[#111] rounded-t-3xl p-4 sm:p-6 shadow-2xl border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) onClose();
            }}
          >
            <div className="w-12 h-1.5 bg-base-content/20 rounded-full mx-auto mb-6" />

            <div className="space-y-6">
              {/* Quick Reactions */}
              <div>
                <h3 className="text-sm font-semibold text-base-content/70 mb-3 px-1">Quick Reactions</h3>
                <div className="flex justify-between items-center bg-base-200/50 p-2 rounded-2xl">
                  {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => sendReaction(emoji)}
                      className="text-3xl sm:text-4xl hover:bg-base-300 p-2 rounded-full transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Replies */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendQuickReply(reply)}
                    className="shrink-0 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-colors border border-primary/20"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <form onSubmit={sendText} className="flex items-end gap-2 bg-base-200 rounded-2xl p-2 border border-base-content/10 focus-within:border-primary/50 transition-colors">
                <div className="flex flex-col gap-2 p-2">
                  <button type="button" className="text-base-content/50 hover:text-primary transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button type="button" className="text-base-content/50 hover:text-primary transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 bg-transparent border-0 outline-none resize-none max-h-32 min-h-[44px] py-3 text-sm"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendText(e);
                    }
                  }}
                />
                <div className="p-1">
                  {text.trim() ? (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      type="submit"
                      disabled={sendMutation.isPending}
                      className="btn btn-circle btn-primary btn-sm text-white shadow-md"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </motion.button>
                  ) : (
                    <button type="button" className="btn btn-circle btn-ghost btn-sm text-base-content/50 hover:text-primary">
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
