import { useState } from "react";
import {
  ShieldCheckIcon,
  ShieldAlertIcon,
  GlobeIcon,
  LockIcon,
  BanIcon,
  TerminalIcon,
  EyeIcon,
  KeyIcon,
  ActivityIcon,
  AlertTriangleIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { banIp } from "../../lib/adminApi";

const SecurityView = () => {
  const [ipInput, setIpInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleIpBan = async (e) => {
    e.preventDefault();
    if (!ipInput.trim()) return toast.error("IP address required");
    
    setLoading(true);
    try {
      await banIp(ipInput, reasonInput);
      toast.success(`IP ${ipInput} blacklisted`);
      setIpInput("");
      setReasonInput("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to block IP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <LockIcon className="size-5 sm:size-6 text-primary" />
            Security & Infrastructure
          </h2>
          <p className="text-[10px] sm:text-xs text-base-content/50 mt-1">Defensive controls and firewall management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full border border-success/20 w-fit">
           <ActivityIcon className="size-3 animate-pulse" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Shield Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* IP BLACKLIST FORM */}
        <div className="bg-base-200 border border-base-300 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-error/10 text-error rounded-2xl">
              <GlobeIcon className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">Manual IP Blacklist</h3>
              <p className="text-xs text-base-content/40">Immediately drop all traffic from a specific IP</p>
            </div>
          </div>

          <form onSubmit={handleIpBan} className="space-y-4">
             <div className="form-control w-full">
                <label className="label py-1"><span className="label-text-alt uppercase font-bold text-base-content/40 text-[10px]">Target IP Address</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. 192.168.1.1 or 2001:db8:..."
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  className="input input-bordered bg-base-100 font-mono text-sm focus:border-error"
                />
             </div>
             <div className="form-control w-full">
                <label className="label py-1"><span className="label-text-alt uppercase font-bold text-base-content/40 text-[10px]">Reason for Block</span></label>
                <textarea 
                  placeholder="Specify violation (e.g. DDoS attempt, SQL injection, etc.)"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="textarea textarea-bordered bg-base-100 text-sm h-20 focus:border-error"
                />
             </div>
             <button 
               type="submit" 
               className="btn btn-error btn-block gap-2 shadow-lg shadow-error/20"
               disabled={loading}
             >
               {loading ? <span className="loading loading-spinner loading-xs" /> : <BanIcon className="size-4" />}
               Apply Block (CONFIRM)
             </button>
          </form>
        </div>

        {/* SECURITY STATUS & LOGS MOCK */}
        <div className="space-y-6">
          <div className="bg-base-200 border border-base-300 rounded-3xl p-6 shadow-sm">
             <h3 className="font-bold flex items-center gap-2 mb-4">
                <TerminalIcon className="size-4 text-primary" /> 
                System Threat Levels
             </h3>
             <div className="space-y-4">
                {[
                   { label: "Internal Server Auth", status: "Operational", color: "text-success" },
                   { label: "Socket Middleware", status: "Active (Filtering)", color: "text-success" },
                   { label: "DDoS Protection", status: "Tier 1 Active", color: "text-info" },
                   { label: "AI Toxicity Engine", status: "Processing", color: "text-success" },
                ].map(item => (
                   <div key={item.label} className="flex items-center justify-between p-3 bg-base-300/30 rounded-xl border border-base-300/50">
                      <span className="text-xs font-semibold">{item.label}</span>
                      <span className={`text-[10px] font-black uppercase ${item.color}`}>{item.status}</span>
                   </div>
                ))}
             </div>
          </div>

          <div className="bg-base-200 border border-warning/20 rounded-3xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangleIcon className="size-16 text-warning" />
             </div>
             <div className="relative z-10">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-warning">
                   <AlertTriangleIcon className="size-4" /> 
                   Geo Anomaly Detection
                </h3>
                <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                   System is monitoring for sudden coordinate shifts and proxy-based login bypasses. Advanced security vectors will appear here if triggered.
                </p>
                <div className="p-3 bg-base-300/50 rounded-lg text-[10px] font-mono opacity-40">
                   WAITING_FOR_DATA_FLOW...
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SecurityView;
