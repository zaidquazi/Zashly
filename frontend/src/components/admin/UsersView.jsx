import { useState, useEffect, useCallback, useMemo } from "react";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldBanIcon,
  ShieldCheckIcon,
  Trash2Icon,
  LogOutIcon,
  EyeIcon,
  AlertCircleIcon,
  LockIcon,
  GhostIcon,
  InfoIcon,
  UsersIcon,
  CopyIcon,
  MapPinIcon,
  MonitorIcon,
  CalendarIcon,
  ActivityIcon,
  HashIcon,
  XIcon
} from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "../ProfileAvatar";
import ConfirmModal from "./ConfirmModal";
import {
  getAdminUsers,
  banUser,
  unbanUser,
  deleteUser,
  toggleShadowBan,
  applyStrike,
  forceLogout,
} from "../../lib/adminApi";

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [strikeValue, setStrikeValue] = useState("");
  const [viewingUser, setViewingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers({ search, page });
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (actionFn, user, successMsg) => {
    setActionLoading(user._id);
    try {
      await actionFn(user._id);
      toast.success(successMsg);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const onApplyStrike = async (user) => {
    if (!strikeValue.trim()) return toast.error("Please provide a reason");
    setActionLoading(user._id);
    try {
      await applyStrike(user._id, strikeValue);
      toast.success(`Strike applied to ${user.fullName}`);
      setConfirmAction(null);
      setStrikeValue("");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to apply strike");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-base-200 p-4 rounded-2xl border border-base-300">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            User Management
          </h2>
          <p className="text-xs text-base-content/50 mt-1">Manage accounts, restrictions, and security</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input input-bordered input-sm w-full pl-10 bg-base-100 focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-base-200 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm font-medium animate-pulse">Synchronizing user data...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-24">
             <InfoIcon className="size-12 mx-auto text-base-content/20 mb-4" />
             <p className="text-base-content/50">No users found matching your query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-md w-full">
              <thead>
                <tr className="bg-base-300/50 border-b border-base-300">
                  <th className="font-bold text-[10px] uppercase tracking-wider text-base-content/40">User Profile</th>
                  <th className="font-bold text-[10px] uppercase tracking-wider text-base-content/40 hidden md:table-cell">Role & Status</th>
                  <th className="font-bold text-[10px] uppercase tracking-wider text-base-content/40 hidden lg:table-cell text-center">Strikes</th>
                  <th className="font-bold text-[10px] uppercase tracking-wider text-base-content/40 text-right">Protection Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300/30">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-base-300/20 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <ProfileAvatar
                            src={user.profilePic}
                            name={user.fullName}
                            size="w-10 h-10"
                            textSize="text-sm"
                          />
                          {user.isOnline && (
                             <span className="absolute bottom-0 right-0 size-3 bg-success border-2 border-base-200 rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate max-w-[150px]">{user.fullName}</p>
                          <p className="text-[10px] text-base-content/50 truncate max-w-[180px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                           <span className={`badge badge-xs ${user.role === 'admin' ? 'badge-primary' : user.role === 'developer' ? 'badge-secondary' : 'badge-ghost opacity-60'}`}>
                             {user.role}
                           </span>
                           {user.isVerified && <ShieldCheckIcon className="size-3 text-info" />}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.isBanned && <span className="badge badge-xs badge-error">BANNED</span>}
                          {user.isShadowBanned && <span className="badge badge-xs badge-warning">SHADOWED</span>}
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell text-center">
                       <span className={`text-sm font-bold ${user.strikes >= 2 ? 'text-error' : user.strikes === 1 ? 'text-warning' : 'text-base-content/40'}`}>
                         {user.strikes || 0}
                       </span>
                    </td>
                    <td className="py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Full Info - ALWAYS VISIBLE */}
                          <button
                            className="btn btn-ghost btn-xs text-info tooltip"
                            data-tip="User Intelligence Insight"
                            onClick={() => setViewingUser(user)}
                          >
                            <EyeIcon className="size-4" />
                          </button>

                          {user.role !== "admin" ? (
                            <>
                            {/* Ban/Unban */}
                            <button
                              className={`btn btn-ghost btn-xs ${user.isBanned ? 'text-success' : 'text-warning'} tooltip`}
                              data-tip={user.isBanned ? "Lift Ban" : "Restrict Access (Ban)"}
                              onClick={() => user.isBanned ? handleAction(unbanUser, user, "Ban lifted") : handleAction(banUser, user, "User restricted")}
                              disabled={actionLoading === user._id}
                            >
                              {user.isBanned ? <ShieldCheckIcon className="size-4" /> : <ShieldBanIcon className="size-4" />}
                            </button>

                            {/* Shadow Ban */}
                            <button
                              className={`btn btn-ghost btn-xs ${user.isShadowBanned ? 'text-info' : 'text-base-content/40'} tooltip`}
                              data-tip={user.isShadowBanned ? "Reveal User" : "Shadow Ban (Ghost Mode)"}
                              onClick={() => handleAction(toggleShadowBan, user, "Ghosting status updated")}
                              disabled={actionLoading === user._id}
                            >
                              <GhostIcon className="size-4" />
                            </button>

                            {/* Strike */}
                            <button
                              className="btn btn-ghost btn-xs text-error/60 hover:text-error tooltip"
                              data-tip="Issue Strike"
                              onClick={() => setConfirmAction({ type: "strike", user })}
                              disabled={actionLoading === user._id}
                            >
                              <AlertCircleIcon className="size-4" />
                            </button>

                            {/* Force Logout */}
                            <button
                              className="btn btn-ghost btn-xs text-info/60 hover:text-info tooltip"
                              data-tip="Force Global Logout"
                              onClick={() => handleAction(forceLogout, user, "User session terminated")}
                              disabled={actionLoading === user._id}
                            >
                              <LogOutIcon className="size-4" />
                            </button>

                            {/* Delete/Wipe */}
                            <button
                              className="btn btn-ghost btn-xs text-error/40 hover:text-error tooltip"
                              data-tip="Wipe User Data"
                              onClick={() => setConfirmAction({ type: "wipe", user })}
                              disabled={actionLoading === user._id}
                            >
                              <Trash2Icon className="size-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-primary px-2 opacity-50 select-none">SYSTEM ADMIN</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="bg-base-300/30 p-4 border-t border-base-300 flex items-center justify-center gap-4">
             <button
                className="btn btn-xs btn-ghost gap-1"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeftIcon className="size-3" /> Previous
              </button>
              <div className="flex items-center gap-1">
                 <span className="text-xs font-bold text-primary">{page}</span>
                 <span className="text-xs text-base-content/40">of {totalPages}</span>
              </div>
              <button
                className="btn btn-xs btn-ghost gap-1"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRightIcon className="size-3" />
              </button>
          </div>
        )}
      </div>

      {/* Modals Handling */}
      {confirmAction?.type === "strike" && (
        <ConfirmModal
          title={`Issue Strike: ${confirmAction.user.fullName}`}
          message={
            <div className="space-y-4">
              <p>Issuing a strike will increment the user's strike counter. <span className="text-error font-bold">At 3 strikes, the account is automatically banned.</span></p>
              <textarea
                className="textarea textarea-bordered w-full text-xs"
                placeholder="Specify the reason for this strike..."
                value={strikeValue}
                onChange={(e) => setStrikeValue(e.target.value)}
                rows={3}
              />
            </div>
          }
          confirmLabel="Apply Strike"
          confirmClass="btn-warning"
          loading={actionLoading === confirmAction.user._id}
          onConfirm={() => onApplyStrike(confirmAction.user)}
          onCancel={() => { setConfirmAction(null); setStrikeValue(""); }}
        />
      )}

      {confirmAction?.type === "wipe" && (
        <ConfirmModal
          title="Critical: Wipe User Data"
          message={`This action is irreversible. You are about to permanently WIPE all messages, moments, and profile data for "${confirmAction.user.fullName}". This bypasses the trash and destroys all associated records.`}
          confirmLabel="Destroy Data"
          confirmClass="btn-error"
          requireConfirmText={true}
          loading={actionLoading === confirmAction.user._id}
          onConfirm={() => handleAction(deleteUser, confirmAction.user, "User data eradicated")}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* USER DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 bg-base-300/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
           <div className="bg-base-200 border border-base-300 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              {/* Profile Header */}
              <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent flex items-end px-8 pb-4">
                 <button 
                   className="btn btn-ghost btn-sm btn-circle absolute top-6 right-6 bg-base-100/50 hover:bg-base-100"
                   onClick={() => setViewingUser(null)}
                 >
                    <XIcon className="size-4" />
                 </button>
                 
                 <div className="flex items-end gap-6 relative translate-y-8">
                    <div className="relative group">
                       <ProfileAvatar 
                         src={viewingUser.profilePic} 
                         name={viewingUser.fullName} 
                         size="w-24 h-24 sm:w-28 sm:h-28" 
                         className="border-4 border-base-200 shadow-xl"
                       />
                       {viewingUser.isOnline && (
                         <span className="absolute bottom-2 right-2 size-5 bg-success border-4 border-base-200 rounded-full" />
                       )}
                    </div>
                    <div className="pb-8 space-y-1">
                       <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-black tracking-tight">{viewingUser.fullName}</h3>
                          {viewingUser.isVerified && <ShieldCheckIcon className="size-5 text-info" />}
                       </div>
                       <p className="text-xs sm:text-sm font-medium opacity-50 flex items-center gap-1.5">
                          {viewingUser.email}
                          <button 
                            className="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100" 
                            onClick={() => {
                               navigator.clipboard.writeText(viewingUser.email);
                               toast.success("Email copied");
                            }}
                          >
                             <CopyIcon className="size-3" />
                          </button>
                       </p>
                    </div>
                 </div>
              </div>

              {/* Stats & Body */}
              <div className="pt-16 px-8 pb-8 overflow-y-auto space-y-8">
                 
                 {/* Intelligence Grid */}
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-base-300/30 p-4 rounded-3xl border border-base-300/50 text-center">
                       <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Role</p>
                       <p className={`text-xs font-black uppercase ${viewingUser.role === 'admin' ? 'text-primary' : 'text-base-content'}`}>{viewingUser.role}</p>
                    </div>
                    <div className="bg-base-300/30 p-4 rounded-3xl border border-base-300/50 text-center">
                       <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Strikes</p>
                       <p className={`text-xs font-black ${viewingUser.strikes > 0 ? 'text-error' : 'text-base-content'}`}>{viewingUser.strikes || 0}</p>
                    </div>
                    <div className="bg-base-300/30 p-4 rounded-3xl border border-base-300/50 text-center">
                       <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Score</p>
                       <p className="text-xs font-black text-info">{viewingUser.activityScore || 100}</p>
                    </div>
                    <div className="bg-base-300/30 p-4 rounded-3xl border border-base-300/50 text-center">
                       <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Status</p>
                       <p className={`text-xs font-black uppercase ${viewingUser.isBanned ? 'text-error' : 'text-success'}`}>{viewingUser.isBanned ? 'Banned' : 'Active'}</p>
                    </div>
                 </div>

                 {/* Information Sections */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] flex items-center gap-2">
                          <ActivityIcon className="size-3" /> Infrastructure & Geo
                       </h4>
                       <div className="space-y-3 bg-base-100/50 p-5 rounded-[2rem] border border-base-300">
                          <div className="flex items-center justify-between text-xs">
                             <span className="opacity-40 flex items-center gap-1.5"><HashIcon className="size-3" /> User GUID</span>
                             <span className="font-mono text-[10px] opacity-70 cursor-pointer hover:text-primary" onClick={() => {
                                navigator.clipboard.writeText(viewingUser._id);
                                toast.success("ID Copied");
                             }}>{viewingUser._id}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                             <span className="opacity-40 flex items-center gap-1.5"><MapPinIcon className="size-3" /> Last Geo</span>
                             <span className="font-bold">{viewingUser.security?.geoCountry || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                             <span className="opacity-40 flex items-center gap-1.5"><MonitorIcon className="size-3" /> Last Device</span>
                             <span className="font-bold truncate max-w-[120px]">{viewingUser.security?.lastDevice || 'Unknown'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] flex items-center gap-2">
                          <CalendarIcon className="size-3" /> Platform Lifecycle
                       </h4>
                       <div className="space-y-3 bg-base-100/50 p-5 rounded-[2rem] border border-base-300">
                          <div className="flex items-center justify-between text-xs">
                             <span className="opacity-40">Joined Zashly</span>
                             <span className="font-bold">{new Date(viewingUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                             <span className="opacity-40">Profile Maturity</span>
                             <span className="font-bold text-success">
                                {Math.floor((new Date() - new Date(viewingUser.createdAt)) / (1000 * 60 * 60 * 24))} Days
                             </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                             <span className="opacity-40">Privacy Tier</span>
                             <span className="badge badge-outline badge-xs font-bold uppercase">{viewingUser.subscription?.tier || 'Free'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Bio Section */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">User Bio & Narrative</h4>
                    <div className="bg-base-300/20 p-6 rounded-[2rem] border border-base-300 min-h-[100px] text-sm leading-relaxed italic opacity-80">
                       {viewingUser.bio || "This intelligence profile has not provided a biographical narrative yet."}
                    </div>
                 </div>
              </div>
              
              {/* Footer Actions if needed, but the main close is at the top */}
              <div className="p-8 pt-0 flex justify-end">
                 <button className="btn btn-primary rounded-2xl px-12 font-bold" onClick={() => setViewingUser(null)}>Acknowledge Profile</button>
              </div>
           </div>
           <div className="absolute inset-0 z-[-1]" onClick={() => setViewingUser(null)}></div>
        </div>
      )}
    </div>
  );
};

// Internal UsersIcon for local use if needed, but we imported it globally
const UsersIconLocal = UsersIcon;

export default UsersView;
