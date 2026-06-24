import { useState, useRef, useEffect } from "react";
import { useMessageContext, useChatContext } from "stream-chat-react";
import { Trash2, Reply, MoreHorizontal, Smile, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteGroupMessage } from "../lib/groupApi";

/**
 * CustomMessageActionBar
 *
 * Wraps a voice-message or poll bubble with a Stream-style hover action bar
 * showing: Reply • Emoji-react • Delete (own) • More (flag, pin, etc.)
 */
const CustomMessageActionBar = ({ children, isOwn, isGroupAdmin, isGroupChat }) => {
  const [hovered, setHovered] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const moreRef = useRef(null);

  const { message, handleOpenThread, handleReaction, getMessageActions } =
    useMessageContext();
  const { client } = useChatContext();

  const actions = getMessageActions();

  // Close "more" dropdown when clicking outside
  useEffect(() => {
    if (!showMore) return;
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMore]);

  // Direct client delete
  const handleCustomDelete = async (type) => {
    setShowMore(false);
    if (!message?.id) return;
    
    setDeleting(type); // 'everyone'
    try {
      if (type === "everyone") {
        // Hard-delete globally
        if (!isOwn && isGroupAdmin && isGroupChat) {
          const groupId = client.activeChannels[message.cid]?.id;
          if (groupId) {
            await deleteGroupMessage(groupId, message.id);
          }
        } else {
          await client.deleteMessage(message.id, { hard: true });
        }
        toast.success("Deleted for everyone");
      } else if (type === "me") {
        try {
          const deletedForMe = JSON.parse(localStorage.getItem("deletedMessagesForMe") || "[]");
          if (!deletedForMe.includes(message.id)) {
            deletedForMe.push(message.id);
            localStorage.setItem("deletedMessagesForMe", JSON.stringify(deletedForMe));
          }
        } catch (e) {
          // ignore
        }
        
        // Local state removal (hides it for this session immediately)
        const channel = client.activeChannels[message.cid];
        if (channel) {
          channel.state.removeMessage({ id: message.id });
        }
        toast.success("Deleted for me");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete message");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div
      className={`cmab-wrapper ${isOwn ? "cmab-own" : "cmab-other"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMore(false); }}
    >
      {/* Action bar — visible on hover */}
      <div
        className={`cmab-bar ${hovered ? "cmab-bar-visible" : ""} ${
          isOwn ? "cmab-bar-own" : "cmab-bar-other"
        }`}
      >
        {/* Reply */}
        {actions.includes("reply") && (
          <button
            className="cmab-btn"
            title="Reply in thread"
            onClick={(e) => handleOpenThread(e)}
          >
            <Reply size={14} />
          </button>
        )}

        {/* Quick 👍 react */}
        <button
          className="cmab-btn"
          title="Like"
          onClick={(e) => handleReaction("like", e)}
        >
          <Smile size={14} />
        </button>

        {/* More options dropdown */}
        <div className="cmab-more-wrap" ref={moreRef}>
          <button
            className="cmab-btn"
            title="More options"
            onClick={() => setShowMore((v) => !v)}
          >
            <MoreHorizontal size={14} />
          </button>

          {showMore && (
            <div
              className={`cmab-dropdown ${
                isOwn ? "cmab-dropdown-own" : "cmab-dropdown-other"
              }`}
            >
              {/* Delete Options — own messages or group admin */}
              {(isOwn || (isGroupAdmin && isGroupChat)) && (
                <>
                  <button
                    className="cmab-menu-item cmab-menu-danger"
                    onClick={() => handleCustomDelete("everyone")}
                    disabled={deleting !== null}
                  >
                    {deleting === "everyone" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    {deleting === "everyone" ? "Deleting…" : "Delete for everyone"}
                  </button>
                </>
              )}

              {/* Delete for me is available for everyone */}
              <button
                className="cmab-menu-item cmab-menu-danger"
                onClick={() => handleCustomDelete("me")}
                disabled={deleting !== null}
              >
                {deleting === "me" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                {deleting === "me" ? "Deleting…" : "Delete for me"}
              </button>

              {/* Flag — others' messages */}
              {!isOwn && actions.includes("flag") && (
                <button
                  className="cmab-menu-item"
                  onClick={() => setShowMore(false)}
                >
                  Report
                </button>
              )}

              {/* Pin */}
              {isGroupAdmin && isGroupChat && (
                <button
                  className="cmab-menu-item"
                  onClick={async () => {
                    setShowMore(false);
                    try {
                      if (message.pinned) {
                        await client.unpinMessage(message.id);
                        toast.success("Message unpinned");
                      } else {
                        await client.pinMessage(message.id);
                        toast.success("Message pinned");
                      }
                    } catch (err) {
                      console.error("Pin failed:", err);
                      toast.error("Failed to pin message");
                    }
                  }}
                >
                  {message.pinned ? "Unpin message" : "Pin message"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* The actual bubble content */}
      {children}
    </div>
  );
};

export default CustomMessageActionBar;
