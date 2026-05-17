import { useEffect, useRef, useState } from "react";

/**
 * DoubleTickIndicator — WhatsApp-style animated read receipts.
 *
 * States:
 *  - "sent"      → single grey tick ✓ (fade in)
 *  - "delivered"  → double grey ticks ✓✓ (second tick pops in)
 *  - "read"       → double blue ticks ✓✓ (color transition + subtle pulse)
 *
 * @param {{ status: "sent" | "delivered" | "read", className?: string }} props
 */
const DoubleTickIndicator = ({ status = "sent", className = "" }) => {
  const [prevStatus, setPrevStatus] = useState(status);
  const [readPulse, setReadPulse] = useState(false);
  const tick2Ref = useRef(null);

  // Trigger read-pulse animation when transitioning TO "read"
  useEffect(() => {
    if (status === "read" && prevStatus !== "read") {
      setReadPulse(true);
      const t = setTimeout(() => setReadPulse(false), 400);
      return () => clearTimeout(t);
    }
    setPrevStatus(status);
  }, [status, prevStatus]);

  const isRead = status === "read";
  const showSecondTick = status === "delivered" || status === "read";

  return (
    <span
      className={`dti-container ${className}`}
      aria-label={
        status === "read"
          ? "Read"
          : status === "delivered"
          ? "Delivered"
          : "Sent"
      }
    >
      {/* Tick 1: always visible */}
      <svg
        className={`dti-tick dti-tick-1 ${isRead ? "dti-read" : ""} ${
          readPulse ? "dti-read-pulse" : ""
        }`}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 8.5L6.5 12L13 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Tick 2: appears on delivered/read */}
      {showSecondTick && (
        <svg
          ref={tick2Ref}
          className={`dti-tick dti-tick-2 ${isRead ? "dti-read" : ""} ${
            readPulse ? "dti-read-pulse" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 8.5L6.5 12L13 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
};

export default DoubleTickIndicator;
