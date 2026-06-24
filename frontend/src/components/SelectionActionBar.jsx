import { useMultiSelect } from '../context/MultiSelectContext';
import { X, Trash2, Forward, Copy, Share2, Pin, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatContext } from 'stream-chat-react';
import { useState } from 'react';
import { deleteGroupMessage } from '../lib/groupApi';

const SelectionActionBar = ({ isGroupChat, isGroupAdmin }) => {
  const { selectedMessages, clearSelection } = useMultiSelect();
  const { client } = useChatContext();
  const [deleting, setDeleting] = useState(null);
  const authUserStrId = String(client.userID); // Assuming client user is authenticated user

  const canDeleteForEveryone = selectedMessages.every(msg => {
    const isOwn = msg.user?.id === authUserStrId;
    return isOwn || (isGroupChat && isGroupAdmin);
  });

  const handleDelete = async (type) => {
    setDeleting(type);
    try {
      if (type === 'everyone') {
        for (const msg of selectedMessages) {
          const isOwn = msg.user?.id === authUserStrId;
          if (!isOwn && isGroupAdmin && isGroupChat) {
            const groupId = client.activeChannels[msg.cid]?.id;
            if (groupId) {
              await deleteGroupMessage(groupId, msg.id);
            }
          } else {
            await client.deleteMessage(msg.id, { hard: true });
          }
        }
        toast.success(`Deleted ${selectedMessages.length} message(s) for everyone`);
      } else if (type === 'me') {
        try {
          const deletedForMe = JSON.parse(localStorage.getItem('deletedMessagesForMe') || '[]');
          selectedMessages.forEach(msg => {
            if (!deletedForMe.includes(msg.id)) {
              deletedForMe.push(msg.id);
            }
          });
          localStorage.setItem('deletedMessagesForMe', JSON.stringify(deletedForMe));
        } catch (e) {}

        for (const msg of selectedMessages) {
          const channel = client.activeChannels[msg.cid];
          if (channel) {
            channel.state.removeMessage({ id: msg.id });
          }
        }
        toast.success(`Deleted ${selectedMessages.length} message(s) for me`);
      }
      clearSelection();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete some messages');
    } finally {
      setDeleting(null);
    }
  };

  const confirmDeleteForEveryone = () => {
    if (window.confirm(`Delete ${selectedMessages.length} message(s) for everyone?`)) {
      handleDelete('everyone');
    }
  };

  const confirmDeleteForMe = () => {
    if (window.confirm(`Delete ${selectedMessages.length} message(s) for me?`)) {
      handleDelete('me');
    }
  };

  const handleCopy = () => {
    const textToCopy = selectedMessages
      .map(msg => msg.text)
      .filter(Boolean)
      .join('\n\n');
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success(`${selectedMessages.length} message(s) copied`);
      clearSelection();
    } else {
      toast.error('No text content to copy');
    }
  };

  const handlePin = async () => {
    try {
      for (const msg of selectedMessages) {
        await client.pinMessage(msg.id);
      }
      toast.success(`${selectedMessages.length} message(s) pinned`);
      clearSelection();
    } catch (error) {
      console.error('Pin failed:', error);
      toast.error('Failed to pin some messages');
    }
  };

  const handleStar = () => {
    try {
      const starred = JSON.parse(localStorage.getItem('starredMessages') || '[]');
      selectedMessages.forEach(msg => {
        if (!starred.find(s => s.id === msg.id)) {
          starred.push(msg); // store the full object or just id
        }
      });
      localStorage.setItem('starredMessages', JSON.stringify(starred));
      toast.success(`${selectedMessages.length} message(s) starred`);
      clearSelection();
    } catch (error) {
      toast.error('Failed to star messages');
    }
  };

  const handleShare = async () => {
    const textToShare = selectedMessages
      .map(msg => msg.text)
      .filter(Boolean)
      .join('\n\n');

    if (navigator.share && textToShare) {
      try {
        await navigator.share({
          title: 'Shared from Zashly',
          text: textToShare,
        });
        clearSelection();
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      toast.error('Sharing is not supported on this device');
    }
  };

  const handleForward = () => {
    // Open forward modal using a custom event or state
    // For now, emit an event
    window.dispatchEvent(new CustomEvent('openForwardModal', { detail: selectedMessages }));
  };

  return (
    <div className="selection-action-bar">
      <div className="selection-bar-left">
        <button onClick={clearSelection} className="selection-action-btn" title="Cancel">
          <X className="size-6" />
        </button>
        <span className="selection-count">{selectedMessages.length}</span>
      </div>

      <div className="selection-actions">
        <button className="selection-action-btn" onClick={handleStar} title="Star">
          <Star className="size-5" />
        </button>

        {/* Reply/Forward logic could be handled similarly */}
        <button className="selection-action-btn" onClick={handleForward} title="Forward">
          <Forward className="size-5" />
        </button>

        <button className="selection-action-btn" onClick={handleCopy} title="Copy">
          <Copy className="size-5" />
        </button>

        <button className="selection-action-btn" onClick={handleShare} title="Share">
          <Share2 className="size-5" />
        </button>

        {isGroupChat && isGroupAdmin && (
          <button className="selection-action-btn" onClick={handlePin} title="Pin">
            <Pin className="size-5" />
          </button>
        )}

        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            type="button"
            className="selection-action-btn"
            title="Delete"
          >
            {deleting ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
          </button>
          <ul tabIndex={0} className="dropdown-content z-[100] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200">
            {canDeleteForEveryone && (
              <li><a onClick={confirmDeleteForEveryone}>Delete for everyone</a></li>
            )}
            <li><a onClick={confirmDeleteForMe}>Delete for me</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectionActionBar;
