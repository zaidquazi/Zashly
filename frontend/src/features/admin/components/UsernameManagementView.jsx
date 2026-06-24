import { useState } from "react";
import { SearchIcon, TagIcon, PlusIcon, LockIcon, ShieldBanIcon } from "lucide-react";

const UsernameManagementView = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-bold tracking-tight">Username Management</h2>
          <p className="text-base-content/70">
            Reserve, release, protect, and track username ownership history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary">
            <PlusIcon className="size-4" />
            Reserve Username
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search usernames or user IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-10 focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50">
              <tr>
                <th>Username</th>
                <th>Status</th>
                <th>Reserved By</th>
                <th>Last Changed</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty State for now */}
              <tr>
                <td colSpan={5} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="size-12 bg-base-200 rounded-full flex items-center justify-center mb-3">
                      <TagIcon className="size-6 text-base-content/40" />
                    </div>
                    <h3 className="font-semibold mb-1">No usernames found</h3>
                    <p className="text-sm text-base-content/60 max-w-sm">
                      Get started by reserving premium usernames or search above to manage existing ones.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsernameManagementView;
