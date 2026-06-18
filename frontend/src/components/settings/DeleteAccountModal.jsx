import { useState } from "react";
import {
  AlertTriangleIcon,
  DownloadIcon,
  XIcon,
  Trash2Icon,
  ShieldAlertIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  DELETION_CONFIRM_PHRASE,
  downloadMyDataExport,
  submitAccountDeletionRequest,
} from "../../lib/api";

const DeleteAccountModal = ({ open, onClose, authUser, onSubmitted }) => {
  const [step, setStep] = useState(0);
  const [dataDownloaded, setDataDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [finalConfirm, setFinalConfirm] = useState("");

  if (!open) return null;

  const resetAndClose = () => {
    setStep(0);
    setDataDownloaded(false);
    setConfirmEmail("");
    setConfirmPhrase("");
    setPassword("");
    setReason("");
    setUnderstood(false);
    setFinalConfirm("");
    onClose();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadMyDataExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zashly-data-export-${authUser?._id || "account"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDataDownloaded(true);
      toast.success("Data export downloaded");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to download your data"
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async () => {
    if (finalConfirm.trim() !== "PERMANENTLY DELETE") {
      toast.error('Type "PERMANENTLY DELETE" to confirm');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitAccountDeletionRequest({
        password,
        confirmPhrase: confirmPhrase.trim(),
        confirmEmail: confirmEmail.trim(),
        reason: reason.trim(),
        dataDownloaded: true,
      });
      toast.success(result.message || "Deletion request submitted");
      onSubmitted?.();
      resetAndClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit deletion request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const emailMatches =
    confirmEmail.trim().toLowerCase() === authUser?.email?.trim().toLowerCase();
  const phraseMatches = confirmPhrase.trim() === DELETION_CONFIRM_PHRASE;
  const canContinueDownload = dataDownloaded;
  const canContinueConfirm =
    understood && emailMatches && phraseMatches && password.length >= 1;

  return (
    <dialog className="modal modal-open" aria-labelledby="delete-account-title">
      <div className="modal-box max-w-lg w-[calc(100%-2rem)]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-error">
            <Trash2Icon className="size-6 shrink-0" />
            <h3 id="delete-account-title" className="font-bold text-lg">
              Delete account permanently
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={resetAndClose}
            aria-label="Close"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="flex gap-1 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-error" : "bg-base-300"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="alert alert-warning text-sm">
              <AlertTriangleIcon className="size-5 shrink-0" />
              <span>
                This starts a permanent deletion process. Your account stays active until an
                administrator reviews and approves the request.
              </span>
            </div>
            <ul className="text-sm space-y-2 list-disc pl-5 opacity-80">
              <li>All messages, moments, friends, and groups will be erased</li>
              <li>You cannot undo deletion after admin approval</li>
              <li>Download your data on the next step before submitting</li>
              <li>Admin accounts cannot use self-service deletion</li>
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm opacity-80">
              Download a JSON copy of your profile, messages, moments, calls, and related
              data. You must complete this step before submitting your request.
            </p>
            <button
              type="button"
              className="btn btn-outline w-full gap-2"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
              {dataDownloaded ? "Download again" : "Download my data"}
            </button>
            {dataDownloaded && (
              <p className="text-xs text-success font-medium flex items-center gap-1">
                <ShieldAlertIcon className="size-3" /> Export downloaded — you may continue
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="form-control w-full">
              <span className="label-text font-medium">Confirm your email</span>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder={authUser?.email}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text font-medium">
                Type <span className="font-mono text-error">{DELETION_CONFIRM_PHRASE}</span>
              </span>
              <input
                type="text"
                className="input input-bordered w-full font-mono"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text font-medium">Current password</span>
              <input
                type="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text font-medium">Reason (optional)</span>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-error mt-0.5"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
              />
              <span className="text-sm opacity-80">
                I understand that after admin approval, my account and all data will be
                permanently deleted and cannot be recovered.
              </span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="alert alert-error text-sm">
              <AlertTriangleIcon className="size-5 shrink-0" />
              <span>Last step — submit your request to administrators.</span>
            </div>
            <label className="form-control w-full">
              <span className="label-text font-medium">
                Type <span className="font-mono">PERMANENTLY DELETE</span> to submit
              </span>
              <input
                type="text"
                className="input input-bordered w-full font-mono"
                value={finalConfirm}
                onChange={(e) => setFinalConfirm(e.target.value)}
                autoComplete="off"
              />
            </label>
          </div>
        )}

        <div className="modal-action flex-col sm:flex-row gap-2 mt-6">
          {step > 0 && (
            <button
              type="button"
              className="btn btn-ghost w-full sm:w-auto"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="btn btn-error w-full sm:w-auto"
              disabled={
                (step === 1 && !canContinueDownload) ||
                (step === 2 && !canContinueConfirm)
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-error w-full sm:w-auto"
              disabled={
                submitting || finalConfirm.trim() !== "PERMANENTLY DELETE"
              }
              onClick={handleSubmit}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Submit deletion request"
              )}
            </button>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/50">
        <button type="button" onClick={resetAndClose}>
          close
        </button>
      </form>
    </dialog>
  );
};

export default DeleteAccountModal;
