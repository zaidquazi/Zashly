import { memo } from "react";

/**
 * StatusRing — 3D gradient ring around avatars indicating Moments/Status.
 *
 * Features:
 *  - Rotating conic gradient ring (unviewed)
 *  - 3D depth: inner shadow + outer glow + bottom shadow
 *  - Highlight arc (top-left)
 *  - Grey ring for viewed status
 *  - Bounce entrance animation
 *  - Tap/click micro interaction
 *  - Pulse effect for newly added status
 *
 * @param {{ hasStatus: boolean, viewed?: boolean, isNew?: boolean, children: React.ReactNode, size?: number }} props
 */
const StatusRing = memo(({
  hasStatus = false,
  viewed = false,
  isNew = false,
  children,
  size = 64,
  onClick,
}) => {
  // No status = render children directly
  if (!hasStatus) {
    return (
      <div
        className="sr-no-ring"
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  const ringClass = viewed ? "sr-viewed" : "sr-active";

  return (
    <div
      className={`sr-container ${ringClass}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Rotating gradient ring */}
      <div className="sr-gradient" />

      {/* Highlight arc (3D effect — top-left) */}
      <div className="sr-highlight" />

      {/* White separator + avatar */}
      <div className="sr-separator">
        <div className="sr-avatar-container">
          {children}
        </div>
      </div>

      {/* Pulse ring — appears when new status is added */}
      {isNew && <div className="sr-pulse-ring" />}
    </div>
  );
});

StatusRing.displayName = "StatusRing";

export default StatusRing;
