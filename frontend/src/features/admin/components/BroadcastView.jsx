import { useState } from "react";
import { MegaphoneIcon, SendIcon, AlertTriangleIcon, InfoIcon, ShieldAlertIcon } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const BroadcastView = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      return toast.error("Title and message are required");
    }

    setIsSending(true);
    try {
      await axiosInstance.post("/admin/announcements", {
        title,
        message,
        type,
      });
      toast.success("Broadcast sent to all online users!");
      setTitle("");
      setMessage("");
      setType("info");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const getTypeIcon = (t) => {
    switch (t) {
      case "info": return <InfoIcon className="size-5 text-info" />;
      case "warning": return <AlertTriangleIcon className="size-5 text-warning" />;
      case "error": return <ShieldAlertIcon className="size-5 text-error" />;
      default: return <MegaphoneIcon className="size-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-base-300 pb-4">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <MegaphoneIcon className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Global Broadcasts</h2>
          <p className="text-base-content/60 text-sm">Send real-time announcements to all online users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="card bg-base-200/50 border border-base-300">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">Compose Message</h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Broadcast Type</span>
                </label>
                <div className="flex gap-4">
                  {["info", "warning", "error"].map((t) => (
                    <label key={t} className="cursor-pointer flex items-center gap-2 bg-base-100 px-4 py-2 rounded-lg border border-base-300 hover:border-primary/50 transition-colors">
                      <input 
                        type="radio" 
                        name="type" 
                        className="radio radio-primary radio-sm" 
                        checked={type === t}
                        onChange={() => setType(t)}
                      />
                      <span className="capitalize text-sm font-medium">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Title</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Maintenance"
                  className="input input-bordered focus:input-primary transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Message</span>
                </label>
                <textarea
                  placeholder="Enter your announcement here..."
                  className="textarea textarea-bordered h-32 focus:textarea-primary transition-all resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={300}
                  required
                ></textarea>
                <label className="label">
                  <span className="label-text-alt text-base-content/60">{message.length}/300</span>
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full mt-4"
                disabled={isSending || !title.trim() || !message.trim()}
              >
                {isSending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <SendIcon className="size-4" />
                    Send Broadcast Now
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg px-2">Live Preview</h3>
          <div className="bg-base-200 rounded-2xl p-8 border border-base-300 h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
            {/* Fake desktop background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}></div>
            
            {title || message ? (
              <div className="bg-base-100 shadow-2xl rounded-xl border border-base-300 p-4 max-w-sm w-full animate-in zoom-in-95 duration-300 relative z-10">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getTypeIcon(type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{title || "Announcement Title"}</h4>
                    <p className="text-sm text-base-content/80 mt-1 break-words whitespace-pre-wrap">
                      {message || "Your message will appear here..."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-base-content/40 z-10">
                <MegaphoneIcon className="size-12 mx-auto mb-3 opacity-20" />
                <p>Start typing to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastView;
