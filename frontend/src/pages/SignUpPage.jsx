import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  Zap, 
  User,
  Sparkles
} from "lucide-react";
import Logo from "../components/Logo";

import useSignUp from "../hooks/useSignUp";
import { checkUsernameAvailability } from "../lib/api";
import AuthLegalFooter from "../components/layout/AuthLegalFooter";
import OptimizedImage from "../components/ui/OptimizedImage";

const getPasswordStrength = (password) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  
  if (checks.length) score += 1;
  if (checks.upper && checks.lower) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  let label = "Weak";
  let color = "bg-error";
  if (score === 2) { label = "Fair"; color = "bg-warning"; }
  else if (score === 3) { label = "Strong"; color = "bg-success"; }
  else if (score === 4) { label = "Very Strong"; color = "bg-primary"; }

  if (password.length === 0) {
    score = 0; label = ""; color = "bg-base-300";
  }

  return { score, label, color, checks };
};

const SignUpPage = () => {
  const [signupData, setSignupData] = useState({
    username: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimer = useRef(null);

  const { isPending, error, signupMutation } = useSignUp();

  const pwStrength = getPasswordStrength(signupData.password);

  const generateSuggestions = (base) => {
    if (!base) return [];
    const chars = base.replace(/[^a-z0-9_]/g, '');
    return [
      `${chars}_01`,
      `official_${chars}`,
      `the_${chars}`,
      `${chars}app`
    ].slice(0, 4);
  };

  const validateUsername = useCallback(async (val) => {
    if (!val) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      setSuggestions([]);
      return;
    }

    if (val.length < 3) {
      setUsernameStatus("error");
      setUsernameMessage("Too short (min 3 chars)");
      setSuggestions([]);
      return;
    }

    setUsernameStatus("loading");
    try {
      const res = await checkUsernameAvailability(val);
      if (res.available) {
        setUsernameStatus("available");
        setUsernameMessage("Username is available");
        setSuggestions([]);
      } else {
        setUsernameStatus("unavailable");
        setUsernameMessage(res.message || "Username is taken");
        setSuggestions(generateSuggestions(val));
      }
    } catch (err) {
      setUsernameStatus("error");
      setUsernameMessage(err.response?.data?.message || "Error checking username");
    }
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setSignupData(prev => ({ ...prev, username: val }));
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (val.length >= 3) {
      setUsernameStatus("loading");
    } else {
      setUsernameStatus("idle");
      setUsernameMessage("");
      setSuggestions([]);
    }

    debounceTimer.current = setTimeout(() => {
      validateUsername(val);
    }, 600);
  };

  const applySuggestion = (sug) => {
    setSignupData(prev => ({ ...prev, username: sug }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setUsernameStatus("loading");
    validateUsername(sug);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (usernameStatus !== "available") return;
    signupMutation(signupData);
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

          {/* LEFT: FORM SECTION */}
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
              <h1 className="text-2xl font-semibold mb-1">Create an Account</h1>
              <p className="opacity-60 text-sm">Join Zashly to start connecting instantly.</p>
            </motion.div>

            {/* Error Message */}
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
                    <span>{error?.response?.data?.message ?? "An unexpected error occurred."}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSignup} className="space-y-4">
              
              {/* USERNAME FIELD */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold opacity-70 uppercase tracking-wider pl-1">
                  Username
                </label>
                <div className={`relative flex items-center bg-base-200/50 border transition-all duration-300 rounded-xl overflow-hidden shadow-inner
                  ${isUsernameFocused ? 'border-primary/50 shadow-[0_0_0_4px_rgba(var(--p),0.1)] bg-base-100' : 'border-white/10'}
                  ${usernameStatus === 'error' || usernameStatus === 'unavailable' ? '!border-error/50 bg-error/5' : ''}
                  ${usernameStatus === 'available' ? '!border-success/50 bg-success/5' : ''}
                `}>
                  <div className="pl-3 pr-2 opacity-40">
                    <User className="size-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    className="w-full bg-transparent outline-none py-3 pr-10 text-sm placeholder:opacity-40"
                    value={signupData.username}
                    onChange={handleUsernameChange}
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setIsUsernameFocused(false)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    required
                  />
                  
                  {/* Status Icon */}
                  <div className="absolute right-3 flex items-center">
                    <AnimatePresence mode="wait">
                      {usernameStatus === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <Loader2 className="size-4 opacity-40 animate-spin" />
                        </motion.div>
                      )}
                      {usernameStatus === 'available' && (
                        <motion.div key="available" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <CheckCircle2 className="size-4 text-success" />
                        </motion.div>
                      )}
                      {(usernameStatus === 'unavailable' || usernameStatus === 'error') && (
                        <motion.div key="error" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <XCircle className="size-4 text-error" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Status Message & Suggestions */}
                <AnimatePresence>
                  {signupData.username.length > 0 && usernameStatus !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-1"
                    >
                      <p className={`text-[11px] mt-1 transition-colors font-medium ${
                        usernameStatus === 'available' ? 'text-success' : 
                        usernameStatus === 'loading' ? 'opacity-50' : 
                        'text-error'
                      }`}>
                        {usernameMessage}
                      </p>

                      {/* Premium Suggestions Chips */}
                      {suggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <p className="text-[10px] opacity-50 mb-1.5 uppercase tracking-wider font-semibold">Available Suggestions</p>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => applySuggestion(sug)}
                                className="px-2.5 py-1 bg-base-200/50 hover:bg-base-200 border border-white/10 rounded-lg text-[11px] transition-all flex items-center gap-1"
                              >
                                <Sparkles className="size-2.5 text-primary/70" />
                                {sug}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold opacity-70 uppercase tracking-wider pl-1">
                  Password
                </label>
                <div className={`relative flex items-center bg-base-200/50 border transition-all duration-300 rounded-xl overflow-hidden shadow-inner
                  ${isPasswordFocused ? 'border-primary/50 shadow-[0_0_0_4px_rgba(var(--p),0.1)] bg-base-100' : 'border-white/10'}
                `}>
                  <div className="pl-3 pr-2 opacity-40">
                    <Lock className="size-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="w-full bg-transparent outline-none py-3 pr-10 text-sm placeholder:opacity-40"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 opacity-40 hover:text-primary transition-colors outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                <AnimatePresence>
                  {signupData.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-1.5 space-y-2"
                    >
                      <div className="flex items-center justify-between pl-1 pr-1">
                        <div className="flex gap-1 flex-1 mr-4">
                          {[1, 2, 3, 4].map((level) => (
                            <div 
                              key={level} 
                              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                level <= pwStrength.score ? pwStrength.color : 'bg-base-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                          pwStrength.score >= 3 ? 'text-success' : 'opacity-50'
                        }`}>
                          {pwStrength.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pl-1">
                        <div className={`text-[10px] flex items-center gap-1 transition-colors font-medium ${pwStrength.checks.length ? 'text-success' : 'opacity-50'}`}>
                          {pwStrength.checks.length ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current opacity-50" />}
                          8+ chars
                        </div>
                        <div className={`text-[10px] flex items-center gap-1 transition-colors font-medium ${pwStrength.checks.upper && pwStrength.checks.lower ? 'text-success' : 'opacity-50'}`}>
                          {pwStrength.checks.upper && pwStrength.checks.lower ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current opacity-50" />}
                          Upper & lower
                        </div>
                        <div className={`text-[10px] flex items-center gap-1 transition-colors font-medium ${pwStrength.checks.number ? 'text-success' : 'opacity-50'}`}>
                          {pwStrength.checks.number ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current opacity-50" />}
                          Contains number
                        </div>
                        <div className={`text-[10px] flex items-center gap-1 transition-colors font-medium ${pwStrength.checks.special ? 'text-success' : 'opacity-50'}`}>
                          {pwStrength.checks.special ? <CheckCircle2 className="size-3" /> : <div className="size-3 rounded-full border border-current opacity-50" />}
                          Special char
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      className="appearance-none size-4 border-[1.5px] border-base-300 rounded bg-base-100 checked:bg-primary checked:border-primary transition-all peer" 
                      required 
                    />
                    <CheckCircle2 className="size-3 text-primary-content absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                  </div>
                  <span className="text-[11px] leading-relaxed opacity-60 group-hover:opacity-80 transition-opacity">
                    By creating an account, you agree to our{" "}
                    <Link to="/terms" className="font-medium hover:text-primary transition-colors">Terms</Link> and{" "}
                    <Link to="/privacy" className="font-medium hover:text-primary transition-colors">Privacy Policy</Link>.
                  </span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button 
                type="submit" 
                className={`w-full rounded-xl py-3 mt-2 text-sm font-medium shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group
                  ${isPending || usernameStatus !== 'available' || pwStrength.score < 2 
                    ? 'btn-disabled opacity-50' 
                    : 'btn btn-primary min-h-0 h-auto'
                  }
                `}
                disabled={isPending || usernameStatus !== 'available' || pwStrength.score < 2}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Security Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-4 gap-y-2"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-wider">
                <Lock className="size-3" />
                Encrypted
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-wider">
                <Shield className="size-3" />
                Privacy First
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-wider">
                <Zap className="size-3" />
                Fast
              </div>
            </motion.div>

            {/* Login Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center lg:text-left"
            >
              <p className="text-xs opacity-60">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline transition-all">
                  Log in instead
                </Link>
              </p>
            </motion.div>
          </div>

          {/* RIGHT: IMAGE SECTION */}
          <div className="hidden lg:flex w-full lg:w-1/2 relative bg-primary/5 items-center justify-center overflow-hidden border-l border-white/5 p-8 xl:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-sm text-center flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-full relative aspect-square max-w-[280px]"
              >
                <OptimizedImage
                  src="/i.png"
                  alt="Zashly Real-time chat"
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
                className="mt-6 space-y-3"
              >
                <h2 className="text-2xl font-bold tracking-tight">
                  Join the Conversation
                </h2>
                <p className="opacity-70 text-sm leading-relaxed max-w-[280px] mx-auto">
                  Experience seamless, secure, and lightning-fast messaging. Build communities, share moments, and connect without limits.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <div className="z-10 mt-auto">
        <AuthLegalFooter />
      </div>
    </div>
  );
};

export default SignUpPage;
