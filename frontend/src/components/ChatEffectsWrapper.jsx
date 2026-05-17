import { useRef, useState, useCallback } from "react";
import ParticleCanvas from "./ParticleCanvas";
import ThreeBackground from "./ThreeBackground";

/**
 * ChatEffectsWrapper — wraps the entire chat area to provide:
 *  1. Three.js floating particle background
 *  2. Canvas-based particle burst on message send
 * 
 * Children receive `onSendParticles` callback via render-prop pattern.
 */
const ChatEffectsWrapper = ({ children, showBackground = true }) => {
  const containerRef = useRef(null);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particleOrigin, setParticleOrigin] = useState({ x: null, y: null });

  const handleSendParticles = useCallback((x, y) => {
    setParticleOrigin({ x: x ?? null, y: y ?? null });
    setParticleTrigger((prev) => prev + 1);
  }, []);

  return (
    <div ref={containerRef} className="chat-effects-wrapper">
      {/* Three.js Background */}
      {showBackground && <ThreeBackground />}

      {/* Particle Canvas Overlay */}
      <ParticleCanvas
        trigger={particleTrigger}
        originX={particleOrigin.x}
        originY={particleOrigin.y}
        containerRef={containerRef}
      />

      {/* Chat Content */}
      {typeof children === "function"
        ? children({ onSendParticles: handleSendParticles })
        : children}
    </div>
  );
};

export default ChatEffectsWrapper;
