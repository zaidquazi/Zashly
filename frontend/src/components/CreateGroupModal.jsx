import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { createGroup } from "../lib/groupApi";
import { XIcon, SearchIcon, UsersIcon, Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "./ProfileAvatar";

/**
 * Modal for creating a new group chat.
 * Shows the user's friend list with checkboxes for member selection.
 */
const CreateGroupModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: isOpen,
  });

  const filteredFriends = useMemo(() => {
    if (!searchTerm.trim()) return friends;
    const term = searchTerm.toLowerCase();
    return friends.filter((f) =>
      (f.fullName || f.username || "").toLowerCase().includes(term)
    );
  }, [friends, searchTerm]);

  const toggleMember = (userId) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const { mutate: handleCreate, isPending: creating } = useMutation({
    mutationFn: () =>
      createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        memberIds: Array.from(selectedMembers),
      }),
    onSuccess: () => {
      toast.success("Group created successfully!");
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      resetAndClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create group");
    },
  });

  const resetAndClose = () => {
    setGroupName("");
    setGroupDescription("");
    setSelectedMembers(new Set());
    setSearchTerm("");
    onClose();
  };

  const canCreate = groupName.trim().length >= 2 && selectedMembers.size >= 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            <h3 className="text-lg font-bold">Create Group</h3>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={resetAndClose}
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Group Name */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Group Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Description</span>
              <span className="label-text-alt opacity-60">Optional</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full resize-none"
              placeholder="What's this group about?"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              maxLength={200}
              rows={2}
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="label">
              <span className="label-text font-medium">
                Add Members *{" "}
                {selectedMembers.size > 0 && (
                  <span className="badge badge-primary badge-sm ml-1">
                    {selectedMembers.size}
                  </span>
                )}
              </span>
            </label>

            {/* Search friends */}
            <div className="relative mb-3">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
              <input
                type="text"
                className="input input-bordered w-full pl-10 input-sm"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Friend list */}
            <div className="max-h-52 overflow-y-auto rounded-lg border border-base-300">
              {loadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <span className="loading loading-spinner loading-sm" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-6 text-sm opacity-60">
                  {friends.length === 0
                    ? "No friends yet. Add friends first!"
                    : "No friends match your search."}
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const id = friend._id || friend.id;
                  const isSelected = selectedMembers.has(id);

                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-base-200 ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={isSelected}
                        onChange={() => toggleMember(id)}
                      />
                      <ProfileAvatar src={friend.profilePic} name={friend.fullName} size="w-9 h-9" textSize="text-sm" />
                      <span className="text-sm font-medium truncate">
                        {friend.fullName}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-base-300">
          <button
            className="btn btn-primary w-full"
            disabled={!canCreate || creating}
            onClick={() => handleCreate()}
          >
            {creating ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UsersIcon className="size-4" />
                Create Group ({selectedMembers.size} member{selectedMembers.size !== 1 ? "s" : ""})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
