import { useState } from "react";
import {
  DatabaseIcon, SearchIcon, DownloadIcon, Trash2Icon, UserIcon,
  FileTextIcon, MessageSquareIcon, PhoneIcon, ImageIcon, AlertTriangleIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const DataComplianceView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [exportData, setExportData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [eraseResult, setEraseResult] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSelectedUser(null);
    setExportData(null);
    setEraseResult(null);
    try {
      const res = await axiosInstance.get("/admin/users", {
        params: { search: searchQuery, limit: 10 },
      });
      setUsers(res.data.users || []);
      if ((res.data.users || []).length === 0) {
        toast("No users found", { icon: "🔍" });
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleExport = async (userId) => {
    setExporting(true);
    setExportData(null);
    try {
      const res = await axiosInstance.get(`/admin/users/${userId}/export`);
      setExportData(res.data);
      toast.success("Data export ready");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-data-${selectedUser?.fullName || "export"}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  const handleHardErase = async (userId, userName) => {
    const confirmation = prompt(
      `⚠️ DANGER ZONE\n\nThis will PERMANENTLY delete ALL data for "${userName}".\n\nType the user's full name to confirm:`
    );
    if (confirmation !== userName) {
      toast.error("Name didn't match. Erase cancelled.");
      return;
    }

    setErasing(true);
    try {
      const res = await axiosInstance.delete(`/admin/users/${userId}/erase`);
      setEraseResult(res.data);
      setSelectedUser(null);
      setExportData(null);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erase failed");
    } finally {
      setErasing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-base-300 pb-4">
        <div className="p-2 bg-accent/10 rounded-xl text-accent">
          <DatabaseIcon className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Data Export & GDPR Compliance</h2>
          <p className="text-base-content/60 text-sm">
            Export user data for legal requests or permanently erase all traces of a user.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card bg-base-200/50 border border-base-300">
        <div className="card-body p-4">
          <h3 className="font-bold text-sm mb-3">Find User</h3>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="input input-bordered input-sm w-full pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={searching}>
              {searching ? <span className="loading loading-spinner loading-xs" /> : "Search"}
            </button>
          </form>
        </div>
      </div>

      {/* User Results */}
      {users.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-base-content/60">Select a User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((user) => (
              <button
                key={user._id}
                onClick={() => { setSelectedUser(user); setExportData(null); setEraseResult(null); }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedUser?._id === user._id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-base-300 bg-base-200/50 hover:border-primary/30"
                }`}
              >
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full bg-base-300">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.fullName} />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <UserIcon className="size-5 text-base-content/30" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.fullName}</p>
                  <p className="text-xs text-base-content/50 truncate">{user.email}</p>
                </div>
                {user.isBanned && <span className="badge badge-error badge-xs">Banned</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected User Actions */}
      {selectedUser && (
        <div className="card bg-base-200/50 border border-base-300">
          <div className="card-body p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{selectedUser.fullName}</h3>
                <p className="text-sm text-base-content/50">{selectedUser.email}</p>
              </div>
              <span className="badge badge-ghost text-xs">ID: {selectedUser._id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Button */}
              <button
                onClick={() => handleExport(selectedUser._id)}
                className="btn btn-outline btn-info"
                disabled={exporting}
              >
                {exporting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <FileTextIcon className="size-4" />
                    Export All Data
                  </>
                )}
              </button>

              {/* Erase Button */}
              <button
                onClick={() => handleHardErase(selectedUser._id, selectedUser.fullName)}
                className="btn btn-outline btn-error"
                disabled={erasing}
              >
                {erasing ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <Trash2Icon className="size-4" />
                    Hard Erase (GDPR)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Data Preview */}
      {exportData && (
        <div className="card bg-base-200/50 border border-base-300">
          <div className="card-body p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Export Preview</h3>
              <button onClick={handleDownload} className="btn btn-primary btn-sm">
                <DownloadIcon className="size-4" />
                Download JSON
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Messages", count: exportData.messages?.count, icon: MessageSquareIcon, color: "text-info" },
                { label: "Moments", count: exportData.moments?.count, icon: ImageIcon, color: "text-success" },
                { label: "Call Logs", count: exportData.callLogs?.count, icon: PhoneIcon, color: "text-warning" },
                { label: "Groups", count: exportData.groups?.count, icon: UserIcon, color: "text-accent" },
              ].map((item) => (
                <div key={item.label} className="bg-base-100 rounded-lg p-3 border border-base-300">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className={`size-3.5 ${item.color}`} />
                    <span className="text-[10px] uppercase font-bold text-base-content/40">{item.label}</span>
                  </div>
                  <p className="text-xl font-bold">{item.count ?? 0}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-base-content/40">
              Exported at: {new Date(exportData.exportedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Erase Result */}
      {eraseResult && (
        <div className="card bg-error/5 border border-error/20">
          <div className="card-body p-5 space-y-3">
            <div className="flex items-center gap-2 text-error">
              <AlertTriangleIcon className="size-5" />
              <h3 className="font-bold">Erase Complete</h3>
            </div>
            <p className="text-sm text-base-content/70">{eraseResult.message}</p>
            <div className="overflow-x-auto">
              <table className="table table-xs">
                <thead>
                  <tr className="text-xs">
                    <th>Category</th>
                    <th>Items Removed</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(eraseResult.summary || {}).map(([key, val]) => (
                    <tr key={key}>
                      <td className="capitalize text-xs">{key.replace(/([A-Z])/g, " $1")}</td>
                      <td className="text-xs font-mono">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataComplianceView;
