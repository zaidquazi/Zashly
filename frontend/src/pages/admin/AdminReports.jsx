import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, AlertTriangle, Eye, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import axios from "axios";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    reason: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReports();
  }, [filters, currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...filters
      };
      
      const response = await axios.get("/api/admin/content/reports", { params });
      setReports(response.data.reports);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, status, actionTaken, adminNotes) => {
    try {
      await axios.put(`/api/admin/content/reports/${reportId}`, {
        status,
        actionTaken,
        adminNotes
      });
      fetchReports();
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error updating report:", error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: "badge-warning",
      UNDER_REVIEW: "badge-info",
      RESOLVED: "badge-success",
      DISMISSED: "badge-neutral"
    };
    return colors[status] || "badge-neutral";
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      LOW: "badge-success",
      MEDIUM: "badge-warning",
      HIGH: "badge-error",
      URGENT: "badge-error badge-outline"
    };
    return colors[priority] || "badge-neutral";
  };

  const getReasonIcon = (reason) => {
    const icons = {
      SPAM: AlertTriangle,
      INAPPROPRIATE_CONTENT: AlertTriangle,
      HARASSMENT: AlertTriangle,
      FAKE_ACCOUNT: AlertTriangle,
      VIOLENCE: AlertTriangle,
      COPYRIGHT: AlertTriangle,
      OTHER: AlertTriangle
    };
    return icons[reason] || AlertTriangle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Reports & Complaints</h1>
          <p className="text-base-content/70 mt-1">Review and handle user reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <select
              className="select select-bordered"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
            
            <select
              className="select select-bordered"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            
            <select
              className="select select-bordered"
              value={filters.reason}
              onChange={(e) => setFilters(prev => ({ ...prev, reason: e.target.value }))}
            >
              <option value="all">All Reasons</option>
              <option value="SPAM">Spam</option>
              <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="FAKE_ACCOUNT">Fake Account</option>
              <option value="VIOLENCE">Violence</option>
              <option value="COPYRIGHT">Copyright</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Reporter</th>
                  <th>Reported</th>
                  <th>Reason</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => {
                  const ReasonIcon = getReasonIcon(report.reason);
                  return (
                    <motion.tr
                      key={report._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <ReasonIcon className="w-4 h-4 text-warning" />
                          <div>
                            <div className="text-sm font-medium text-base-content">
                              {report.reportedContentType}
                            </div>
                            <div className="text-xs text-base-content/70">
                              {report.description.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar">
                            <div className="w-8 h-8 rounded-full">
                              {report.reporterId?.profilePic ? (
                                <img src={report.reporterId.profilePic} alt={report.reporterId.fullName} />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold">
                                    {report.reporterId?.fullName?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-base-content">
                              {report.reporterId?.fullName}
                            </div>
                            <div className="text-xs text-base-content/70">
                              {report.reporterId?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar">
                            <div className="w-8 h-8 rounded-full">
                              {report.reportedUserId?.profilePic ? (
                                <img src={report.reportedUserId.profilePic} alt={report.reportedUserId.fullName} />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold">
                                    {report.reportedUserId?.fullName?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-base-content">
                              {report.reportedUserId?.fullName}
                            </div>
                            <div className="text-xs text-base-content/70">
                              {report.reportedUserId?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`badge ${getPriorityBadge(report.priority)}`}>
                          {report.reason}
                        </div>
                      </td>
                      <td>
                        <div className={`badge ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i + 1}
                className={`join-item btn ${currentPage === i + 1 ? "btn-active" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="join-item btn"
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg text-base-content">Report Details</h3>
            
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-base-content/70">Reporter</p>
                  <p className="font-medium text-base-content">
                    {selectedReport.reporterId?.fullName} ({selectedReport.reporterId?.email})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Reported User</p>
                  <p className="font-medium text-base-content">
                    {selectedReport.reportedUserId?.fullName} ({selectedReport.reportedUserId?.email})
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-base-content/70">Reason</p>
                <div className={`badge ${getPriorityBadge(selectedReport.priority)} mt-1`}>
                  {selectedReport.reason}
                </div>
              </div>

              <div>
                <p className="text-sm text-base-content/70">Description</p>
                <p className="text-base-content mt-1">{selectedReport.description}</p>
              </div>

              <div>
                <p className="text-sm text-base-content/70">Admin Notes</p>
                <textarea
                  className="textarea textarea-bordered w-full mt-1"
                  placeholder="Add admin notes..."
                  defaultValue={selectedReport.adminNotes}
                />
              </div>

              <div>
                <p className="text-sm text-base-content/70">Action</p>
                <select className="select select-bordered w-full mt-1" defaultValue={selectedReport.actionTaken}>
                  <option value="NONE">No Action</option>
                  <option value="WARNING_SENT">Send Warning</option>
                  <option value="CONTENT_REMOVED">Remove Content</option>
                  <option value="USER_BANNED">Ban User</option>
                  <option value="USER_SUSPENDED">Suspend User</option>
                  <option value="REPORT_DISMISSED">Dismiss Report</option>
                </select>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDetailsModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const status = "RESOLVED";
                  const actionTaken = document.querySelector('select').value;
                  const adminNotes = document.querySelector('textarea').value;
                  handleReportAction(selectedReport._id, status, actionTaken, adminNotes);
                }}
              >
                Resolve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
