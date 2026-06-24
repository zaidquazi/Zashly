import { useState, useEffect, useRef } from "react";
import { XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

/**
 * Full-screen profile image viewer — like WhatsApp / Instagram.
 * Tap the profile pic to open; pinch-zoom + drag supported.
 */
const ProfileImageViewer = ({ src, name, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);
  const containerRef = useRef(null);

  // Reset zoom when opened
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  /* ---------- drag/pan ---------- */
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  /* ---------- touch ---------- */
  const handleTouchStart = (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    const t = e.touches[0];
    setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const initial = name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <div
      ref={containerRef}
      className={`profile-image-viewer-overlay ${closing ? "profile-image-viewer-closing" : ""}`}
      onClick={(e) => {
        if (e.target === containerRef.current) handleClose();
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="profile-image-viewer-header">
        <span className="profile-image-viewer-name">{name || "User"}</span>
        <button className="profile-image-viewer-close" onClick={handleClose}>
          <XIcon size={22} />
        </button>
      </div>

      {/* Image */}
      <div className="profile-image-viewer-body">
        {src ? (
          <img
            src={src}
            alt={name}
            className="profile-image-viewer-img"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? "grab" : "zoom-in",
            }}
            draggable={false}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        ) : (
          <div className="profile-image-viewer-fallback" onDoubleClick={handleDoubleClick}>
            <span>{initial}</span>
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="profile-image-viewer-controls">
        <button onClick={handleZoomOut} disabled={scale <= 1}><ZoomOutIcon size={20} /></button>
        <span className="profile-image-viewer-zoom-level">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} disabled={scale >= 4}><ZoomInIcon size={20} /></button>
      </div>
    </div>
  );
};

export default ProfileImageViewer;
