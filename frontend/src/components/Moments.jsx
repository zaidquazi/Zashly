import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Camera, MoreVertical, Trash } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMoment,
  deleteMoment,
  getAuthUser,
  getMoments,
  markMomentViewed,
} from "../lib/api";
import MomentViewer from "./MomentViewer";
import StatusRing from "./StatusRing";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

export default function Moments() {
  const queryClient = useQueryClient();
  const { data: moments = [] } = useQuery({ queryKey: ["moments"], queryFn: getMoments });
  const { data: authUser } = useQuery({ 
  queryKey: ["authUser"], 
  queryFn: getAuthUser,
  retry: 1,
  staleTime: 1000 * 60 * 5, // 5 minutes
});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preview, setPreview] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const visibleMoments = useMemo(() => moments, [moments]);

  // --- Delete moment mutation
  const delMutation = useMutation({
    mutationFn: (id) => deleteMoment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
      setConfirmDelete(null); // Close confirmation dialog after successful deletion
    },
  });

  // --- Auto-delete old moments (>24h)
  useEffect(() => {
    const now = new Date();
    moments.forEach((m) => {
      const createdAt = new Date(m.createdAt || m.timestamp || 0);
      const ageHours = (now - createdAt) / (1000 * 60 * 60);
      if (ageHours >= 24) {
        console.log(`🗑 Auto-deleting moment ${m.id} (${ageHours.toFixed(1)}h old)`);
        delMutation.mutate(m.id);
      }
    });
  }, [moments]);

  // --- Create moment mutation
  const createMutation = useMutation({
    mutationFn: (variables) => createMoment({
      ...variables,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
      setPreview(null);
      setUploadProgress(0);
      toast.success("Moment posted successfully!");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setUploadProgress(0);
      toast.error(error?.response?.data?.message || "Failed to post moment");
    }
  });

  // --- Mark as viewed
  const queryMark = useMutation({
    mutationFn: (id) => markMomentViewed(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moments"] }),
  });

  const onSeen = useCallback(
    (id) => {
      queryMark.mutate(id);
    },
    [queryMark]
  );

  // --- Video helpers
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

  // --- Image compression helper using browser-image-compression
  const compressImage = async (file) => {
    try {
      const options = {
        maxSizeMB: 0.5, // Target 500KB
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      return await fileToDataUrl(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
      return await fileToDataUrl(file); // Fallback to original if compression fails
    }
  };

  // --- Upload new moment
  const onUpload = async (file) => {
    if (!file) return;

    // Check size before processing (limit to ~55MB to stay safe with Base64 overhead)
    const MAX_SIZE = 55 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("File is too large. Max limit is 55MB.");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    
    let mediaData;
    if (isVideo) {
      mediaData = await fileToDataUrl(file);
    } else {
      // Compress image before upload to speed up transfer
      mediaData = await compressImage(file);
    }

    const durationMs = isVideo ? await getVideoDurationMs(file) : 5000;
    createMutation.mutate({
      mediaUrl: mediaData,
      type: isVideo ? "video" : "image",
      durationMs,
    });
  };

  // --- Delete confirm
  const confirmDeleteMoment = (id) => setConfirmDelete(id);
  const handleDeleteConfirm = () => confirmDelete && delMutation.mutate(confirmDelete);

  const openAt = (idx) => {
    setCurrentIndex(idx);
    setViewerOpen(true);
  };

  const onPrev = () => {
    setCurrentIndex((i) => (i - 1 + visibleMoments.length) % visibleMoments.length);
  };
  const onNext = () => {
    setCurrentIndex((i) => (i + 1) % visibleMoments.length);
  };

  return (
    <section className="space-y-3 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">Moments</h2>
      </div>

      {uploadProgress > 0 && (
        <div className="mt-2 mb-1 flex items-center gap-3">
          <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden shadow-sm flex-1">
            <div 
              className="bg-primary h-full transition-all duration-200 ease-out" 
              style={{ width: `${uploadProgress}%` }} 
            />
          </div>
          <span className="text-xs font-semibold text-primary w-8 text-right">
            {uploadProgress}%
          </span>
        </div>
      )}

      <div className="relative">
        <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar pt-4 pb-2 px-2 sm:px-0">
          <UploadTile 
            onUpload={onUpload} 
            preview={preview} 
            setPreview={setPreview} 
            isPosting={createMutation.isPending}
          />

          {visibleMoments.map((m, idx) => {
            const isSeen = false;

            // 🧩 Match uploader with logged user
            const momentUserId =
              m.userId || m.user?._id || m.user?.id || "";
            const authUserId =
              authUser?.user?._id || authUser?.user?.id || authUser?.user?.userId || 
              authUser?._id || authUser?.id || authUser?.userId || "";
            const isOwner = momentUserId && authUserId && String(momentUserId) === String(authUserId);
            const role = authUser?.user?.role || authUser?.role;
            const canDelete = isOwner || role === "developer" || role === "admin";

            return (
              <div key={m.id} className="group relative shrink-0 flex flex-col items-center">
                <div
                  className="cursor-pointer flex flex-col items-center"
                  onClick={() => openAt(idx)}
                  title={`${m.username}'s moment`}
                >
                <StatusRing
                  hasStatus={true}
                  viewed={isSeen}
                  isNew={!isSeen && idx === 0}
                  size={80}
                  onClick={() => openAt(idx)}
                >
                  {m.type === "video" ? (
                    <div className="relative w-full h-full">
                      <video
                        src={m.url}
                        className="w-full h-full rounded-full object-cover"
                        muted
                        playsInline
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => e.target.pause()}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 rounded-full p-1">
                          <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={m.url}
                      alt={`${m.username}'s moment`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                </StatusRing>

                {/* ••• Menu at top-right */}
                {canDelete && (
                  <div className="absolute -top-1 -right-1 z-20">
                    <button
                      className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((prev) => (prev === m.id ? null : m.id));
                      }}
                      aria-label="Open menu"
                      title="Options"
                    >
                      <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    {menuOpenId === m.id && (
                      <div
                        className="mt-1 dropdown-content menu p-1 shadow bg-base-100 rounded-box w-24 sm:w-28 border absolute right-0 z-30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-base-200 rounded text-left text-xs sm:text-sm"
                          onClick={() => {
                            setMenuOpenId(null);
                            confirmDeleteMoment(m.id);
                          }}
                        >
                          <Trash className="w-3 h-3 sm:w-4 sm:h-4 text-error" />
                          <span className="text-xs sm:text-sm">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-center text-xs mt-1 opacity-70 hidden sm:block">{m.username}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔍 Viewer with play/pause */}
      {viewerOpen && (
        <MomentViewer
          open={viewerOpen}
          moments={visibleMoments}
          index={currentIndex}
          onClose={() => setViewerOpen(false)}
          onPrev={onPrev}
          onNext={onNext}
          onSeen={onSeen}
          enablePlayPause={true}
        />
      )}

      {/* 🧠 Confirmation Popup */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-base-200 rounded-xl shadow-lg p-4 sm:p-6 w-72 sm:w-80 max-w-full text-center">
            <h3 className="text-lg font-semibold mb-2">Delete Moment?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this moment? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="btn btn-sm btn-error text-white"
                onClick={handleDeleteConfirm}
                disabled={delMutation.isPending}
              >
                {delMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Delete"
                )}
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setConfirmDelete(null)}
                disabled={delMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* 🔼 UploadTile Component */
function UploadTile({ onUpload, preview, setPreview, isPosting }) {
  const onSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview({ file, url: URL.createObjectURL(file) });
  };

  return (
    <div className="shrink-0 flex flex-col items-center">
      <label className={`group ${isPosting ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
        <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary/80 to-secondary/80">
          <div className="p-0.5 bg-base-100 rounded-full flex items-center justify-center">
            <div className="avatar">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden relative flex items-center justify-center bg-base-200">
                {isPosting ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                  </div>
                ) : null}
                {preview ? (
                  preview.file.type.startsWith("video/") ? (
                    <video src={preview.url} className="object-cover w-full h-full" muted />
                  ) : (
                    <img src={preview.url} className="object-cover w-full h-full" alt="preview" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-base-content/80">
                    <Plus className="w-5 h-5 mb-0.5" />
                    <Camera className="w-4 h-4" />
                  </div>
                )}
                <input
                  hidden
                  type="file"
                  accept="image/*,video/*"
                  disabled={isPosting}
                  onChange={onSelect}
                  onClick={(e) => (e.target.value = null)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </label>
      {preview ? (
        <div className="flex gap-1 mt-1 justify-center">
          <button
            className="btn btn-xs btn-primary px-2 min-w-[50px]"
            onClick={() => onUpload(preview.file)}
            disabled={isPosting}
          >
            {isPosting ? <span className="loading loading-spinner loading-xs"></span> : "Post"}
          </button>
          <button
            className="btn btn-xs px-2"
            onClick={() => setPreview(null)}
            disabled={isPosting}
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="text-center text-xs opacity-70 mt-1">Add</div>
      )}
    </div>
  );
}
