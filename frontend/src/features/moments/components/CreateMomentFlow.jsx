import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Type, Send, Palette } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMoment } from "../../lib/api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

const COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#000000", // black
];

export default function CreateMomentFlow({ isOpen, onClose }) {
  const [mode, setMode] = useState("media"); // 'media' | 'text'
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState(COLORS[0]);

  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (variables) => createMoment(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
      setPreview(null);
      toast.success("Moment posted successfully!");
      onClose();
    },
    onError: (err) => {
      console.error("Upload error:", err);
      toast.error(err?.response?.data?.message || "Failed to post moment");
    }
  });

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const getVideoDurationMs = (file) =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const sec = v.duration || 0;
        URL.revokeObjectURL(url);
        resolve(Math.min(Math.round(sec * 1000), 50000));
      };
      v.src = url;
    });

  const compressImage = async (file) => {
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      return await fileToDataUrl(compressedFile);
    } catch (error) {
      return await fileToDataUrl(file); 
    }
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview({ file, url: URL.createObjectURL(file) });
  };

  const handlePost = async () => {
    if (mode === "text") {
      if (!text.trim()) return toast.error("Please enter some text");
      createMutation.mutate({
        type: "text",
        durationMs: 5000,
        metadata: { text, bgColor }
      });
      return;
    }

    if (!preview) return toast.error("Please select an image or video");
    
    const file = preview.file;
    const MAX_SIZE = 55 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return toast.error("File is too large. Max limit is 55MB.");
    }

    const isVideo = file.type.startsWith("video/");
    let mediaData;
    
    if (isVideo) {
      mediaData = await fileToDataUrl(file);
    } else {
      mediaData = await compressImage(file);
    }

    const durationMs = isVideo ? await getVideoDurationMs(file) : 5000;

    createMutation.mutate({
      mediaUrl: mediaData,
      type: isVideo ? "video" : "image",
      durationMs,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black sm:bg-black/90 flex flex-col items-center justify-center touch-none"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="w-full h-full sm:w-[400px] sm:h-[80vh] bg-base-100 sm:rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
              <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost bg-black/20 text-white backdrop-blur-md">
                <X className="w-5 h-5" />
              </button>
              
              {mode === 'text' && (
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-circle btn-sm btn-ghost bg-black/20 text-white backdrop-blur-md">
                    <Palette className="w-4 h-4" />
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52 flex-row flex-wrap gap-2 justify-center mt-2">
                    {COLORS.map(c => (
                      <li key={c}>
                        <button 
                          className="w-8 h-8 rounded-full shadow-sm ring-2 ring-offset-2 ring-offset-base-200 hover:scale-110 transition-transform" 
                          style={{ backgroundColor: c, borderColor: c === bgColor ? 'white' : 'transparent' }}
                          onClick={() => setBgColor(c)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden">
              {mode === "text" ? (
                <div 
                  className="w-full h-full flex items-center justify-center p-8 transition-colors duration-300"
                  style={{ backgroundColor: bgColor }}
                >
                  <textarea
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type something..."
                    className="bg-transparent border-0 outline-none text-white text-3xl sm:text-4xl font-bold text-center w-full resize-none placeholder-white/50 drop-shadow-lg font-sans"
                    rows={5}
                  />
                </div>
              ) : preview ? (
                preview.file.type.startsWith("video/") ? (
                  <video src={preview.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={preview.url} className="w-full h-full object-cover" alt="Preview" />
                )
              ) : (
                <div className="text-white/50 flex flex-col items-center gap-4">
                  <ImageIcon className="w-16 h-16 opacity-50" />
                  <p>Select a photo or video</p>
                  <button 
                    className="btn btn-primary rounded-full px-8 shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Open Gallery
                  </button>
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleSelectFile}
                    onClick={(e) => (e.target.value = null)}
                  />
                </div>
              )}

              {/* Upload Overlay */}
              {createMutation.isPending && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
                  <p className="text-white font-medium">Posting Moment...</p>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
              <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1">
                <button 
                  className={`btn btn-sm rounded-full border-0 ${mode === 'media' ? 'bg-white text-black hover:bg-white/90' : 'bg-transparent text-white hover:bg-white/20'}`}
                  onClick={() => setMode('media')}
                >
                  <ImageIcon className="w-4 h-4 mr-1" /> Media
                </button>
                <button 
                  className={`btn btn-sm rounded-full border-0 ${mode === 'text' ? 'bg-white text-black hover:bg-white/90' : 'bg-transparent text-white hover:bg-white/20'}`}
                  onClick={() => setMode('text')}
                >
                  <Type className="w-4 h-4 mr-1" /> Text
                </button>
              </div>

              {(mode === 'text' || preview) && (
                <button 
                  className="btn btn-circle btn-primary shadow-xl"
                  onClick={handlePost}
                  disabled={createMutation.isPending}
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              )}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
