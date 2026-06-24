import { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  ArrowRight,
  Lock,
  Shield,
  Zap,
  Globe,
  Rocket,
  MessageSquare,
  AlertCircle,
  User,
  Loader2
} from "lucide-react";
import Logo from "../components/Logo";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import useLogin from "../hooks/useLogin";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";
import AuthLegalFooter from "../components/layout/AuthLegalFooter";
import OptimizedImage from "../components/ui/OptimizedImage";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [shakeCheckbox, setShakeCheckbox] = useState(false);

  // Focus states for input animations
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginData.identifier.trim() || !loginData.password.trim()) return;

    if (!loginData.rememberMe) {
      setShakeCheckbox(true);
      setTimeout(() => setShakeCheckbox(false), 500);
      return;
    }
    
    // Pass rememberMe if the backend supports it, otherwise it handles the standard login.
    loginMutation({
      username: loginData.identifier,
      password: loginData.password,
      rememberMe: loginData.rememberMe
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-base-200 to-base-300 relative overflow-hidden font-sans"
      data-theme="light"
    >
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-4xl flex-1 flex items-center justify-center z-10 py-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col lg:flex-row bg-base-100/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
        >

          {/* LEFT: LOGIN FORM SECTION */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center relative z-10">
            {/* Header / Logo */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 text-center lg:text-left flex flex-col items-center lg:items-start"
            >
              <div className="mb-6 flex items-center justify-center lg:justify-start gap-2">
                <Logo className="size-8 text-primary drop-shadow-md animate-spin-slow" />
                <span className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-secondary">
                  Zashly
                </span>
              </div>
              <h1 className="text-2xl font-semibold mb-1">Welcome Back</h1>
              <p className="opacity-60 text-sm">Enter your credentials to access your account.</p>
            </motion.div>

            {/* ERROR MESSAGE DISPLAY */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="alert alert-error rounded-xl shadow-lg border border-error/20 bg-error/10 text-error text-sm p-3 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{error?.response?.data?.message ?? "Invalid username or password. Please try again."}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* IDENTIFIER FIELD */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold opacity-70 uppercase tracking-wider pl-1">
                  Username or Email
                </label>
                <div className={`relative flex items-center bg-base-200/50 border transition-all duration-300 rounded-xl overflow-hidden shadow-inner
                  ${isIdentifierFocused ? 'border-primary/50 shadow-[0_0_0_4px_rgba(var(--p),0.1)] bg-base-100' : 'border-white/10 hover:border-white/20'}
                  ${error ? '!border-error/50 bg-error/5' : ''}
                `}>
                  <div className="pl-3 pr-2 opacity-40">
                    <User className="size-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your username or email"
                    className="w-full bg-transparent outline-none py-3 pr-4 text-sm placeholder:opacity-40 disabled:opacity-50"
                    value={loginData.identifier}
                    onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                    onFocus={() => setIsIdentifierFocused(true)}
                    onBlur={() => setIsIdentifierFocused(false)}
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold opacity-70 uppercase tracking-wider pl-1">
                  Password
                </label>
                <div className={`relative flex items-center bg-base-200/50 border transition-all duration-300 rounded-xl overflow-hidden shadow-inner
                  ${isPasswordFocused ? 'border-primary/50 shadow-[0_0_0_4px_rgba(var(--p),0.1)] bg-base-100' : 'border-white/10 hover:border-white/20'}
                  ${error ? '!border-error/50 bg-error/5' : ''}
                `}>
                  <div className="pl-3 pr-2 opacity-40">
                    <Lock className="size-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full bg-transparent outline-none py-3 pr-10 text-sm placeholder:opacity-40 disabled:opacity-50"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    disabled={isPending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 opacity-40 hover:text-primary transition-colors outline-none disabled:opacity-20"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                
                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <motion.label 
                    animate={shakeCheckbox ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className={`appearance-none size-4 border-[1.5px] rounded transition-all peer disabled:opacity-50 disabled:cursor-not-allowed
                          ${shakeCheckbox ? 'border-error bg-error/10' : 'border-base-300 bg-base-100 checked:bg-primary checked:border-primary'}
                        `} 
                        checked={loginData.rememberMe}
                        onChange={(e) => {
                          setLoginData({...loginData, rememberMe: e.target.checked});
                          if (e.target.checked) setShakeCheckbox(false);
                        }}
                        disabled={isPending}
                      />
                      <svg className={`size-3 absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none ${shakeCheckbox ? 'text-error' : 'text-primary-content'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className={`text-[11px] font-medium transition-all ${isPending ? 'opacity-40' : (shakeCheckbox ? 'opacity-100 text-error' : 'opacity-70 group-hover:opacity-100')}`}>
                      Keep me signed in
                    </span>
                  </motion.label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-primary font-medium hover:underline transition-all disabled:opacity-50 disabled:no-underline"
                    disabled={isPending}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button 
                type="submit" 
                className={`w-full rounded-xl py-3 mt-2 text-sm font-medium shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group
                  ${isPending || !loginData.identifier || !loginData.password 
                    ? 'btn-disabled opacity-50 cursor-not-allowed' 
                    : 'btn btn-primary min-h-0 h-auto'
                  }
                `}
                disabled={isPending || !loginData.identifier || !loginData.password}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Security Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-6 flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-50 uppercase tracking-wider bg-base-200/50 px-3 py-1.5 rounded-full border border-white/5">
                <Lock className="size-3" />
                Secured with End-to-End Encryption
              </div>
            </motion.div>

            {/* Sign Up Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center lg:text-left"
            >
              <p className="text-xs opacity-60">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary font-medium hover:underline transition-all">
                  Create one
                </Link>
              </p>
            </motion.div>
          </div>

          {/* RIGHT: IMAGE SECTION */}
          <div className="hidden lg:flex w-full lg:w-1/2 relative bg-primary/5 items-center justify-center overflow-hidden border-l border-white/5 p-8 xl:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-sm text-center flex flex-col items-center justify-center space-y-6">
              
              {/* Illustration */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-full relative aspect-square max-w-[280px] mx-auto"
              >
                <OptimizedImage
                  src="/i.png"
                  alt="Zashly secure real-time messaging"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  width={350}
                  height={350}
                />
              </motion.div>

              {/* Text */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mt-4 space-y-3"
              >
                <h2 className="text-2xl font-bold tracking-tight">Stay Connected</h2>
                <p className="opacity-70 text-sm leading-relaxed max-w-[280px] mx-auto">
                  Welcome back to your premium experience. Jump right into your secure, real-time conversations and pick up exactly where you left off.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <div className="z-10 mt-auto">
        <AuthLegalFooter />
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
};

export default LoginPage;
