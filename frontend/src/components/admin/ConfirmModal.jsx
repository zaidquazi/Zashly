import { useState } from "react";
import { XIcon, AlertTriangleIcon } from "lucide-react";

const ConfirmModal = ({
  title,
  message,
  confirmLabel = "Confirm",
  confirmClass = "btn-error",
  requireConfirmText = false,
  loading,
  onConfirm,
  onCancel,
}) => {
  const [confirmInput, setConfirmInput] = useState("");

  const isConfirmDisabled = loading || (requireConfirmText && confirmInput !== "CONFIRM");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-base-200 border border-base-300 rounded-[2rem] shadow-2xl p-6 sm:p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
        <button
          className="btn btn-ghost btn-sm btn-circle absolute top-4 right-4"
          onClick={onCancel}
          disabled={loading}
        >
          <XIcon className="size-4 opacity-50" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-warning">
          <AlertTriangleIcon className="size-6 shrink-0" />
          <h3 className="text-xl font-bold text-base-content">{title}</h3>
        </div>

        <p className="text-sm text-base-content/70 mb-6 leading-relaxed">
          {message}
        </p>

        {requireConfirmText && (
          <div className="mb-6">
            <label className="label text-[10px] font-bold uppercase text-base-content/40 mb-1">
              Type <span className="text-error">CONFIRM</span> to proceed
            </label>
            <input
              type="text"
              placeholder="CONFIRM"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="input input-bordered input-sm w-full font-mono text-center tracking-widest focus:border-error"
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button className="btn btn-sm btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn btn-sm ${confirmClass} px-6 min-w-[100px]`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
