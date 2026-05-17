import { useState, useEffect } from "react";
import { 
  Settings2Icon, 
  ShieldAlertIcon, 
  UsersIcon, 
  FileTextIcon, 
  RotateCcwIcon, 
  SaveIcon,
  GlobeIcon,
  LockIcon,
  ServerIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { getAppConfig, updateAppConfig } from "../../lib/adminApi";

const SystemConfigView = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getAppConfig();
        setConfig(data);
      } catch (err) {
        toast.error("Failed to load configuration");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAppConfig(config);
      toast.success("System configuration saved successfully");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm font-medium opacity-50">Fetching system state...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Settings2Icon className="size-5 sm:size-6 text-primary" />
            System Configuration
          </h2>
          <p className="text-[10px] sm:text-xs text-base-content/50 mt-1">Configure global application behavior and constraints</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              className="btn btn-ghost btn-sm gap-2 flex-1 sm:flex-none"
              onClick={() => window.location.reload()}
            >
               <RotateCcwIcon className="size-3" /> Reset
            </button>
            <button 
              className="btn btn-primary btn-sm gap-2 shadow-lg shadow-primary/20 flex-1 sm:flex-none"
              onClick={handleUpdate}
              disabled={saving}
            >
               {saving ? <span className="loading loading-spinner loading-xs" /> : <SaveIcon className="size-3" />}
               Save Changes
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* EMERGENCY CONTROLS */}
        <div className="bg-base-200 border border-base-300 rounded-3xl p-6 space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 text-error rounded-xl">
                 <ShieldAlertIcon className="size-4" />
              </div>
              <h3 className="font-bold text-sm">Emergency Controls</h3>
           </div>

           <div className="flex items-center justify-between p-4 bg-base-100 rounded-2xl border border-base-300">
             <div>
               <p className="text-sm font-bold">Maintenance Mode</p>
               <p className="text-[10px] opacity-50">Blocks all non-admin traffic</p>
             </div>
             <input 
               type="checkbox" 
               className="toggle toggle-error" 
               checked={config.maintenanceMode}
               onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
             />
           </div>

           <div className="flex items-center justify-between p-4 bg-base-100 rounded-2xl border border-base-300">
             <div>
               <p className="text-sm font-bold">New Registrations</p>
               <p className="text-[10px] opacity-50">Disable to stop incoming users</p>
             </div>
             <input 
               type="checkbox" 
               className="toggle toggle-primary"
               checked={config.allowNewRegistrations}
               onChange={(e) => handleChange("allowNewRegistrations", e.target.checked)}
             />
           </div>
        </div>

        {/* APP CONSTRAINTS */}
        <div className="bg-base-200 border border-base-300 rounded-3xl p-6 space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 text-info rounded-xl">
                 <ServerIcon className="size-4" />
              </div>
              <h3 className="font-bold text-sm">Resource Constraints</h3>
           </div>

           <div className="space-y-4">
              <div className="form-control">
                <label className="label py-1"><span className="label-text-alt font-bold text-base-content/40 text-[10px] uppercase">Max Group Size</span></label>
                <div className="relative">
                   <UsersIcon className="absolute left-3 top-2.5 size-4 opacity-30" />
                   <input 
                     type="number" 
                     className="input input-bordered w-full pl-10 text-sm"
                     value={config.maxGroupSize}
                     onChange={(e) => handleChange("maxGroupSize", parseInt(e.target.value))}
                   />
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text-alt font-bold text-base-content/40 text-[10px] uppercase">File Upload Limit (MB)</span></label>
                <div className="relative">
                   <FileTextIcon className="absolute left-3 top-2.5 size-4 opacity-30" />
                   <input 
                     type="number" 
                     className="input input-bordered w-full pl-10 text-sm"
                     value={config.fileSizeLimitMB}
                     onChange={(e) => handleChange("fileSizeLimitMB", parseInt(e.target.value))}
                   />
                </div>
              </div>
           </div>
        </div>

        {/* VERSIONING & UPDATES */}
        <div className="bg-base-200 border border-base-300 rounded-3xl p-6 space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
                 <LockIcon className="size-4" />
              </div>
              <h3 className="font-bold text-sm">Versioning & Security</h3>
           </div>

           <div className="form-control">
             <label className="label py-1"><span className="label-text-alt font-bold text-base-content/40 text-[10px] uppercase">Force Update Min version</span></label>
             <input 
               type="text" 
               className="input input-bordered w-full text-sm font-mono"
               placeholder="e.g. 1.2.0"
               value={config.forceUpdateVersion}
               onChange={(e) => handleChange("forceUpdateVersion", e.target.value)}
             />
             <label className="label"><span className="label-text-alt opacity-30 italic">Users on lower versions will be prompted to update</span></label>
           </div>
        </div>

        {/* SYSTEM AUDIT INFO */}
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col justify-center gap-4">
           <div className="flex items-center gap-4">
              <GlobeIcon className="size-8 text-primary/40" />
              <div>
                 <p className="text-[10px] font-bold uppercase text-primary/60 tracking-widest">Last Configuration Update</p>
                 <p className="text-sm font-bold">{config.updatedAt ? new Date(config.updatedAt).toLocaleString() : "Never"}</p>
              </div>
           </div>
           <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <p className="text-xs font-medium text-primary leading-relaxed italic">
                Changing these settings impacts all connected clients in real-time. Ensure you double-check limits before saving.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SystemConfigView;
