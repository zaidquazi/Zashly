import { useEffect, useRef, useCallback } from "react";

/**
 * ParticleCanvas — 2D Canvas overlay for particle burst effects.
 * When `trigger` increments, a burst of 25-30 particles erupts
 * from `originX`/`originY` (or defaults to bottom-right send area).
 */
const COLORS = [
  "#667eea", "#764ba2", "#7c6eea", "#8b5cf6",
  "#6366f1", "#a78bfa", "#818cf8", "#9f7aea",
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

const ParticleCanvas = ({ trigger, originX, originY, containerRef }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const isRunningRef = useRef(false);

  const spawnParticles = useCallback((x, y) => {
    const count = Math.floor(randomBetween(25, 31));
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(2, 6);
      // Upward bias
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - randomBetween(1.5, 4);
      newParticles.push({
        x,
        y,
        vx,
        vy,
        size: randomBetween(2, 5),
        life: 1.0,
        decay: randomBetween(0.012, 0.025),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        gravity: 0.08,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

    if (particlesRef.current.length === 0) {
      isRunningRef.current = false;
      return;
    }

    for (const p of particlesRef.current) {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      // Skip dead particles
      if (p.life <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();

      // Glow effect
      ctx.globalAlpha = Math.max(0, p.life * 0.3);
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.size * p.life * 1.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef?.current || canvas?.parentElement;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [containerRef]);

  // Trigger burst
  useEffect(() => {
    if (trigger <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = originX ?? rect.width - 40;
    const y = originY ?? rect.height - 30;

    spawnParticles(x, y);

    if (!isRunningRef.current) {
      isRunningRef.current = true;
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, [trigger, originX, originY, spawnParticles, animate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="chat-particle-canvas"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};

export default ParticleCanvas;
