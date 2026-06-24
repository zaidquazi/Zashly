import { useState, useEffect, useCallback } from "react";
import {
  HistoryIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TerminalIcon,
  UserIcon,
  ShieldIcon,
  ActivityIcon,
  ClockIcon
} from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "../ProfileAvatar";
import { getAdminLogs } from "../../lib/adminApi";

const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminLogs(page);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error("Failed to load audit trails");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionStyles = (action) => {
    if (action.includes("BAN")) return "bg-error/10 text-error border-error/20";
    if (action.includes("DELETE")) return "bg-error/10 text-error border-error/20";
    if (action.includes("SHADOW")) return "bg-warning/10 text-warning border-warning/20";
    if (action.includes("RESOLVE")) return "bg-success/10 text-success border-success/20";
    return "bg-info/10 text-info border-info/20";
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <TerminalIcon className="size-5 sm:size-6 text-primary" />
            Audit Logs
          </h2>
          <p className="text-[10px] sm:text-xs text-base-content/50 mt-1">Immutable timeline of administrator actions</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm font-medium opacity-50">Deciphering log fragments...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-base-200/50 border border-dashed border-base-300 rounded-2xl p-24 text-center">
          <HistoryIcon className="size-10 mx-auto text-base-content/10 mb-4" />
          <p className="text-sm font-medium text-base-content/30">No administrative logs recorded yet</p>
        </div>
      ) : (
        <div className="bg-base-200 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table table-md w-full">
              <thead>
                <tr className="bg-base-300/50 border-b border-base-300">
                  <th className="font-bold text-[10px] uppercase tracking-wider text-base-content/40">Timestamp</th>
                  <th className="font-bold text-[10px] uppercase tracking-wider text-base-content/40">Admin</th>
                  <th className="font-bold text-[10px] uppercase tracking-wider text-base-content/40">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300/30">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-base-300/20 transition-colors">
                    <td className="py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-mono">{new Date(log.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] opacity-40 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                       </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProfileAvatar src={log.adminId?.profilePic} name={log.adminId?.fullName} size="w-7 h-7" />
                        <span className="text-xs font-bold">{log.adminId?.fullName || "REDACTED"}</span>
                      </div>
                    </td>
                    <td>
                       <span className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded border ${getActionStyles(log.action)}`}>
                         {log.action}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-base-300/30 border-t border-base-300 flex items-center justify-center gap-4">
               <button className="btn btn-xs btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeftIcon className="size-3" /></button>
               <span className="text-[10px] font-bold opacity-40">{page} / {totalPages}</span>
               <button className="btn btn-xs btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRightIcon className="size-3" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogsView;
