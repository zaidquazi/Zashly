import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Users, Ban, Shield, Trash2, Eye, Edit } from "lucide-react";
import axios from "axios";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterRole, filterStatus, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      };
      
      const response = await axios.get("/api/admin/users", { params });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("Error changing user role:", error);
    }
  };

  const handleBanUser = async (userId, banned) => {
    try {
      await axios.put(`/api/admin/users/${userId}/ban`, { 
        banned, 
        reason: banned ? "Administrative action" : null 
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user ban status:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: "badge-error",
      developer: "badge-warning", 
      user: "badge-success"
    };
    return colors[role] || "badge-neutral";
  };

  const getStatusBadge = (user) => {
    if (user.isBanned) return "badge-error";
    if (user.isOnline) return "badge-success";
    return "badge-neutral";
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
          <h1 className="text-3xl font-bold text-base-content">User Management</h1>
          <p className="text-base-content/70 mt-1">Manage platform users and their permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="input input-bordered flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-square">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                className="select select-bordered"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
              
              <select
                className="select select-bordered"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full">
                            {user.profilePic ? (
                              <img src={user.profilePic} alt={user.fullName} />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-semibold">
                                  {user.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-base-content">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-base-content/70">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${getStatusBadge(user)}`}>
                        {user.isBanned ? "Banned" : user.isOnline ? "Online" : "Offline"}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-base-content/70">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <div className="dropdown dropdown-left">
                          <button className="btn btn-ghost btn-sm">
                            <Edit className="w-4 h-4" />
                          </button>
                          <div className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52">
                            <li>
                              <button
                                onClick={() => handleRoleChange(user._id, user.role === "admin" ? "user" : "admin")}
                                className="text-sm"
                              >
                                <Shield className="w-4 h-4" />
                                {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleBanUser(user._id, !user.isBanned)}
                                className="text-sm"
                              >
                                <Ban className="w-4 h-4" />
                                {user.isBanned ? "Unban User" : "Ban User"}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-sm text-error"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </li>
                          </div>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
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
    </div>
  );
};

export default AdminUsers;
