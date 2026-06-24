import { useState, useRef, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import {
  LoaderIcon,
  CameraIcon,
  ImageIcon,
  XIcon,
  ArrowRight,
  ArrowLeft,
  Globe2,
  Users,
  Star
} from "lucide-react";
import Logo from "../components/Logo";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

function getAvatarGradient(name) {
  const colors = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#f43f5e"],
    ["#14b8a6", "#06b6d4"],
    ["#f59e0b", "#ef4444"],
    ["#22c55e", "#10b981"],
    ["#3b82f6", "#6366f1"],
    ["#a855f7", "#ec4899"],
    ["#f97316", "#f59e0b"],
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const AlphabetAvatar = ({ name, size = 128 }) => {
  const letter = (name || "?").trim()[0]?.toUpperCase() || "?";
  const [from, to] = getAvatarGradient(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#fff",
        letterSpacing: "-1px",
        userSelect: "none",
        boxShadow: `0 4px 24px ${from}55`,
      }}
    >
      {letter}
    </div>
  );
};

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    username: authUser?.username || "",
    dateOfBirth: authUser?.dateOfBirth ? new Date(authUser.dateOfBirth).toISOString().split('T')[0] : "",
    gender: authUser?.gender || "",
    profilePic: authUser?.profilePic || "",
  });

  // Calculate today's date for max dateOfBirth
  const today = new Date().toISOString().split("T")[0];

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const processImage = async (file) => {
    if (!file) return;
    if (file.size > 7 * 1024 * 1024) {
      toast.error("Please select an image smaller than 7MB");
      return;
    }
    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState((prev) => ({ ...prev, profilePic: reader.result }));
        toast.success("Profile picture updated!");
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.error("Failed to process image.");
    }
  };

  const handleCameraCapture = (e) => processImage(e.target.files[0]);
  const handleGalleryUpload = (e) => processImage(e.target.files[0]);

  const handleRemovePicture = () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      setFormState({ ...formState, profilePic: "" });
    }
  };

  const hasImage = !!formState.profilePic;
  const showAlphabetAvatar = !hasImage && !!formState.fullName.trim();

  const nextStep = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, type: "spring", bounce: 0.2 }
    },
    exit: (direction) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    })
  };

  // We keep track of direction for animation
  const [[page, direction], setPage] = useState([0, 0]);

  useEffect(() => {
    setPage([step, step > page ? 1 : -1]);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const slides = [
    {
      id: "welcome",
      icon: <Logo className="w-20 h-20 text-primary mx-auto mb-8 drop-shadow-[0_0_15px_rgba(var(--p),0.5)] animate-spin-slow" />,
      title: "Welcome to Zashly",
      subtitle: "Your premium networking and messaging experience starts here.",
    },
    {
      id: "discover",
      icon: <Globe2 className="w-20 h-20 text-secondary mx-auto mb-8 drop-shadow-[0_0_15px_rgba(var(--s),0.5)]" />,
      title: "Discover Features",
      subtitle: "Connect instantly with crystal clear voice, video, and real-time chat.",
    },
    {
      id: "connect",
      icon: <Users className="w-20 h-20 text-accent mx-auto mb-8 drop-shadow-[0_0_15px_rgba(var(--a),0.5)]" />,
      title: "Connect with People",
      subtitle: "Find your crowd. Meet verified professionals and amazing creators.",
    },
    {
      id: "professional",
      icon: <Star className="w-20 h-20 text-primary mx-auto mb-8 drop-shadow-[0_0_15px_rgba(var(--p),0.5)]" />,
      title: "Build Your Presence",
      subtitle: "Establish a profile that stands out from the rest of the world.",
    }
  ];

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center relative overflow-hidden" data-theme="light">
      
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[5%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-base-300">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="w-full max-w-2xl px-6 flex-1 flex flex-col items-center justify-center z-10">
        
        <div className="w-full relative min-h-[500px] flex items-center justify-center">
          <AnimatePresence custom={direction} mode="wait">
            {step < 4 ? (
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-center w-full"
              >
                {slides[step].icon}
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">{slides[step].title}</h1>
                <p className="text-lg opacity-70 max-w-md mx-auto">{slides[step].subtitle}</p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full bg-base-200/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 sm:p-10 shadow-2xl my-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold">Complete Your Profile</h2>
                  <p className="opacity-60 text-sm mt-2">Let's put a face to the name</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* PROFILE PIC CONTAINER */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative group size-32 rounded-full overflow-hidden flex items-center justify-center ring-4 ring-primary/20 bg-base-300">
                      {hasImage ? (
                        <>
                          <img
                            src={formState.profilePic}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePicture}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 rounded-full"
                          >
                            <XIcon className="size-8 text-white" />
                          </button>
                        </>
                      ) : showAlphabetAvatar ? (
                        <AlphabetAvatar name={formState.fullName} size={128} />
                      ) : (
                        <CameraIcon className="size-12 text-base-content opacity-30" />
                      )}
                    </div>

                    <div className="flex justify-center gap-2 mt-2">
                      <label className="btn btn-outline btn-sm rounded-full gap-2 cursor-pointer border-white/20">
                        <CameraIcon className="size-4" />
                        Camera
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
                      </label>
                      <label className="btn btn-outline btn-sm rounded-full gap-2 cursor-pointer border-white/20">
                        <ImageIcon className="size-4" />
                        Gallery
                        <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* FULL NAME */}
                    <div className="form-control">
                      <label className="label text-xs font-medium opacity-70 pb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formState.fullName}
                        onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                        className="input w-full bg-base-100/50 border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* USERNAME */}
                    <div className="form-control">
                      <label className="label text-xs font-medium opacity-70 pb-1">Username</label>
                      <input
                        type="text"
                        required
                        pattern="[a-z0-9_]{3,20}"
                        title="3-20 characters, lowercase letters, numbers, and underscores only"
                        value={formState.username}
                        onChange={(e) => setFormState({ ...formState, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className="input w-full bg-base-100/50 border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                        placeholder="johndoe123"
                      />
                    </div>

                    {/* DOB */}
                    <div className="form-control">
                      <label className="label text-xs font-medium opacity-70 pb-1">Date of Birth</label>
                      <input
                        type="date"
                        required
                        max={today}
                        value={formState.dateOfBirth}
                        onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
                        className="input w-full bg-base-100/50 border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* GENDER */}
                  <div className="form-control pt-2">
                    <label className="label text-xs font-medium opacity-70 pb-2">Gender</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["Male", "Female", "Prefer Not To Say", "Custom"].map(g => (
                        <div
                          key={g}
                          onClick={() => setFormState({...formState, gender: g})}
                          className={`
                            cursor-pointer rounded-xl border p-3 text-center transition-all text-sm
                            ${formState.gender === g 
                              ? "bg-primary/20 border-primary text-primary font-medium" 
                              : "bg-base-100/30 border-white/10 hover:bg-base-100/60 opacity-80"
                            }
                          `}
                        >
                          {g}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-full rounded-xl py-4 h-auto text-lg mt-8"
                    disabled={isPending || !formState.gender || !formState.dateOfBirth || !formState.username || !formState.fullName}
                    type="submit"
                  >
                    {isPending ? (
                      <LoaderIcon className="animate-spin size-6 mx-auto" />
                    ) : (
                      "Complete Setup"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION (Skip/Continue) */}
        {step < 4 && (
          <div className="w-full flex justify-between items-center absolute bottom-10 px-8">
            <button 
              onClick={() => setStep(4)} 
              className="btn btn-ghost text-base-content/50 hover:text-base-content"
            >
              Skip
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={prevStep} className="btn btn-circle btn-ghost">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <button onClick={nextStep} className="btn btn-circle btn-primary shadow-lg shadow-primary/30">
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OnboardingPage;
