import { useState, useEffect } from "react";
import { KeyRoundIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, SearchIcon, RefreshCwIcon, UserIcon, MailIcon, CheckIcon, ClipboardIcon } from "lucide-react";
import toast from "react-hot-toast";
import { getPendingPasswordResets, approvePasswordReset, rejectPasswordReset } from "../../lib/adminApi";

const AppealsView = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // stores request ID when performing action

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const data = await getPendingPasswordResets();
      setAppeals(data || []);
    } catch (error) {
      console.error("Error fetching appeals:", error);
      toast.error("Failed to load reset appeals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm("Are you sure you want to APPROVE this password reset request?")) return;
    setActionLoading(id);
    try {
      const result = await approvePasswordReset(id);
      toast.success(result.message || "Password reset request approved!");
      // Update local state or refetch
      fetchAppeals();
    } catch (error) {
      console.error("Error approving appeal:", error);
      toast.error(error.response?.data?.message || "Failed to approve appeal");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Are you sure you want to REJECT this password reset request?")) return;
    setActionLoading(id);
    try {
      const result = await rejectPasswordReset(id);
      toast.success(result.message || "Password reset request rejected!");
      // Update local state or refetch
      fetchAppeals();
    } catch (error) {
      console.error("Error rejecting appeal:", error);
      toast.error(error.response?.data?.message || "Failed to reject appeal");
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Token copied to clipboard!");
  };

  const filteredAppeals = appeals.filter((appeal) => {
    const term = search.toLowerCase();
    const name = appeal.user?.fullName?.toLowerCase() || "";
    const email = appeal.user?.email?.toLowerCase() || "";
    const status = appeal.status?.toLowerCase() || "";
    return name.includes(term) || email.includes(term) || status.includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="badge badge-warning gap-1 py-2 px-3 font-semibold text-xs animate-pulse">
            <ClockIcon className="size-3" /> Pending Approval
          </span>
        );
      case "approved":
        return (
          <span className="badge badge-success gap-1 py-2 px-3 font-semibold text-xs text-success-content">
            <CheckCircle2Icon className="size-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="badge badge-error gap-1 py-2 px-3 font-semibold text-xs text-error-content">
            <XCircleIcon className="size-3" /> Rejected
          </span>
        );
      case "completed":
        return (
          <span className="badge badge-info gap-1 py-2 px-3 font-semibold text-xs text-info-content">
            <CheckIcon className="size-3" /> Reset Completed
          </span>
        );
      default:
        return <span className="badge badge-ghost capitalize">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-300 pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <KeyRoundIcon className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Password Reset Appeals</h2>
            <p className="text-base-content/60 text-sm">
              Manage forgot-password reset requests. Approve requests to generate temporary reset tokens.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAppeals}
          className="btn btn-ghost btn-sm gap-2 border border-base-300 hover:bg-base-200"
          disabled={loading}
        >
          <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search by name, email, or status..."
            className="input input-bordered input-sm w-full pl-9 focus:input-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="text-xs font-semibold text-base-content/50">
          Showing {filteredAppeals.length} of {appeals.length} request(s)
        </div>
      </div>

      {/* Table Card */}
      <div className="card bg-base-200/50 border border-base-300 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="text-sm text-base-content/60 font-medium">Loading appeals...</span>
          </div>
        ) : filteredAppeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <KeyRoundIcon className="size-16 text-base-content/10 mb-4" />
            <h3 className="text-lg font-bold">No appeals found</h3>
            <p className="text-base-content/60 text-sm max-w-sm mt-1">
              There are no password reset appeals matching your criteria or requiring action.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full text-left">
              <thead>
                <tr className="bg-base-300/40 text-base-content/75 font-semibold text-xs border-b border-base-300">
                  <th className="py-4">User</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Reset Token / Details</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300/40">
                {filteredAppeals.map((appeal) => (
                  <tr key={appeal._id} className="hover:bg-base-300/20 transition-colors">
                    {/* User profile */}
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="size-10 rounded-xl bg-base-300 flex items-center justify-center border border-base-300 overflow-hidden">
                            {appeal.user?.profilePic ? (
                              <img src={appeal.user.profilePic} alt={appeal.user.fullName} className="object-cover" />
                            ) : (
                              <UserIcon className="size-5 text-base-content/40" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-base-content">{appeal.user?.fullName || "Unknown User"}</div>
                          <div className="text-xs text-base-content/50 flex items-center gap-1 mt-0.5">
                            <MailIcon className="size-3" /> {appeal.user?.email || "No Email"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Submission date */}
                    <td className="text-sm text-base-content/70">
                      <div>{new Date(appeal.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-base-content/40 mt-0.5">
                        {new Date(appeal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td>{getStatusBadge(appeal.status)}</td>

                    {/* Token detail */}
                    <td className="text-sm">
                      {appeal.status === "approved" ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 bg-success/15 border border-success/30 rounded-lg p-1.5 w-fit max-w-[280px]">
                            <span className="font-mono text-xs text-success select-all truncate block flex-1">
                              {appeal.resetToken}
                            </span>
                            <button
                              onClick={() => copyToClipboard(appeal.resetToken)}
                              className="btn btn-ghost btn-xs btn-circle text-success hover:bg-success/20"
                              title="Copy Token"
                            >
                              <ClipboardIcon className="size-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-base-content/50">
                            Expires: {new Date(appeal.tokenExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(appeal.tokenExpiresAt).toLocaleDateString()})
                          </div>
                        </div>
                      ) : appeal.status === "completed" ? (
                        <div className="text-xs text-base-content/50">
                          Approved by {appeal.adminApprovedBy?.fullName || "Admin"}
                        </div>
                      ) : (
                        <span className="text-xs text-base-content/40 italic">—</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="text-right">
                      {appeal.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReject(appeal._id)}
                            className="btn btn-error btn-xs font-semibold px-3 text-error-content hover:shadow-lg hover:shadow-error/15"
                            disabled={actionLoading !== null}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(appeal._id)}
                            className="btn btn-success btn-xs font-semibold px-3 text-success-content hover:shadow-lg hover:shadow-success/15"
                            disabled={actionLoading !== null}
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-base-content/30 select-none">No Action Required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealsView;
