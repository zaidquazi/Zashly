import { useState, useEffect } from "react";
import {
  HardDriveIcon, ImageIcon, VideoIcon, UsersIcon, TrashIcon,
  RefreshCwIcon, LayersIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const MediaManagementView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleting, setDeleting] = useState(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/media");
      setData(res.data);
    } catch {
      toast.error("Failed to load media stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDelete = async (type, id) => {
    if (!confirm(`Permanently delete this ${type}?`)) return;
    setDeleting(id);
    try {
      await axiosInstance.delete(`/admin/media/${type}/${id}`);
      toast.success("Media deleted");
      fetchMedia();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-300 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
            <HardDriveIcon className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Media & Storage</h2>
            <p className="text-base-content/60 text-sm">Monitor and manage all uploaded media across the platform.</p>
          </div>
        </div>
        <button onClick={fetchMedia} className="btn btn-ghost btn-sm btn-circle" title="Refresh">
          <RefreshCwIcon className="size-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Media", value: stats.totalMediaItems, icon: LayersIcon, color: "text-primary" },
          { label: "Chat Images", value: stats.imageMessages, icon: ImageIcon, color: "text-info" },
          { label: "Image Moments", value: stats.imageMoments, icon: ImageIcon, color: "text-success" },
          { label: "Video Moments", value: stats.videoMoments, icon: VideoIcon, color: "text-warning" },
        ].map((card) => (
          <div key={card.label} className="bg-base-200/50 border border-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`size-4 ${card.color}`} />
              <span className="text-xs font-medium text-base-content/50">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <div className="bg-base-200/50 border border-base-300 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="size-4 text-accent" />
            <span className="text-xs font-medium text-base-content/50">Profile Pictures</span>
          </div>
          <p className="text-2xl font-bold">{stats.usersWithProfilePic ?? 0}</p>
        </div>
        <div className="bg-base-200/50 border border-base-300 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <LayersIcon className="size-4 text-secondary" />
            <span className="text-xs font-medium text-base-content/50">Group Avatars</span>
          </div>
          <p className="text-2xl font-bold">{stats.groupsWithAvatar ?? 0}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="tabs tabs-boxed bg-base-200/50 w-fit">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Chat Images
        </button>
        <button
          className={`tab ${activeTab === "moments" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("moments")}
        >
          Moments
        </button>
      </div>

      {/* Chat Images */}
      {activeTab === "overview" && (
        <div>
          <h3 className="font-bold text-sm mb-3 text-base-content/60">Recent Chat Image Uploads</h3>
          {data?.recentMedia?.length === 0 ? (
            <p className="text-center py-10 text-base-content/40">No image messages found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.recentMedia?.map((msg) => (
                <div key={msg._id} className="card bg-base-200/50 border border-base-300 overflow-hidden">
                  {msg.content?.startsWith("http") && (
                    <figure className="h-40 bg-base-300">
                      <img src={msg.content} alt="chat media" className="w-full h-full object-cover" />
                    </figure>
                  )}
                  <div className="card-body p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">{msg.sender?.fullName || "Unknown"}</p>
                        <p className="text-[10px] text-base-content/40">
                          in {msg.groupId?.name || "Unknown Group"} • {new Date(msg.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleDelete("message", msg._id)}
                        disabled={deleting === msg._id}
                      >
                        {deleting === msg._id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <TrashIcon className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Moments */}
      {activeTab === "moments" && (
        <div>
          <h3 className="font-bold text-sm mb-3 text-base-content/60">Recent Moments</h3>
          {data?.recentMoments?.length === 0 ? (
            <p className="text-center py-10 text-base-content/40">No moments found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.recentMoments?.map((moment) => (
                <div key={moment._id} className="card bg-base-200/50 border border-base-300 overflow-hidden">
                  <figure className="h-40 bg-base-300">
                    {moment.type === "video" ? (
                      <video src={moment.mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={moment.mediaUrl} alt="moment" className="w-full h-full object-cover" />
                    )}
                  </figure>
                  <div className="card-body p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">{moment.user?.fullName || "Unknown"}</p>
                        <div className="flex gap-1 items-center">
                          <span className={`badge badge-xs ${moment.type === "video" ? "badge-warning" : "badge-info"}`}>
                            {moment.type}
                          </span>
                          <span className="text-[10px] text-base-content/40">
                            {moment.viewers?.length || 0} views
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleDelete("moment", moment._id)}
                        disabled={deleting === moment._id}
                      >
                        {deleting === moment._id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <TrashIcon className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaManagementView;
