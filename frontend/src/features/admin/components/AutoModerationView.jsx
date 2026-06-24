import { useState, useEffect } from "react";
import {
  ShieldAlertIcon, PlusIcon, TrashIcon, ToggleLeftIcon, ToggleRightIcon,
  SearchIcon, FilterIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const SEVERITY_COLORS = {
  low: "badge-info",
  medium: "badge-warning",
  high: "badge-error",
};

const ACTION_LABELS = {
  censor: "Censor (replace with ***)",
  block: "Block (drop message)",
  strike: "Strike (block + auto-strike user)",
};

const AutoModerationView = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New word form
  const [newWord, setNewWord] = useState("");
  const [newSeverity, setNewSeverity] = useState("medium");
  const [newAction, setNewAction] = useState("censor");
  const [adding, setAdding] = useState(false);

  const fetchWords = async () => {
    try {
      const res = await axiosInstance.get("/admin/banned-words");
      setWords(res.data);
    } catch {
      toast.error("Failed to load banned words");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    setAdding(true);
    try {
      const res = await axiosInstance.post("/admin/banned-words", {
        word: newWord,
        severity: newSeverity,
        action: newAction,
      });
      setWords((prev) => [res.data, ...prev]);
      setNewWord("");
      toast.success(`"${newWord}" added to blacklist`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add word");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id, currentActive) => {
    try {
      const res = await axiosInstance.patch(`/admin/banned-words/${id}`, {
        isActive: !currentActive,
      });
      setWords((prev) => prev.map((w) => (w._id === id ? res.data : w)));
      toast.success(`Word ${!currentActive ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id, word) => {
    if (!confirm(`Remove "${word}" from blacklist?`)) return;
    try {
      await axiosInstance.delete(`/admin/banned-words/${id}`);
      setWords((prev) => prev.filter((w) => w._id !== id));
      toast.success(`"${word}" removed`);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-base-300 pb-4">
        <div className="p-2 bg-error/10 rounded-xl text-error">
          <ShieldAlertIcon className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Auto-Moderation</h2>
          <p className="text-base-content/60 text-sm">
            Manage keyword blacklist. Messages matching these words are automatically censored, blocked, or struck.
          </p>
        </div>
      </div>

      {/* Add word form */}
      <div className="card bg-base-200/50 border border-base-300">
        <div className="card-body">
          <h3 className="font-bold text-sm uppercase tracking-wider text-base-content/50 mb-3">Add New Word / Phrase</h3>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="form-control flex-1">
              <label className="label py-1">
                <span className="label-text text-xs font-medium">Word / Phrase</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="e.g. spam link"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium">Severity</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium">Action</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
              >
                <option value="censor">Censor</option>
                <option value="block">Block</option>
                <option value="strike">Strike</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={adding || !newWord.trim()}
            >
              {adding ? <span className="loading loading-spinner loading-xs" /> : <PlusIcon className="size-4" />}
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2 border border-base-300 w-full sm:w-auto">
          <SearchIcon className="size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search blacklist..."
            className="bg-transparent border-none outline-none text-sm flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 text-xs text-base-content/50">
          <span className="badge badge-ghost">{words.length} total</span>
          <span className="badge badge-success badge-outline">{words.filter(w => w.isActive).length} active</span>
          <span className="badge badge-ghost badge-outline">{words.filter(w => !w.isActive).length} disabled</span>
        </div>
      </div>

      {/* Words list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <FilterIcon className="size-12 mx-auto mb-3 opacity-20" />
          <p>{search ? "No matches found" : "No banned words yet. Add one above."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase">
                <th>Word / Phrase</th>
                <th>Severity</th>
                <th>Action</th>
                <th>Status</th>
                <th>Added By</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry._id} className={`hover ${!entry.isActive ? "opacity-40" : ""}`}>
                  <td className="font-mono font-bold text-sm">{entry.word}</td>
                  <td>
                    <span className={`badge badge-sm ${SEVERITY_COLORS[entry.severity]}`}>
                      {entry.severity}
                    </span>
                  </td>
                  <td className="text-xs text-base-content/70">
                    {ACTION_LABELS[entry.action]?.split(" (")[0]}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(entry._id, entry.isActive)}
                      className="btn btn-ghost btn-xs"
                      title={entry.isActive ? "Disable" : "Enable"}
                    >
                      {entry.isActive ? (
                        <ToggleRightIcon className="size-5 text-success" />
                      ) : (
                        <ToggleLeftIcon className="size-5 text-base-content/30" />
                      )}
                    </button>
                  </td>
                  <td className="text-xs text-base-content/50">
                    {entry.addedBy?.fullName || "System"}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(entry._id, entry.word)}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      <TrashIcon className="size-4" />
                    </button>
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

export default AutoModerationView;
