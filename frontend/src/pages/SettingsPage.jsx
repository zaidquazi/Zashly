import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getBlockedUsers,
  unblockUser,
  updateSettings,
  getActiveSessions,
  logoutAllDevices,
  getMyDeletionRequest,
  cancelAccountDeletionRequest,
} from "../lib/api";
import DeleteAccountModal from "../components/settings/DeleteAccountModal";
import useAuthUser from "../hooks/useAuthUser";
import { buildSettingsState, getMediaDevicePrefs, saveMediaDevicePrefs } from "../utils/appSettings";
import {
  GeneralSettingsPanel,
  ProfileSettingsPanel,
  AccountSettingsPanel,
  NotificationsSettingsPanel,
  VideoSettingsPanel,
  ShortcutsSettingsPanel,
} from "../components/settings/SettingsTabContent";
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
  ChevronRightIcon,
  LogOutIcon
} from "lucide-react";
import imageCompression from "browser-image-compression";
import ProfileAvatar from "../components/ProfileAvatar";
import useLogout from "../hooks/useLogout";
import LogoutConfirmModal from "../components/profile/LogoutConfirmModal";

const wallpapers = [
  { name: "Default", value: "" },
  { name: "Dark Nebula", value: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80" },
  { name: "Minimalist Light", value: "https://images.unsplash.com/photo-1517404215738-15263e9f9178?w=800&q=80" },
  { name: "Midnight City", value: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80" },
  { name: "Serene Nature", value: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80" },
];

const VALID_TABS = [
  "general",
  "profile",
  "account",
  "privacy",
  "chats",
  "video",
  "notifications",
  "shortcuts",
];

const SettingsPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "general";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { logoutMutation } = useLogout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logoutMutation();
    setShowLogoutConfirm(false);
    toast.success("Logged out successfully!");
  };

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [settings, setSettings] = useState(() => buildSettingsState(authUser));
  const [mediaPrefs, setMediaPrefs] = useState(getMediaDevicePrefs);
  const [mediaDevices, setMediaDevices] = useState({ cameras: [], mics: [], speakers: [] });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (authUser) {
      setSettings(buildSettingsState(authUser));
    }
  }, [authUser]);

  useEffect(() => {
    let cancelled = false;
    const loadDevices = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setMediaDevices({
          cameras: devices.filter((d) => d.kind === "videoinput"),
          mics: devices.filter((d) => d.kind === "audioinput"),
          speakers: devices.filter((d) => d.kind === "audiooutput"),
        });
      } catch {
        /* permissions may be denied */
      }
    };
    if (activeTab === "video") {
      loadDevices();
    }
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["activeSessions"],
    queryFn: getActiveSessions,
    enabled: activeTab === "account",
  });
  const sessions = sessionsData?.sessions ?? [];

  const { data: deletionData, isLoading: deletionLoading, refetch: refetchDeletion } =
    useQuery({
      queryKey: ["deletionRequest"],
      queryFn: getMyDeletionRequest,
      enabled: activeTab === "account" && !!authUser,
    });
  const deletionRequest = deletionData?.request ?? null;

  const { mutate: cancelDeletionMutation, isPending: cancelDeletionPending } =
    useMutation({
      mutationFn: cancelAccountDeletionRequest,
      onSuccess: (data) => {
        toast.success(data.message || "Deletion request cancelled");
        refetchDeletion();
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to cancel deletion request"
        );
      },
    });

  const { mutate: logoutAllMutation, isPending: logoutAllPending } = useMutation({
    mutationFn: logoutAllDevices,
    onSuccess: (data) => {
      toast.success(data.message || "Logged out from all devices");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      window.location.href = "/login";
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to log out all devices");
    },
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
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
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
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation(settings);
  };

  const handleMediaPrefChange = (field, value) => {
    setMediaPrefs((prev) => {
      const next = { ...prev, [field]: value };
      saveMediaDevicePrefs(next);
      return next;
    });
  };

  const handleTestNotification = () => {
    const { soundEnabled, desktopEnabled } = settings.appSettings.notifications;
    if (soundEnabled) {
      const audio = new Audio("/notification.wav");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
    if (desktopEnabled && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Zashly", {
          body: "Test notification — your settings are working.",
          icon: "/icon.png",
          silent: !soundEnabled,
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification("Zashly", {
              body: "Test notification — your settings are working.",
              icon: "/icon.png",
              silent: !soundEnabled,
            });
          } else {
            toast("Allow browser notifications to see desktop alerts.");
          }
        });
      } else {
        toast.error("Desktop notifications are blocked in your browser.");
      }
    } else if (!desktopEnabled) {
      toast.success("Sound test played (desktop notifications are off).");
    }
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

  const activeTabMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="w-full min-w-0 min-h-full bg-base-200/50 flex flex-col md:flex-row">
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
              onClick={() => selectTab(tab.id)}
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

        {/* Logout button at the bottom of the sidebar */}
        <div className="p-4 border-t border-base-300 bg-base-100 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left hover:bg-error/10 text-error group"
          >
            <div className="size-10 rounded-lg flex items-center justify-center bg-error/10 text-error group-hover:bg-error group-hover:text-error-content transition-colors shrink-0">
              <LogOutIcon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Log Out</p>
              <p className="text-[10px] text-error/60 truncate">Sign out of Zashly</p>
            </div>
          </button>
        </div>
      </div>

      {/* 📄 Settings Content Area */}
      <div className="flex-1 min-w-0 w-full overflow-x-hidden bg-base-200/30">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-8 pb-28 md:pb-12 box-border">
          {/* Mobile section picker */}
          <div className="md:hidden mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sticky top-0 z-10 bg-base-200/95 backdrop-blur-md border-b border-base-300/60 pb-4 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold mb-3">Settings</h1>

            <div
              className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]"
              role="tablist"
              aria-label="Settings sections"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectTab(tab.id)}
                    className={`snap-start shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-primary text-primary-content border-primary shadow-sm"
                        : "bg-base-100 border-base-300 text-base-content/80 hover:border-primary/40"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-base-content/55 leading-snug">
              {activeTabMeta.desc}
            </p>
          </div>

          {activeTab === "privacy" && (
            <div className="space-y-5 sm:space-y-8 w-full min-w-0 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <LockIcon className="size-7 sm:size-8 text-primary shrink-0" aria-hidden="true" />
                <h2 className="text-xl sm:text-2xl font-bold truncate">Privacy</h2>
              </div>

              <div className="card bg-base-100 shadow-sm border border-base-300 w-full min-w-0">
                <div className="card-body p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-base-200/50 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">Last Seen</h3>
                        <p className="text-sm opacity-60 mt-0.5">Who can see when you were last online</p>
                      </div>
                      <select
                        className="select select-bordered w-full sm:w-auto sm:min-w-[11rem] shrink-0"
                        value={settings.privacySettings.lastSeen}
                        onChange={(e) => handlePrivacyChange("lastSeen", e.target.value)}
                      >
                        <option value="everyone">Everyone</option>
                        <option value="friends">Friends Only</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-base-200/50 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">Read Receipts</h3>
                        <p className="text-sm opacity-60 mt-0.5">Send and receive read receipts</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-sm opacity-60 sm:hidden">
                          {settings.privacySettings.readReceipts ? "On" : "Off"}
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.privacySettings.readReceipts}
                          onChange={(e) => handlePrivacyChange("readReceipts", e.target.checked)}
                          aria-label="Enable read receipts"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blocked Users Section */}
              <div className="card bg-base-100 shadow-sm border border-base-300 w-full min-w-0">
                <div className="card-body p-4 sm:p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-error">
                    <EyeOffIcon className="size-5 shrink-0" aria-hidden="true" /> Blocked Users
                  </h3>
                  {isLoadingBlocked ? (
                    <div className="loading loading-spinner mx-auto" />
                  ) : blockedUsers.length === 0 ? (
                    <p className="text-sm opacity-50 text-center py-4">No blocked users</p>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map(user => (
                        <div key={user._id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-base-200/50 rounded-xl">
                           <div className="flex items-center gap-3 min-w-0">
                              <ProfileAvatar src={user.profilePic} name={user.fullName} size="w-10 h-10 shrink-0" />
                              <span className="text-sm font-medium truncate">{user.fullName}</span>
                           </div>
                           <button 
                             onClick={() => unblockMutation(user._id)}
                             className="btn btn-sm btn-outline btn-error w-full sm:w-auto shrink-0"
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
            <div className="space-y-5 sm:space-y-8 w-full min-w-0 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <MessageSquareIcon className="size-7 sm:size-8 text-primary shrink-0" aria-hidden="true" />
                <h2 className="text-xl sm:text-2xl font-bold truncate">Chats</h2>
              </div>

              <div className="card bg-base-100 shadow-sm border border-base-300 w-full min-w-0">
                <div className="card-body p-4 sm:p-6">
                  <h3 className="font-bold mb-4">Chat Wallpaper</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wallpapers.map((wp, i) => (
                      <div
                        key={i}
                        className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          settings.chatWallpaper === wp.value ? "border-primary sm:scale-105" : "border-transparent"
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

          {activeTab === "general" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <GeneralSettingsPanel settings={settings} setSettings={setSettings} />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <ProfileSettingsPanel authUser={authUser} />
            </div>
          )}

          {activeTab === "account" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <AccountSettingsPanel
                authUser={authUser}
                sessions={sessions}
                sessionsLoading={sessionsLoading}
                onLogoutAll={() => logoutAllMutation()}
                logoutAllPending={logoutAllPending}
                deletionRequest={deletionRequest}
                deletionLoading={deletionLoading}
                onOpenDeleteModal={() => setDeleteModalOpen(true)}
                onCancelDeletion={() => cancelDeletionMutation()}
                cancelDeletionPending={cancelDeletionPending}
              />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <NotificationsSettingsPanel
                settings={settings}
                setSettings={setSettings}
                onTestNotification={handleTestNotification}
              />
            </div>
          )}

          {activeTab === "video" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <VideoSettingsPanel
                settings={settings}
                setSettings={setSettings}
                mediaDevices={mediaDevices}
                mediaPrefs={mediaPrefs}
                onMediaPrefChange={handleMediaPrefChange}
              />
            </div>
          )}

          {activeTab === "shortcuts" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <ShortcutsSettingsPanel />
            </div>
          )}

          {/* Global Save Button */}
          <div className="mt-8 md:mt-12 sticky bottom-0 md:static z-10 py-3 md:py-0 -mx-4 px-4 md:mx-0 md:px-0 bg-base-200/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-base-300/60 md:border-t-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="btn btn-primary flex-1 md:flex-initial md:px-8"
            >
              {isSavingSettings ? <span className="loading loading-spinner" /> : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-error flex-1 md:flex-initial md:px-8"
            >
              <LogOutIcon className="size-4 mr-2" /> Log Out
            </button>
          </div>
        </div>
      </div>


      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        authUser={authUser}
        onSubmitted={() => refetchDeletion()}
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        isPending={logoutMutation?.isPending}
      />
    </div>
  );
};

export default SettingsPage;
