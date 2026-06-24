import { useState, useEffect } from "react";
import {
  Trash2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  SearchIcon,
  RefreshCwIcon,
  UserIcon,
  MailIcon,
  DownloadIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAccountDeletionRequests,
  approveAccountDeletion,
  rejectAccountDeletion,
} from "../../lib/adminApi";

const AccountDeletionView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getAccountDeletionRequests();
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching deletion requests:", error);
      toast.error("Failed to load account deletion requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    const userName =
      requests.find((r) => r._id === id)?.user?.fullName || "this user";
    if (
      !confirm(
        `PERMANENTLY DELETE the account for "${userName}"? This cannot be undone.`
      )
    ) {
      return;
    }
    if (
      !confirm(
        "Final confirmation: All user data will be erased immediately. Continue?"
      )
    ) {
      return;
    }
    setActionLoading(id);
    try {
      const result = await approveAccountDeletion(id);
      toast.success(result.message || "Account permanently deleted");
      fetchRequests();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to approve deletion"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const note = prompt("Optional note for the user (reason for rejection):");
    if (note === null) return;
    setActionLoading(id);
    try {
      const result = await rejectAccountDeletion(id, note);
      toast.success(result.message || "Deletion request rejected");
      fetchRequests();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reject deletion request"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter((req) => {
    const term = search.toLowerCase();
    const name = req.user?.fullName?.toLowerCase() || "";
    const email = req.user?.email?.toLowerCase() || "";
    const status = req.status?.toLowerCase() || "";
    return name.includes(term) || email.includes(term) || status.includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="badge badge-warning gap-1 text-xs">
            <ClockIcon className="size-3" /> Pending
          </span>
        );
      case "completed":
        return (
          <span className="badge badge-success gap-1 text-xs">
            <CheckCircle2Icon className="size-3" /> Deleted
          </span>
        );
      case "rejected":
        return (
          <span className="badge badge-error gap-1 text-xs">
            <XCircleIcon className="size-3" /> Rejected
          </span>
        );
      case "cancelled":
        return <span className="badge badge-ghost text-xs">Cancelled</span>;
      default:
        return <span className="badge badge-ghost text-xs">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trash2Icon className="size-7 text-error" />
            Account deletion requests
          </h2>
          <p className="text-sm opacity-60 mt-1">
            Review user requests. Approving permanently erases the account and all data.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm gap-2"
          onClick={fetchRequests}
          disabled={loading}
        >
          <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <SearchIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          type="text"
          placeholder="Search by name, email, or status..."
          className="input input-bordered w-full pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="text-xs opacity-50">
        Showing {filtered.length} of {requests.length} request(s)
      </p>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <span className="text-sm opacity-60">Loading requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 opacity-50">
          <Trash2Icon className="size-12 mx-auto mb-3 opacity-30" />
          <h3 className="text-lg font-bold">No deletion requests</h3>
          <p className="text-sm mt-1">No requests match your search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
          <table className="table table-zebra">
            <thead>
              <tr className="text-xs uppercase opacity-60">
                <th>User</th>
                <th>Submitted</th>
                <th>Data export</th>
                <th>Status</th>
                <th>Reason</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req._id} className="hover:bg-base-200/40">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                          {req.user?.profilePic ? (
                            <img
                              src={req.user.profilePic}
                              alt=""
                              className="object-cover"
                            />
                          ) : (
                            <UserIcon className="size-5 m-auto opacity-60" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {req.user?.fullName || "Deleted user"}
                        </p>
                        <p className="text-xs opacity-50 flex items-center gap-1">
                          <MailIcon className="size-3" />
                          {req.user?.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {req.dataDownloadedAt ? (
                      <span className="badge badge-success badge-sm gap-1">
                        <DownloadIcon className="size-3" /> Yes
                      </span>
                    ) : (
                      <span className="badge badge-ghost badge-sm">No</span>
                    )}
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td className="text-sm max-w-[12rem] truncate opacity-70">
                    {req.reason || "—"}
                  </td>
                  <td className="text-right">
                    {req.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          disabled={actionLoading === req._id}
                          onClick={() => handleReject(req._id)}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn btn-error btn-xs"
                          disabled={actionLoading === req._id}
                          onClick={() => handleApprove(req._id)}
                        >
                          {actionLoading === req._id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            "Approve & delete"
                          )}
                        </button>
                      </div>
                    ) : req.adminNote ? (
                      <span className="text-xs opacity-50">{req.adminNote}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccountDeletionView;
