import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, X, Send, Square } from "lucide-react";

const MAX_DURATION = 60; // seconds

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [analyserData, setAnalyserData] = useState(new Array(24).fill(4));

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => stopEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopEverything = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up analyser for waveform
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setElapsed(0);

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_DURATION - 1) {
            handleSend();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Waveform animation loop
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars = Array.from(data)
          .slice(0, 24)
          .map((v) => Math.max(4, (v / 255) * 32));
        setAnalyserData(bars);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } catch (err) {
      console.error("Microphone access denied:", err);
      onCancel?.();
    }
  };

  const handleCancel = () => {
    stopEverything();
    setIsRecording(false);
    onCancel?.();
  };

  const handleSend = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        onSend?.(base64, elapsed);
      };
      reader.readAsDataURL(blob);
    };

    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
    setIsRecording(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, onSend]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="voice-recorder-overlay">
      <div className="voice-recorder-container">
        {/* Cancel Button */}
        <button className="vr-cancel-btn" onClick={handleCancel} title="Cancel">
          <X size={20} />
        </button>

        {/* Waveform + Timer */}
        <div className="vr-center">
          <div className="vr-recording-indicator">
            <span className="vr-pulse-dot" />
            <span className="vr-timer">{formatTime(elapsed)}</span>
          </div>

          <div className="vr-waveform">
            {analyserData.map((h, i) => (
              <div
                key={i}
                className="vr-wave-bar"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>

        {/* Send Button */}
        <button className="vr-send-btn" onClick={handleSend} title="Send">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
