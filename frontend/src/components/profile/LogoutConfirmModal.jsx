import { useEffect, useRef } from "react";
import { LogOutIcon } from "lucide-react";

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, isPending }) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    cancelRef.current?.focus();

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={() => !isPending && onClose()}
        disabled={isPending}
      />

      <div className="relative bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center border border-base-300 animate-in fade-in zoom-in-95 duration-200">
        <div
          className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4"
          aria-hidden="true"
        >
          <LogOutIcon className="size-8" />
        </div>
        <h2 id="logout-dialog-title" className="text-xl font-bold mb-2">
          Log out of Zashly?
        </h2>
        <p id="logout-dialog-desc" className="text-sm text-base-content/60 mb-6 leading-relaxed">
          You will need to sign in again to access your messages and calls.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn btn-error text-error-content w-full"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                Signing out…
              </>
            ) : (
              "Yes, log out"
            )}
          </button>
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-ghost w-full"
            onClick={onClose}
            disabled={isPending}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
