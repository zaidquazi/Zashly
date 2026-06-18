import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { addGroupMembers, removeGroupMember, updateGroup } from "../lib/groupApi";
import {
  XIcon,
  ShieldIcon,
  UserMinusIcon,
  UserPlusIcon,
  LogOutIcon,
  SearchIcon,
  Loader2Icon,
  PencilIcon,
  CheckIcon,
  CameraIcon,
  ImageIcon,
  TrashIcon,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import ProfileAvatar from "./ProfileAvatar";
import imageCompression from "browser-image-compression";

/**
 * Slide-out panel for group info and management.
 * Shows member list, add/remove members (admin), leave group.
 * Admin can edit group name, description, and avatar.
 */
const GroupInfoPanel = ({ isOpen, onClose, group, onGroupUpdated }) => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState(new Set());
  const [addMemberSearch, setAddMemberSearch] = useState("");

  // ── Admin edit states ──────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isAdmin = group?.admin?._id === authUser?._id;

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: showAddMembers,
  });

  // Friends not already in the group
  const availableFriends = useMemo(() => {
    if (!group) return [];
    const memberIds = new Set(group.members.map((m) => m._id));
    return friends.filter((f) => !memberIds.has(f._id || f.id));
  }, [friends, group]);

  const filteredAvailableFriends = useMemo(() => {
    if (!addMemberSearch.trim()) return availableFriends;
    const term = addMemberSearch.toLowerCase();
    return availableFriends.filter((f) =>
      (f.fullName || "").toLowerCase().includes(term)
    );
  }, [availableFriends, addMemberSearch]);

  // ── Add members mutation ──────────────────────────────────
  const { mutate: doAddMembers, isPending: addingMembers } = useMutation({
    mutationFn: () => addGroupMembers(group._id, Array.from(selectedNewMembers)),
    onSuccess: (updatedGroup) => {
      toast.success("Members added!");
      setShowAddMembers(false);
      setSelectedNewMembers(new Set());
      setAddMemberSearch("");
      onGroupUpdated?.(updatedGroup);
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to add members");
    },
  });

  // ── Remove member mutation ────────────────────────────────
  const { mutate: doRemoveMember, isPending: removingMember } = useMutation({
    mutationFn: (userId) => removeGroupMember(group._id, userId),
    onSuccess: (_, userId) => {
      toast.success("Member removed");
      onGroupUpdated?.();
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    },
  });

  // ── Leave group ───────────────────────────────────────────
  const { mutate: doLeaveGroup, isPending: leaving } = useMutation({
    mutationFn: () => removeGroupMember(group._id, authUser._id),
    onSuccess: () => {
      toast.success("You left the group");
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      navigate("/app");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to leave group");
    },
  });

  // ── Update group (generic) ────────────────────────────────
  const { mutate: doUpdateGroup, isPending: updatingGroup } = useMutation({
    mutationFn: (data) => updateGroup(group._id, data),
    onSuccess: (updatedGroup, variables) => {
      if (variables.name !== undefined) {
        toast.success("Group name updated!");
        setEditingName(false);
      }
      if (variables.description !== undefined) {
        toast.success("Description updated!");
        setEditingDescription(false);
      }
      if (variables.avatar !== undefined) {
        toast.success(variables.avatar ? "Group photo updated!" : "Group photo removed!");
        setUploadingAvatar(false);
      }
      onGroupUpdated?.(updatedGroup);
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update group");
      setUploadingAvatar(false);
    },
  });

  // ── Handle avatar upload ──────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      toast.error("Please select an image smaller than 7MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();

      reader.onloadend = () => {
        doUpdateGroup({ avatar: reader.result });
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to process image.");
      setUploadingAvatar(false);
    }
  };

  // ── Remove avatar ─────────────────────────────────────────
  const handleRemoveAvatar = () => {
    if (window.confirm("Remove group photo?")) {
      doUpdateGroup({ avatar: "" });
    }
  };

  const handleRemoveMember = (userId, userName) => {
    if (window.confirm(`Remove ${userName} from the group?`)) {
      doRemoveMember(userId);
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      doLeaveGroup();
    }
  };

  if (!isOpen || !group) return null;

  const getInitials = (name) =>
    name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-base-100 h-full overflow-y-auto shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold">Group Info</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Group Avatar & Name */}
          <div className="text-center">
            {/* ── Group Avatar with edit overlay (admin) ──── */}
            <div className="relative inline-block mx-auto mb-3 group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center overflow-hidden">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {getInitials(group.name)}
                  </span>
                )}
              </div>

              {/* Admin avatar edit overlay */}
              {isAdmin && (
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {uploadingAvatar ? (
                    <Loader2Icon className="size-5 text-white animate-spin" />
                  ) : (
                    <>
                      <label className="cursor-pointer p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors" title="Upload photo">
                        <CameraIcon className="size-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                      {group.avatar && (
                        <button
                          className="p-1.5 rounded-full bg-white/20 hover:bg-error/80 transition-colors"
                          onClick={handleRemoveAvatar}
                          title="Remove photo"
                        >
                          <TrashIcon className="size-4 text-white" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Group Name (editable for admin) ──── */}
            {editingName ? (
              <div className="flex items-center gap-2 justify-center">
                <input
                  type="text"
                  className="input input-bordered input-sm w-48"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                <button
                  className="btn btn-primary btn-sm btn-circle"
                  disabled={
                    !newName.trim() || newName.trim() === group.name || updatingGroup
                  }
                  onClick={() => doUpdateGroup({ name: newName.trim() })}
                >
                  {updatingGroup ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <CheckIcon className="size-3" />
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => setEditingName(false)}
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold">{group.name}</h2>
                {isAdmin && (
                  <button
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => {
                      setNewName(group.name);
                      setEditingName(true);
                    }}
                  >
                    <PencilIcon className="size-3" />
                  </button>
                )}
              </div>
            )}

            {/* ── Description (editable for admin) ──── */}
            {editingDescription ? (
              <div className="mt-2 space-y-2">
                <textarea
                  className="textarea textarea-bordered w-full text-sm resize-none"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="Add group description..."
                  autoFocus
                />
                <div className="flex items-center justify-center gap-2">
                  <button
                    className="btn btn-primary btn-xs"
                    disabled={updatingGroup}
                    onClick={() => doUpdateGroup({ description: newDescription.trim() })}
                  >
                    {updatingGroup ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      <>
                        <CheckIcon className="size-3" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setEditingDescription(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                {group.description ? (
                  <div className="flex items-start justify-center gap-1">
                    <p className="text-sm opacity-70">{group.description}</p>
                    {isAdmin && (
                      <button
                        className="btn btn-ghost btn-xs btn-circle shrink-0"
                        onClick={() => {
                          setNewDescription(group.description || "");
                          setEditingDescription(true);
                        }}
                      >
                        <PencilIcon className="size-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  isAdmin && (
                    <button
                      className="btn btn-ghost btn-xs opacity-60 gap-1"
                      onClick={() => {
                        setNewDescription("");
                        setEditingDescription(true);
                      }}
                    >
                      <PencilIcon className="size-3" />
                      Add description
                    </button>
                  )
                )}
              </div>
            )}

            <p className="text-xs opacity-50 mt-1">
              {group.members.length} member{group.members.length !== 1 ? "s" : ""} • Created{" "}
              {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Members</h4>
              {isAdmin && (
                <button
                  className="btn btn-ghost btn-xs gap-1"
                  onClick={() => setShowAddMembers(!showAddMembers)}
                >
                  <UserPlusIcon className="size-3" />
                  Add
                </button>
              )}
            </div>

            {/* Add members section */}
            {showAddMembers && (
              <div className="mb-4 p-3 bg-base-200 rounded-lg space-y-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3 opacity-50" />
                  <input
                    type="text"
                    className="input input-bordered w-full pl-8 input-xs"
                    placeholder="Search friends..."
                    value={addMemberSearch}
                    onChange={(e) => setAddMemberSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredAvailableFriends.length === 0 ? (
                    <p className="text-xs text-center opacity-60 py-2">
                      No friends available to add
                    </p>
                  ) : (
                    filteredAvailableFriends.map((f) => {
                      const id = f._id || f.id;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-base-300"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-xs"
                            checked={selectedNewMembers.has(id)}
                            onChange={() => {
                              setSelectedNewMembers((prev) => {
                                const next = new Set(prev);
                                if (next.has(id)) next.delete(id);
                                else next.add(id);
                                return next;
                              });
                            }}
                          />
                          <ProfileAvatar src={f.profilePic} name={f.fullName} size="w-6 h-6" textSize="text-xs" />
                          <span className="text-xs truncate">{f.fullName}</span>
                        </label>
                      );
                    })
                  )}
                </div>

                {selectedNewMembers.size > 0 && (
                  <button
                    className="btn btn-primary btn-xs w-full"
                    onClick={() => doAddMembers()}
                    disabled={addingMembers}
                  >
                    {addingMembers ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      `Add ${selectedNewMembers.size} member${selectedNewMembers.size > 1 ? "s" : ""}`
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Member list */}
            <div className="space-y-1">
              {group.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors"
                >
                  <ProfileAvatar src={member.profilePic} name={member.fullName} size="w-9 h-9" textSize="text-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.fullName}
                      {member._id === authUser?._id && (
                        <span className="text-xs opacity-50 ml-1">(You)</span>
                      )}
                    </p>
                  </div>
                  {member._id === group.admin?._id && (
                    <span className="badge badge-warning badge-xs gap-1">
                      <ShieldIcon className="size-2.5" />
                      Admin
                    </span>
                  )}
                  {isAdmin && member._id !== authUser?._id && (
                    <button
                      className="btn btn-ghost btn-xs btn-circle text-error"
                      onClick={() => handleRemoveMember(member._id, member.fullName)}
                      disabled={removingMember}
                    >
                      <UserMinusIcon className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leave Group */}
          <div className="border-t border-base-300 pt-4">
            <button
              className="btn btn-error btn-outline w-full gap-2"
              onClick={handleLeaveGroup}
              disabled={leaving}
            >
              {leaving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <LogOutIcon className="size-4" />
              )}
              Leave Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
