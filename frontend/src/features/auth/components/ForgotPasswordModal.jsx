import { useState } from "react";
import { XIcon, KeyRoundIcon, MailIcon, EyeIcon, EyeOffIcon, CheckCircle2Icon, ClockIcon, XCircleIcon, AlertTriangleIcon } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [step, setStep] = useState("username"); // username -> status-check -> reset
  const [loading, setLoading] = useState(false);
  const [requestInfo, setRequestInfo] = useState(null); // stores request object from backend
  const [message, setMessage] = useState("");

  // Reset fields
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  if (!isOpen) return null;

  const handleSubmitAppeal = async (e, isCheck = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!username.trim()) return toast.error("Please enter your username");

    const checking = isCheck === true || e === true;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/forgot-password-request", { 
        username,
        isCheck: checking
      });
      const { request, message: msg } = res.data;
      
      if (!request) {
        throw new Error(msg || "No details returned from server");
      }
      
      setRequestInfo(request);
      setMessage(msg);

      if (request.status === "approved") {
        setResetToken(request.resetToken || "");
        setStep("reset");
      } else {
        setStep("status-check");
      }
      toast.success(msg || "Request processed");
    } catch (error) {
      console.error("Forgot password request error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to submit appeal");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim()) return toast.error("Reset token is required");
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) return toast.error("Password must include uppercase, lowercase, and a number");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/reset-password", {
        username,
        resetToken,
        newPassword,
      });
      toast.success(res.data?.message || "Password reset successfully! You can now log in.");
      // Reset state and close modal
      setUsername("");
      setRequestInfo(null);
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("username");
      onClose();
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error.response?.data?.errors?.[0] || error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-base-content/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-base-100 rounded-2xl shadow-2xl border border-primary/20 p-6 sm:p-8 overflow-hidden animate-in zoom-in-95 duration-200 z-10 text-base-content">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 size-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
        >
          <XIcon className="size-5" />
        </button>

        {/* STEP 1: Enter username to appeal */}
        {step === "username" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mb-4">
                <KeyRoundIcon className="size-6" />
              </div>
              <h3 className="text-xl font-bold">Forgot Password?</h3>
              <p className="text-sm opacity-70 mt-1.5">
                Submit an appeal to Zashly admins. Once approved, you can reset your password immediately.
              </p>
            </div>

            <form onSubmit={(e) => handleSubmitAppeal(e, false)} className="space-y-4">
              <div className="form-control space-y-2">
                <label className="label">
                  <span className="label-text font-medium">Your Username</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Username"
                    className="input input-bordered w-full pl-10 focus:input-primary transition-all text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <KeyRoundIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 opacity-50" />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Submitting Appeal...
                  </>
                ) : (
                  "Submit Reset Appeal"
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Appeal submitted / check status */}
        {step === "status-check" && requestInfo && (
          <div className="space-y-6 text-center">
            {requestInfo.status === "pending" && (
              <div className="space-y-4">
                <div className="mx-auto flex items-center justify-center size-16 rounded-full bg-warning/15 text-warning animate-pulse">
                  <ClockIcon className="size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Appeal Pending Approval</h3>
                  <p className="text-sm opacity-70 mt-2 px-2 leading-relaxed">
                    {message || "Your password reset request has been sent to our administrator account for approval. Please check back shortly."}
                  </p>
                </div>
              </div>
            )}

            {requestInfo.status === "rejected" && (
              <div className="space-y-4">
                <div className="mx-auto flex items-center justify-center size-16 rounded-full bg-error/15 text-error">
                  <XCircleIcon className="size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Appeal Rejected</h3>
                  <p className="text-sm opacity-70 mt-2 px-2 leading-relaxed">
                    {message || "Unfortunately, your password reset appeal was rejected by the administrator. Contact support if you believe this was an error."}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-base-200 rounded-xl p-4 text-left border border-base-300 space-y-2">
              <div className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Appeal Details</div>
              <div className="text-sm">
                <span className="font-semibold text-base-content/75">Username:</span> {username}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-base-content/75">Submitted:</span> {new Date(requestInfo.createdAt).toLocaleString()}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-base-content/75">Status:</span>{" "}
                <span className={`capitalize font-bold ${requestInfo.status === 'rejected' ? 'text-error' : 'text-warning'}`}>
                  {requestInfo.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep("username")}
                className="btn btn-ghost border border-base-300 flex-1 btn-sm font-semibold"
              >
                Back
              </button>
              <button 
                onClick={(e) => handleSubmitAppeal(e, true)}
                className="btn btn-primary flex-1 btn-sm font-semibold gap-1.5"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>Check Status Again</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Approved / Reset Password */}
        {step === "reset" && requestInfo && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center size-12 rounded-xl bg-success/10 text-success mb-4 animate-bounce">
                <CheckCircle2Icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold">Appeal Approved!</h3>
              <p className="text-sm opacity-70 mt-1.5">
                Admin approved your appeal. Enter your new password below to complete the reset.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="form-control space-y-1">
                <label className="label">
                  <span className="label-text text-xs font-bold text-base-content/60 uppercase">Reset Token (Autofilled)</span>
                </label>
                <input
                  type="text"
                  placeholder="Paste your reset token here if not autofilled"
                  className="input input-bordered font-mono text-xs w-full focus:input-primary transition-all"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>

              <div className="form-control space-y-1">
                <label className="label">
                  <span className="label-text text-xs font-bold text-base-content/60 uppercase">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="At least 8 characters, 1 uppercase, 1 number"
                    className="input input-bordered w-full pr-10 text-sm focus:input-primary transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOffIcon className="size-4 opacity-50" /> : <EyeIcon className="size-4 opacity-50" />}
                  </button>
                </div>
              </div>

              <div className="form-control space-y-1">
                <label className="label">
                  <span className="label-text text-xs font-bold text-base-content/60 uppercase">Confirm Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  className="input input-bordered w-full text-sm focus:input-primary transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setStep("username")}
                  className="btn btn-ghost border border-base-300 flex-1 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success flex-1 text-success-content font-bold shadow-lg shadow-success/15"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Saving...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
