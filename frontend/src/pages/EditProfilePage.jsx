import { useState } from "react";
import { useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateProfile } from "../lib/api";
import {
  LoaderIcon,
  MapPinIcon,
  SaveIcon,
  ShuffleIcon,
  CameraIcon,
  XIcon,
  UploadIcon,
  ArrowLeftIcon,
  UserIcon,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import ProfileAvatar from "../components/ProfileAvatar";
import { motion, AnimatePresence } from "framer-motion";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate(-1);
    },
    onError: (error) => {
      console.error("Update profile error:", error.response || error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation(formState);
  };

  // Generate random avatar
  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated!");
  };

  // Upload and compress image
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
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
        setFormState({ ...formState, profilePic: reader.result });
        toast.success("Profile picture uploaded & optimized!");
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to process image.");
    }
  };

  // Remove profile picture with confirmation
  const handleRemovePicture = () => {
    setShowDeleteModal(true);
  };

  const confirmRemovePicture = () => {
    setFormState({ ...formState, profilePic: "" });
    setShowDeleteModal(false);
    toast("Profile picture removed", { icon: "🗑️" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UserIcon className="size-6" />
            Edit Profile
          </h1>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PROFILE PIC CONTAINER */}
              <div className="flex flex-col items-center justify-center space-y-4">
                {/* IMAGE PREVIEW WITH HOVER REMOVE */}
                <div className="relative group size-32 rounded-full bg-base-300 overflow-hidden">
                  {formState.profilePic ? (
                    <>
                      <img
                        src={formState.profilePic}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                      {/* REMOVE BUTTON (only on hover) */}
                      <button
                        type="button"
                        onClick={handleRemovePicture}
                        className="absolute bottom-1 right-12 bg-base-100 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-error hover:text-white transition-all duration-200"
                        title="Remove Picture"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </>
                  ) : (
                    <ProfileAvatar src="" name={formState.fullName} size="w-full h-full" textSize="text-4xl" />
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap justify-center gap-2">
                  {/* Random Avatar */}
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="btn btn-accent btn-sm"
                  >
                    <ShuffleIcon className="size-4 mr-2" />
                    Random Avatar
                  </button>

                  {/* File Upload */}
                  <label className="btn btn-secondary btn-sm cursor-pointer flex items-center">
                    <UploadIcon className="size-4 mr-2" />
                    Upload Picture
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
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
                  placeholder="Tell others about yourself"
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

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1"
                  disabled={isPending}
                  type="submit"
                >
                  {!isPending ? (
                    <>
                      <SaveIcon className="size-5 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <LoaderIcon className="animate-spin size-5 mr-2" />
                      Saving...
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-base-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/10"
            >
              <h3 className="text-xl font-bold mb-2">Remove Picture</h3>
              <p className="text-sm opacity-70 mb-6">Are you sure you want to remove your profile picture?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-ghost rounded-xl"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemovePicture}
                  className="btn btn-error rounded-xl"
                  type="button"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfilePage;
