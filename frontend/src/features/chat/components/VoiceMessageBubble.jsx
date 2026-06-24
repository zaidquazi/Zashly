import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Mic } from "lucide-react";

const VoiceMessageBubble = ({ audioSrc, duration, isOwn, senderName, isGroupChat }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const toggleSpeed = (e) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
      setAudioDuration(audioRef.current.duration);
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
      progressIntervalRef.current = setInterval(() => {
        if (audio.duration && isFinite(audio.duration)) {
          setProgress((audio.currentTime / audio.duration) * 100);
          setCurrentTime(audio.currentTime);
        }
      }, 50);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audio.currentTime = pct * audio.duration;
    setProgress(pct * 100);
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (sec) => {
    if (!sec || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const displayDuration = isPlaying ? currentTime : audioDuration;

  return (
    <div className={`premium-vm-bubble ${isOwn ? "own" : "other"}`}>
      {isGroupChat && !isOwn && senderName && (
        <div className="vm-sender-name">{senderName}</div>
      )}
      <div className="vm-content">
        <button className="vm-play-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="vm-track">
          <div className="vm-progress-bar" onClick={handleProgressClick}>
            <div className="vm-progress-fill" style={{ width: `${progress}%` }} />
            <div className="vm-progress-thumb" style={{ left: `${progress}%` }} />
          </div>
          <div className="vm-waveform-static">
            {Array.from({ length: 28 }).map((_, i) => {
              const h = Math.sin(i * 0.5) * 8 + Math.random() * 6 + 4;
              return <div key={i} className="vm-static-bar" style={{ height: `${h}px` }} />;
            })}
          </div>
        </div>

        <div className="vm-duration">{formatTime(displayDuration)}</div>
        
        {isPlaying ? (
          <button 
            className="text-[10px] font-bold bg-base-300 text-base-content px-1.5 py-0.5 rounded-full hover:bg-base-200 transition-colors"
            onClick={toggleSpeed}
          >
            {playbackRate}x
          </button>
        ) : (
          <div className="vm-mic-icon">
            <Mic size={14} />
          </div>
        )}
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  );
};

export default VoiceMessageBubble;
