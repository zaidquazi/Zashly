import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  MessageSquareIcon,
  UserIcon,
  ClockIcon,
  AlertTriangleIcon,
  ChevronRightIcon
} from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "../ProfileAvatar";
import { getAdminReports, resolveReport } from "../../lib/adminApi";

const ModerationView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminReports();
      setReports(data);
    } catch (err) {
      toast.error("Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId, status) => {
    setActionLoading(reportId);
    try {
      await resolveReport(reportId, status);
      toast.success(`Report status updated to ${status}`);
      fetchReports();
    } catch (err) {
      toast.error("Failed to resolve report");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm font-medium animate-pulse opacity-50">Scanning for violations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShieldAlertIcon className="size-5 sm:size-6 text-primary" />
            Moderation Queue
          </h2>
          <p className="text-[10px] sm:text-xs text-base-content/50 mt-1">Review and action user reports</p>
        </div>
        <span className="badge badge-error badge-sm font-bold">{reports.length} Pending Actions</span>
      </div>

      {reports.length === 0 ? (
        <div className="bg-base-200/50 border border-dashed border-base-300 rounded-2xl p-24 text-center">
          <CheckCircleIcon className="size-10 mx-auto text-success/30 mb-4" />
          <p className="text-sm font-medium text-base-content/30">Moderation queue cleared. Everything is optimal.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-base-200 border border-base-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 flex flex-col md:flex-row gap-6">
                
                {/* Reporter & Reported Info */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[9px] sm:text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Reporter</p>
                      <div className="flex items-center gap-2">
                        <ProfileAvatar src={report.reporter?.profilePic} name={report.reporter?.fullName} size="w-7 h-7 sm:w-8 sm:h-8" />
                        <div className="min-w-0">
                           <p className="text-xs sm:text-sm font-bold truncate">{report.reporter?.fullName || "Deleted"}</p>
                           <p className="text-[9px] sm:text-[10px] opacity-50 truncate">{report.reporter?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] sm:text-[10px] font-bold text-error/60 uppercase tracking-widest">Target User</p>
                      <div className="flex items-center gap-2">
                        <ProfileAvatar src={report.reportedUser?.profilePic} name={report.reportedUser?.fullName} size="w-7 h-7 sm:w-8 sm:h-8" />
                        <div className="min-w-0">
                           <p className="text-xs sm:text-sm font-bold truncate">{report.reportedUser?.fullName || "Deleted"}</p>
                           <p className="text-[9px] sm:text-[10px] opacity-50 truncate">{report.reportedUser?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-base-300/30 rounded-xl p-4 border border-base-300/50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangleIcon className="size-3 text-warning" />
                      <p className="text-xs font-bold uppercase tracking-wide text-base-content/60">Reason: {report.reason}</p>
                    </div>
                    {report.messageId ? (
                      <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                        <p className="text-xs italic text-base-content/70">"{report.messageId.content}"</p>
                        <div className="mt-2 flex items-center justify-between">
                           <span className="text-[9px] font-mono opacity-30">{new Date(report.messageId.createdAt).toLocaleString()}</span>
                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${report.aiToxicityScore > 0.7 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                             AI Toxicity: {(report.aiToxicityScore * 100).toFixed(0)}%
                           </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-base-content/40 italic">User-level report (no specific message attached)</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="md:w-48 flex flex-col justify-between pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-base-300 md:pl-6 space-y-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-base-content/40 uppercase">Received</p>
                      <p className="text-xs font-mono">{new Date(report.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] font-mono text-base-content/40">{new Date(report.createdAt).toLocaleTimeString()}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-2">
                      <button 
                        className="btn btn-sm btn-ghost text-success hover:bg-success/10 gap-2 justify-start"
                        onClick={() => handleResolve(report._id, "reviewed")}
                        disabled={actionLoading === report._id}
                      >
                        <CheckCircleIcon className="size-4" /> Resolve
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10 gap-2 justify-start"
                        onClick={() => handleResolve(report._id, "actioned")}
                        disabled={actionLoading === report._id}
                      >
                        <XCircleIcon className="size-4" /> Actioned
                      </button>
                   </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationView;
