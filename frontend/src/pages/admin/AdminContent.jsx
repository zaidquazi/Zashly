import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Eye, EyeOff, Trash2, AlertTriangle, FileText } from "lucide-react";
import axios from "axios";

const AdminContent = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [filters, currentPage]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...filters
      };
      
      const response = await axios.get("/api/admin/content/content", { params });
      setContent(response.data.content);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHideContent = async (contentId, hidden) => {
    try {
      await axios.put(`/api/admin/content/${contentId}/hide`, {
        hidden,
        reason: hidden ? "Administrative action" : null
      });
      fetchContent();
    } catch (error) {
      console.error("Error updating content visibility:", error);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/admin/content/${contentId}`);
        fetchContent();
      } catch (error) {
        console.error("Error deleting content:", error);
      }
    }
  };

  const getStatusBadge = (content) => {
    if (content.isHidden) return "badge-error";
    return "badge-success";
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
          <h1 className="text-3xl font-bold text-base-content">Content Moderation</h1>
          <p className="text-base-content/70 mt-1">Review and moderate user-generated content</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex gap-4">
            <select
              className="select select-bordered"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Content</option>
              <option value="hidden">Hidden Content</option>
              <option value="reported">Reported Content</option>
            </select>
            
            <select
              className="select select-bordered"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="all">All Types</option>
              <option value="moment">Moments</option>
              <option value="message">Messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card bg-base-100 shadow-lg"
          >
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full">
                      {item.userId?.profilePic ? (
                        <img src={item.userId.profilePic} alt={item.userId.fullName} />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold">
                            {item.userId?.fullName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-content">
                      {item.userId?.fullName}
                    </p>
                    <p className="text-xs text-base-content/70">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`badge ${getStatusBadge(item)}`}>
                  {item.isHidden ? "Hidden" : "Visible"}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-base-content line-clamp-3">
                  {item.content}
                </p>
                
                {item.image && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={item.image} 
                      alt="Content" 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                {item.likes && (
                  <div className="flex items-center gap-2 text-sm text-base-content/70">
                    <span>{item.likes.length} likes</span>
                  </div>
                )}

                {item.isHidden && item.hiddenReason && (
                  <div className="alert alert-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">{item.hiddenReason}</span>
                  </div>
                )}
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSelectedContent(item);
                    setShowDetailsModal(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className={`btn btn-sm ${item.isHidden ? "btn-success" : "btn-warning"}`}
                  onClick={() => handleHideContent(item._id, !item.isHidden)}
                >
                  {item.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {item.isHidden ? "Unhide" : "Hide"}
                </button>
                <button
                  className="btn btn-error btn-sm"
                  onClick={() => handleDeleteContent(item._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
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

      {/* Content Details Modal */}
      {showDetailsModal && selectedContent && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg text-base-content">Content Details</h3>
            
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full">
                    {selectedContent.userId?.profilePic ? (
                      <img src={selectedContent.userId.profilePic} alt={selectedContent.userId.fullName} />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold">
                          {selectedContent.userId?.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-base-content">
                    {selectedContent.userId?.fullName}
                  </p>
                  <p className="text-sm text-base-content/70">
                    {selectedContent.userId?.email}
                  </p>
                  <p className="text-xs text-base-content/50">
                    Created: {new Date(selectedContent.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-base-content/70 mb-2">Content</p>
                <div className="bg-base-200 rounded-lg p-4">
                  <p className="text-base-content">{selectedContent.content}</p>
                </div>
              </div>

              {selectedContent.image && (
                <div>
                  <p className="text-sm text-base-content/70 mb-2">Image</p>
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={selectedContent.image} 
                      alt="Content" 
                      className="w-full max-h-64 object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-base-content/70">Status</p>
                  <div className={`badge ${getStatusBadge(selectedContent)} mt-1`}>
                    {selectedContent.isHidden ? "Hidden" : "Visible"}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Engagement</p>
                  <p className="text-base-content mt-1">
                    {selectedContent.likes?.length || 0} likes
                  </p>
                </div>
              </div>

              {selectedContent.isHidden && selectedContent.hiddenReason && (
                <div>
                  <p className="text-sm text-base-content/70">Hidden Reason</p>
                  <div className="alert alert-warning mt-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{selectedContent.hiddenReason}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
              <button
                className={`btn ${selectedContent.isHidden ? "btn-success" : "btn-warning"}`}
                onClick={() => {
                  handleHideContent(selectedContent._id, !selectedContent.isHidden);
                  setShowDetailsModal(false);
                }}
              >
                {selectedContent.isHidden ? "Unhide Content" : "Hide Content"}
              </button>
              <button
                className="btn btn-error"
                onClick={() => {
                  handleDeleteContent(selectedContent._id);
                  setShowDetailsModal(false);
                }}
              >
                Delete Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
