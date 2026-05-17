import { useState, useRef } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import {
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
  ShuffleIcon,
  CameraIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";
import imageCompression from "browser-image-compression";

// Generate a deterministic gradient color from a string
function getAvatarGradient(name) {
  const colors = [
    ["#6366f1", "#8b5cf6"], // indigo → violet
    ["#ec4899", "#f43f5e"], // pink → rose
    ["#14b8a6", "#06b6d4"], // teal → cyan
    ["#f59e0b", "#ef4444"], // amber → red
    ["#22c55e", "#10b981"], // green → emerald
    ["#3b82f6", "#6366f1"], // blue → indigo
    ["#a855f7", "#ec4899"], // purple → pink
    ["#f97316", "#f59e0b"], // orange → amber
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

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      console.error("Onboarding error:", error.response || error);
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  // Generate random avatar
  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated!");
  };

  // Shared compression + preview logic
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
        toast.success("Profile picture uploaded & optimized!");
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to process image.");
    }
  };

  const handleCameraCapture = (e) => processImage(e.target.files[0]);
  const handleGalleryUpload = (e) => processImage(e.target.files[0]);

  // Remove profile picture
  const handleRemovePicture = () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      setFormState({ ...formState, profilePic: "" });
      toast("Profile picture removed", { icon: "🗑️" });
    }
  };

  // Determine what to show in the preview circle
  const hasImage = !!formState.profilePic;
  const showAlphabetAvatar = !hasImage && !!formState.fullName.trim();

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Complete Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROFILE PIC CONTAINER */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* IMAGE PREVIEW */}
              <div className="relative group size-32 rounded-full overflow-hidden flex items-center justify-center">
                {hasImage ? (
                  <>
                    <img
                      src={formState.profilePic}
                      alt="Profile Preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                    {/* Remove button on hover */}
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 rounded-full"
                      title="Remove Picture"
                    >
                      <XIcon className="size-6 text-white" />
                    </button>
                  </>
                ) : showAlphabetAvatar ? (
                  <AlphabetAvatar name={formState.fullName} size={128} />
                ) : (
                  <div className="flex items-center justify-center h-full w-full rounded-full bg-base-300">
                    <CameraIcon className="size-12 text-base-content opacity-40" />
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap justify-center gap-2">
                {/* Random Avatar */}
                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="btn btn-accent btn-sm gap-2"
                >
                  <ShuffleIcon className="size-4" />
                  Random
                </button>

                {/* Camera Button */}
                <label className="btn btn-primary btn-sm gap-2 cursor-pointer">
                  <CameraIcon className="size-4" />
                  Camera
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                </label>

                {/* Gallery Button */}
                <label className="btn btn-secondary btn-sm gap-2 cursor-pointer">
                  <ImageIcon className="size-4" />
                  Gallery
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {showAlphabetAvatar && (
                <p className="text-xs opacity-50 -mt-1">
                  Auto-generated from your name — upload to customize
                </p>
              )}
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="Your full name"
              />
            </div>

            {/* BIO */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) =>
                  setFormState({ ...formState, bio: e.target.value })
                }
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself and your goals"
              />
            </div>

            {/* LOCATION */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) =>
                    setFormState({ ...formState, location: e.target.value })
                  }
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              className="btn btn-primary w-full"
              disabled={isPending}
              type="submit"
            >
              {!isPending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Complete Onboarding
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Onboarding...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
