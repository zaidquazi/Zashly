import { useState } from "react";
import { useNavigate } from "react-router";
import {
  XIcon,
  MessageSquareIcon,
  UserPlusIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  CircleDotIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import ProfileImageViewer from "./ProfileImageViewer";
import { formatDistanceToNow } from "date-fns";

/**
 * Instagram-style full profile screen for searched users.
 * - Responsive: full-page on mobile, centered modal on desktop.
 * - Tap avatar to view profile pic full-screen (like WhatsApp).
 */
const SearchUserProfile = ({
  user,
  onClose,
  onMessage,
  onAddFriend,
  isRequested,
}) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 280);
  };

  const handleMessage = () => {
    if (onMessage) onMessage(user);
    else navigate(`/chat/${user._id}`);
    handleClose();
  };

  const handleAdd = () => {
    if (onAddFriend) onAddFriend(user._id);
  };

  const joinedDate = user.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
      }).format(new Date(user.createdAt))
    : null;

  const username = `@${user.fullName?.toLowerCase().replace(/\s/g, "") || "user"}`;

  return (
    <>
      {/* Backdrop + Container */}
      <div className={`sup-overlay ${closing ? "sup-closing" : ""}`}>
        <div className="sup-backdrop" onClick={handleClose} />

        <div className={`sup-panel ${closing ? "sup-panel-closing" : ""}`}>
          {/* ── Header / Cover ─────────────────────── */}
          <div className="sup-cover">
            <div className="sup-cover-gradient" />

            {/* Back / Close buttons */}
            <button className="sup-back-btn" onClick={handleClose}>
              <ArrowLeftIcon size={20} />
            </button>
            <button className="sup-close-btn" onClick={handleClose}>
              <XIcon size={20} />
            </button>
          </div>

          {/* ── Avatar (tappable) ──────────────────── */}
          <div className="sup-avatar-wrapper" onClick={() => setShowImageViewer(true)}>
            <div className="sup-avatar-ring">
              <ProfileAvatar
                src={user.profilePic}
                name={user.fullName}
                size="w-24 h-24 md:w-28 md:h-28"
                textSize="text-3xl md:text-4xl"
              />
            </div>
            {/* Online dot */}
            {user.isOnline && <span className="sup-online-dot" />}
            {/* Camera icon overlay hint */}
            <div className="sup-avatar-zoom-hint">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
            </div>
          </div>

          {/* ── Profile Info ───────────────────────── */}
          <div className="sup-body">
            {/* Name + Username */}
            <div className="sup-name-section">
              <h2 className="sup-name">{user.fullName}</h2>
              <p className="sup-username">{username}</p>
            </div>

            {/* Online / Last seen status */}
            <div className="sup-status-badge-row">
              {user.isOnline ? (
                <span className="sup-status-badge sup-status-online">
                  <CircleDotIcon size={12} />
                  Online
                </span>
              ) : user.lastSeen ? (
                <span className="sup-status-badge sup-status-offline">
                  <ClockIcon size={12} />
                  Last seen {formatDistanceToNow(new Date(user.lastSeen))} ago
                </span>
              ) : (
                <span className="sup-status-badge sup-status-offline">
                  <CircleDotIcon size={12} />
                  Offline
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div className="sup-stats-row">
              <div className="sup-stat">
                <span className="sup-stat-value">{user.friendsCount ?? 0}</span>
                <span className="sup-stat-label">Friends</span>
              </div>
              <div className="sup-stat-divider" />
              <div className="sup-stat">
                <span className="sup-stat-value">
                  {user.isFriend ? "✓" : "—"}
                </span>
                <span className="sup-stat-label">
                  {user.isFriend ? "Friends" : "Not Friends"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sup-actions">
              {user.isFriend ? (
                <button className="sup-btn sup-btn-primary" onClick={handleMessage}>
                  <MessageSquareIcon size={18} />
                  Message
                </button>
              ) : (
                <button
                  className={`sup-btn ${isRequested ? "sup-btn-disabled" : "sup-btn-secondary"}`}
                  onClick={handleAdd}
                  disabled={isRequested}
                >
                  <UserPlusIcon size={18} />
                  {isRequested ? "Request Sent" : "Add Friend"}
                </button>
              )}
            </div>

            {/* ── Details Section ──────────────────── */}
            <div className="sup-details">
              {/* Bio */}
              <div className="sup-detail-card">
                <div className="sup-detail-icon">
                  <ShieldCheckIcon size={18} />
                </div>
                <div className="sup-detail-content">
                  <span className="sup-detail-label">Bio</span>
                  <span className="sup-detail-value">
                    {user.bio || "Hey there! I am using Zashly."}
                  </span>
                </div>
              </div>

              {/* Location */}
              {user.location && (
                <div className="sup-detail-card">
                  <div className="sup-detail-icon">
                    <MapPinIcon size={18} />
                  </div>
                  <div className="sup-detail-content">
                    <span className="sup-detail-label">Location</span>
                    <span className="sup-detail-value">{user.location}</span>
                  </div>
                </div>
              )}

              {/* Friends count */}
              <div className="sup-detail-card">
                <div className="sup-detail-icon">
                  <UsersIcon size={18} />
                </div>
                <div className="sup-detail-content">
                  <span className="sup-detail-label">Friends</span>
                  <span className="sup-detail-value">
                    {user.friendsCount ?? 0} friend{(user.friendsCount ?? 0) !== 1 ? "s" : ""} on Zashly
                  </span>
                </div>
              </div>

              {/* Joined */}
              {joinedDate && (
                <div className="sup-detail-card">
                  <div className="sup-detail-icon">
                    <CalendarIcon size={18} />
                  </div>
                  <div className="sup-detail-content">
                    <span className="sup-detail-label">Joined</span>
                    <span className="sup-detail-value">{joinedDate}</span>
                  </div>
                </div>
              )}

              {/* Encryption footer */}
              <div className="sup-encryption-footer">
                <ShieldCheckIcon size={14} />
                <span>Messages are end-to-end encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen image viewer */}
      {showImageViewer && (
        <ProfileImageViewer
          src={user.profilePic}
          name={user.fullName}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </>
  );
};

export default SearchUserProfile;
