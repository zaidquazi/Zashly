import { PinIcon, XIcon, ChevronRightIcon } from "lucide-react";

const PinnedMessagesBar = ({ pinnedMessages, onUnpin, onJumpToMessage }) => {
  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  // Show the most recently pinned message
  const latestPin = pinnedMessages[pinnedMessages.length - 1];
  const messageText = latestPin.text || "Pinned message";

  return (
    <div className="bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 z-40">
      <div className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer" onClick={() => onJumpToMessage(latestPin.id)}>
        <PinIcon className="size-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Pinned Message</p>
          <p className="text-sm truncate opacity-80">{messageText}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {pinnedMessages.length > 1 && (
          <span className="badge badge-sm badge-ghost">{pinnedMessages.length}</span>
        )}
        <button 
          className="btn btn-ghost btn-xs btn-circle"
          onClick={() => onUnpin(latestPin.id)}
          title="Unpin"
        >
          <XIcon className="size-3" />
        </button>
      </div>
    </div>
  );
};

export default PinnedMessagesBar;
