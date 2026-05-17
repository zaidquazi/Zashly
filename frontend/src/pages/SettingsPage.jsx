import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getBlockedUsers, unblockUser, updateSettings } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { 
  ShieldIcon, 
  LockIcon, 
  UnlockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  MessageSquareIcon, 
  CheckCheckIcon, 
  UploadIcon, 
  ImageIcon,
  UserIcon,
  SettingsIcon,
  BellIcon,
  VideoIcon,
  KeyboardIcon,
  MonitorIcon,
  KeyIcon,
  ChevronRightIcon
} from "lucide-react";
import imageCompression from "browser-image-compression";
import ProfileAvatar from "../components/ProfileAvatar";

const wallpapers = [
  { name: "Default", value: "" },
  { name: "Dark Nebula", value: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80" },
  { name: "Minimalist Light", value: "https://images.unsplash.com/photo-1517404215738-15263e9f9178?w=800&q=80" },
  { name: "Midnight City", value: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80" },
  { name: "Serene Nature", value: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80" },
];

const SettingsPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("privacy");

  // Settings State
  const [settings, setSettings] = useState({
    chatWallpaper: authUser?.chatWallpaper || "",
    privacySettings: {
      lastSeen: authUser?.privacySettings?.lastSeen || "everyone",
      readReceipts: authUser?.privacySettings?.readReceipts ?? true,
    },
    notifications: {
      soundEnabled: true,
      desktopEnabled: true,
    }
  });

  // Fetch Blocked Users
  const { data: blockedUsers = [], isLoading: isLoadingBlocked } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: getBlockedUsers,
  });

  // Unblock User Mutation
  const { mutate: unblockMutation } = useMutation({
    mutationFn: unblockUser,
    onSuccess: (data) => {
      toast.success(data.message || "User unblocked successfully");
      queryClient.invalidateQueries(["blockedUsers"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    },
  });

  // Update Settings Mutation
  const { mutate: updateSettingsMutation, isPending: isSavingSettings } = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries(["authUser"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation(settings);
  };

  const handlePrivacyChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Please select an image smaller than 10MB");
      return;
    }

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();

      reader.onloadend = () => {
        setSettings({ ...settings, chatWallpaper: reader.result });
        toast.success("Wallpaper uploaded & optimized!");
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to process image.");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: MonitorIcon, desc: "Startup and close" },
    { id: "profile", label: "Profile", icon: UserIcon, desc: "Name, profile photo" },
    { id: "account", label: "Account", icon: KeyIcon, desc: "Security notifications, account info" },
    { id: "privacy", label: "Privacy", icon: LockIcon, desc: "Blocked contacts, disappearing messages" },
    { id: "chats", label: "Chats", icon: MessageSquareIcon, desc: "Theme, wallpaper, chat settings" },
    { id: "video", label: "Video & voice", icon: VideoIcon, desc: "Camera, microphone & speakers" },
    { id: "notifications", label: "Notifications", icon: BellIcon, desc: "Messages, groups, sounds" },
    { id: "shortcuts", label: "Keyboard shortcuts", icon: KeyboardIcon, desc: "Quick actions" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200/50 flex">
      {/* 📁 Settings Sidebar */}
      <div className="w-full sm:w-80 bg-base-100 border-r border-base-300 flex flex-col shrink-0 hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="mt-4 relative">
            <input 
              type="text" 
              placeholder="Search settings" 
              className="input input-sm bg-base-200 border-none w-full pl-8"
            />
            <SettingsIcon className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left group mb-1 ${
                activeTab === tab.id ? "bg-primary/10 text-primary" : "hover:bg-base-200"
              }`}
            >
              <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-content" : "bg-base-200 group-hover:bg-base-300"
              }`}>
                <tab.icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{tab.label}</p>
                <p className="text-[10px] opacity-50 truncate">{tab.desc}</p>
              </div>
              {activeTab === tab.id && <ChevronRightIcon className="size-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* 📄 Settings Content Area */}
      <div className="flex-1 overflow-y-auto bg-base-200/30">
        <div className="max-w-3xl mx-auto p-4 sm:p-8 lg:p-12">
          {/* Mobile Tab Selector (only visible on mobile) */}
          <div className="md:hidden mb-6">
             <h1 className="text-2xl font-bold mb-4">Settings</h1>
             <select 
               className="select select-bordered w-full"
               value={activeTab}
               onChange={(e) => setActiveTab(e.target.value)}
             >
               {tabs.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
             </select>
          </div>

          {activeTab === "privacy" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <LockIcon className="size-8 text-primary" />
                <h2 className="text-2xl font-bold">Privacy</h2>
              </div>

              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-xl">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">Last Seen</h3>
                        <p className="text-sm opacity-60">Who can see when you were last online</p>
                      </div>
                      <select
                        className="select select-bordered select-sm"
                        value={settings.privacySettings.lastSeen}
                        onChange={(e) => handlePrivacyChange("lastSeen", e.target.value)}
                      >
                        <option value="everyone">Everyone</option>
                        <option value="friends">Friends Only</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-xl">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">Read Receipts</h3>
                        <p className="text-sm opacity-60">Send and receive read receipts</p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings.privacySettings.readReceipts}
                        onChange={(e) => handlePrivacyChange("readReceipts", e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Blocked Users Section */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-error">
                    <EyeOffIcon className="size-5" /> Blocked Users
                  </h3>
                  {isLoadingBlocked ? (
                    <div className="loading loading-spinner mx-auto" />
                  ) : blockedUsers.length === 0 ? (
                    <p className="text-sm opacity-50 text-center py-4">No blocked users</p>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map(user => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-xl">
                           <div className="flex items-center gap-3">
                              <ProfileAvatar src={user.profilePic} name={user.fullName} size="w-10 h-10" />
                              <span className="text-sm font-medium">{user.fullName}</span>
                           </div>
                           <button 
                             onClick={() => unblockMutation(user._id)}
                             className="btn btn-xs btn-outline btn-error"
                           >Unblock</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "chats" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <MessageSquareIcon className="size-8 text-primary" />
                <h2 className="text-2xl font-bold">Chats</h2>
              </div>

              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold mb-4">Chat Wallpaper</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wallpapers.map((wp, i) => (
                      <div
                        key={i}
                        className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          settings.chatWallpaper === wp.value ? "border-primary scale-105" : "border-transparent"
                        }`}
                        onClick={() => setSettings(s => ({ ...s, chatWallpaper: wp.value }))}
                      >
                        {wp.value ? <img src={wp.value} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-base-300 flex items-center justify-center text-xs">Default</div>}
                      </div>
                    ))}
                  </div>
                  <label className="btn btn-outline btn-sm mt-4 w-full cursor-pointer">
                    <UploadIcon className="size-4 mr-2" /> Upload Custom
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {(activeTab === "notifications" || activeTab === "general" || activeTab === "account" || activeTab === "profile" || activeTab === "video" || activeTab === "shortcuts") && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <SettingsIcon className="size-8 text-primary" />
                <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
              </div>
              <div className="card bg-base-100 shadow-sm border border-base-300 p-12 text-center opacity-50 italic">
                 Content for {activeTab} settings is coming soon in the next update.
              </div>
            </div>
          )}

          {/* Global Save Button */}
          <div className="mt-12 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="btn btn-primary px-8"
            >
              {isSavingSettings ? <span className="loading loading-spinner" /> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
