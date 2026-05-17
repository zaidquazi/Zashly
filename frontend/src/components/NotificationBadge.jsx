import { useEffect, useRef, useState, memo } from "react";

/**
 * NotificationBadge — Animated badge for unread counts.
 *
 * Features:
 *  - Bounce-in entrance (elastic easing)
 *  - Number flip/slide on count change
 *  - Repeating attention pulse every 3s
 *  - Smooth scale-down exit
 *
 * @param {{ count: number, maxCount?: number, color?: "green" | "red", show?: boolean }} props
 */
const NotificationBadge = memo(({ count = 0, maxCount = 99, color = "green", show = true }) => {
  const [visible, setVisible] = useState(false);
  const [displayCount, setDisplayCount] = useState(count);
  const [animState, setAnimState] = useState("idle"); // "enter" | "exit" | "flip" | "idle"
  const [pulse, setPulse] = useState(false);
  const prevCountRef = useRef(count);
  const pulseTimerRef = useRef(null);

  const displayText = displayCount > maxCount ? `${maxCount}+` : String(displayCount);

  // Handle entrance & exit
  useEffect(() => {
    if (show && count > 0) {
      if (!visible) {
        setVisible(true);
        setDisplayCount(count);
        setAnimState("enter");
        const t = setTimeout(() => setAnimState("idle"), 550);
        return () => clearTimeout(t);
      }
    } else {
      if (visible) {
        setAnimState("exit");
        const t = setTimeout(() => {
          setVisible(false);
          setAnimState("idle");
        }, 320);
        return () => clearTimeout(t);
      }
    }
  }, [show, count, visible]);

  // Handle count changes (flip animation)
  useEffect(() => {
    if (count !== prevCountRef.current && visible && count > 0) {
      setAnimState("flip");
      const t = setTimeout(() => {
        setDisplayCount(count);
        setAnimState("idle");
      }, 260);
      prevCountRef.current = count;
      return () => clearTimeout(t);
    }
    prevCountRef.current = count;
  }, [count, visible]);

  // Attention pulse every 3 seconds
  useEffect(() => {
    if (visible && count > 0) {
      pulseTimerRef.current = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 650);
      }, 3000);
      return () => clearInterval(pulseTimerRef.current);
    }
    return () => clearInterval(pulseTimerRef.current);
  }, [visible, count]);

  if (!visible && animState !== "exit") return null;

  const colorClass = color === "red" ? "nb-red" : "nb-green";

  return (
    <span
      className={`nb-badge ${colorClass} nb-${animState} ${
        pulse ? "nb-pulse" : ""
      }`}
      aria-label={`${displayText} unread messages`}
    >
      <span className="nb-number-wrap">
        <span
          className={`nb-number ${animState === "flip" ? "nb-number-exit" : ""}`}
          key={`old-${displayCount}`}
        >
          {displayText}
        </span>
      </span>
    </span>
  );
});

NotificationBadge.displayName = "NotificationBadge";

export default NotificationBadge;
