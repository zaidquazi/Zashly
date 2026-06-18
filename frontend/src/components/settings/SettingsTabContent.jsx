import { Link } from "react-router";
import { format } from "date-fns";
import {
  MonitorIcon,
  UserIcon,
  KeyIcon,
  BellIcon,
  KeyboardIcon,
  LogOutIcon,
  ShieldIcon,
  ExternalLinkIcon,
  Trash2Icon,
  ClockIcon,
  XCircleIcon,
  VideoIcon,
  MicIcon,
  Volume2Icon,
} from "lucide-react";
import ThemeSelector from "../ThemeSelector";
import ProfileAvatar from "../ProfileAvatar";
import SettingsToggleRow, { SettingsToggle } from "./SettingsToggleRow";
import { THEMES } from "../../constants";
import { useThemeStore } from "../../store/useThemeStore";

const PanelHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 min-w-0">
    <Icon className="size-7 sm:size-8 text-primary shrink-0" aria-hidden="true" />
    <h2 className="text-xl sm:text-2xl font-bold truncate">{title}</h2>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`card bg-base-100 shadow-sm border border-base-300 w-full min-w-0 ${className}`}>
    <div className="card-body p-4 sm:p-6">{children}</div>
  </div>
);

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], action: "Quick search users" },
  { keys: ["Enter"], action: "Send message (when enabled)" },
  { keys: ["Shift", "Enter"], action: "New line in message" },
  { keys: ["Esc"], action: "Close modals / menus" },
];

export function GeneralSettingsPanel({ settings, setSettings }) {
  const { theme } = useThemeStore();
  const currentTheme = THEMES.find((t) => t.name === theme);

  const setGeneral = (field, value) =>
    setSettings((prev) => ({
      ...prev,
      appSettings: {
        ...prev.appSettings,
        general: { ...prev.appSettings.general, [field]: value },
      },
    }));

  return (
    <div className="space-y-5 sm:space-y-8 w-full min-w-0">
      <PanelHeader icon={MonitorIcon} title="General" />
      <Card>
        <h3 className="font-bold mb-3">Appearance</h3>
        <p className="text-sm opacity-60 mb-4">
          Current theme: <span className="font-medium">{currentTheme?.label ?? theme}</span>
        </p>
        <ThemeSelector variant="menuItem" />
      </Card>
      <Card>
        <h3 className="font-bold mb-4">Chat behavior</h3>
        <div className="space-y-4">
          <SettingsToggleRow title="Enter to send" description="Press Enter to send messages">
            <SettingsToggle
              checked={settings.appSettings.general.enterToSend}
              onChange={(v) => setGeneral("enterToSend", v)}
            />
          </SettingsToggleRow>
          <SettingsToggleRow title="Show online status" description="Let others see when you are active">
            <SettingsToggle
              checked={settings.appSettings.general.showOnlineStatus}
              onChange={(v) => setGeneral("showOnlineStatus", v)}
            />
          </SettingsToggleRow>
          <SettingsToggleRow title="Link previews" description="Show previews for shared links">
            <SettingsToggle
              checked={settings.appSettings.general.showLinkPreviews}
              onChange={(v) => setGeneral("showLinkPreviews", v)}
            />
          </SettingsToggleRow>
          <SettingsToggleRow title="Compact chat list" description="Denser conversation list">
            <SettingsToggle
              checked={settings.appSettings.general.compactChatList}
              onChange={(v) => setGeneral("compactChatList", v)}
            />
          </SettingsToggleRow>
        </div>
      </Card>
    </div>
  );
}

export function ProfileSettingsPanel({ authUser }) {
  return (
    <div className="space-y-5 sm:space-y-8 w-full min-w-0">
      <PanelHeader icon={UserIcon} title="Profile" />
      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <ProfileAvatar
            src={authUser?.profilePic}
            name={authUser?.fullName}
            size="w-20 h-20"
            textSize="text-2xl"
          />
          <div className="text-center sm:text-left min-w-0">
            <p className="font-bold text-lg truncate">{authUser?.fullName}</p>
            <p className="text-sm opacity-60 truncate">{authUser?.email}</p>
            {authUser?.location && (
              <p className="text-xs opacity-50 mt-1">{authUser.location}</p>
            )}
          </div>
        </div>
        {authUser?.bio && (
          <p className="text-sm opacity-80 mb-4 p-3 bg-base-200/50 rounded-lg">{authUser.bio}</p>
        )}
        <Link to="/edit-profile" className="btn btn-primary w-full sm:w-auto gap-2">
          <ExternalLinkIcon className="size-4" />
          Edit profile photo & details
        </Link>
      </Card>
    </div>
  );
}

export function AccountSettingsPanel({
  authUser,
  sessions,
  sessionsLoading,
  onLogoutAll,
  logoutAllPending,
  deletionRequest,
  deletionLoading,
  onOpenDeleteModal,
  onCancelDeletion,
  cancelDeletionPending,
}) {
  const isAdmin = authUser?.role === "admin";
  const pendingDeletion = deletionRequest?.status === "pending";
  return (
    <div className="space-y-5 sm:space-y-8 w-full min-w-0">
      <PanelHeader icon={KeyIcon} title="Account" />
      <Card>
        <h3 className="font-bold mb-4">Account information</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="opacity-60">Email</dt>
            <dd className="font-medium truncate">{authUser?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="opacity-60">Role</dt>
            <dd className="font-medium capitalize">{authUser?.role || "user"}</dd>
          </div>
          {authUser?.createdAt && (
            <div className="flex justify-between gap-4">
              <dt className="opacity-60">Member since</dt>
              <dd className="font-medium">
                {format(new Date(authUser.createdAt), "MMM d, yyyy")}
              </dd>
            </div>
          )}
        </dl>
      </Card>
      <Card>
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <ShieldIcon className="size-5" /> Active sessions
        </h3>
        <p className="text-sm opacity-60 mb-4">
          Devices where you are signed in to Zashly
        </p>
        {sessionsLoading ? (
          <span className="loading loading-spinner mx-auto block" />
        ) : !sessions?.length ? (
          <p className="text-sm opacity-50 text-center py-4">No active sessions found</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.sessionId}
                className="p-3 bg-base-200/50 rounded-xl text-sm"
              >
                <p className="font-medium truncate">
                  {s.userAgent?.slice(0, 60) || "Unknown device"}
                </p>
                <p className="text-xs opacity-50 mt-1">
                  IP: {s.ip || "—"} · Started{" "}
                  {format(new Date(s.createdAt), "MMM d, yyyy")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn-outline btn-error w-full mt-4 gap-2"
          onClick={onLogoutAll}
          disabled={logoutAllPending}
        >
          {logoutAllPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <LogOutIcon className="size-4" />
          )}
          Log out of all devices
        </button>
      </Card>

      <Card className="border-error/30">
        <h3 className="font-bold mb-2 flex items-center gap-2 text-error">
          <Trash2Icon className="size-5" /> Delete account
        </h3>
        <p className="text-sm opacity-60 mb-4">
          Permanently remove your account and all data after administrator approval.
          Download your data and confirm with your password before submitting.
        </p>

        {deletionLoading ? (
          <span className="loading loading-spinner mx-auto block" />
        ) : isAdmin ? (
          <p className="text-sm opacity-50 italic">
            Admin accounts cannot be deleted through self-service.
          </p>
        ) : pendingDeletion ? (
          <div className="space-y-3">
            <span className="badge badge-warning gap-1">
              <ClockIcon className="size-3" /> Pending admin approval
            </span>
            <p className="text-xs opacity-60">
              Submitted {format(new Date(deletionRequest.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
            <button
              type="button"
              className="btn btn-outline btn-sm w-full"
              onClick={onCancelDeletion}
              disabled={cancelDeletionPending}
            >
              {cancelDeletionPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <XCircleIcon className="size-4" /> Cancel deletion request
                </>
              )}
            </button>
          </div>
        ) : deletionRequest?.status === "rejected" ? (
          <div className="space-y-3">
            <span className="badge badge-error">Request rejected</span>
            {deletionRequest.adminNote && (
              <p className="text-xs opacity-70">{deletionRequest.adminNote}</p>
            )}
            <button
              type="button"
              className="btn btn-outline btn-error w-full"
              onClick={onOpenDeleteModal}
            >
              Submit new request
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-error w-full gap-2"
            onClick={onOpenDeleteModal}
          >
            <Trash2Icon className="size-4" />
            Delete my account permanently
          </button>
        )}
      </Card>
    </div>
  );
}

export function NotificationsSettingsPanel({ settings, setSettings, onTestNotification }) {
  const setNotif = (field, value) =>
    setSettings((prev) => ({
      ...prev,
      appSettings: {
        ...prev.appSettings,
        notifications: { ...prev.appSettings.notifications, [field]: value },
      },
    }));

  const rows = [
    ["soundEnabled", "Notification sounds", "Play a sound for new activity"],
    ["desktopEnabled", "Desktop notifications", "Show browser push notifications"],
    ["messages", "Direct messages", "Alerts for new private messages"],
    ["groups", "Group messages", "Alerts for group chat activity"],
    ["moments", "Moments & sparks", "Likes and comments on moments"],
    ["friendRequests", "Friend requests", "When someone sends you a friend request"],
  ];

  return (
    <div className="space-y-5 sm:space-y-8 w-full min-w-0">
      <PanelHeader icon={BellIcon} title="Notifications" />
      <Card>
        <div className="space-y-4">
          {rows.map(([field, title, description]) => (
            <SettingsToggleRow key={field} title={title} description={description}>
              <SettingsToggle
                checked={settings.appSettings.notifications[field]}
                onChange={(v) => setNotif(field, v)}
              />
            </SettingsToggleRow>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm w-full mt-4"
          onClick={onTestNotification}
        >
          Send test notification
        </button>
      </Card>
    </div>
  );
}


export function ShortcutsSettingsPanel() {
  return (
    <div className="space-y-5 sm:space-y-8 w-full min-w-0">
      <PanelHeader icon={KeyboardIcon} title="Keyboard shortcuts" />
      <Card>
        <p className="text-sm opacity-60 mb-4">
          Quick actions available in Zashly on desktop
        </p>
        <ul className="space-y-3">
          {SHORTCUTS.map(({ keys, action }) => (
            <li
              key={action}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-base-200/50 rounded-xl"
            >
              <span className="text-sm font-medium">{action}</span>
              <div className="flex flex-wrap gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="kbd kbd-sm bg-base-100 border-base-300"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function VideoSettingsPanel({
  settings,
  setSettings,
  mediaDevices,
  mediaPrefs,
  onMediaPrefChange,
}) {
  return (
    <div className="space-y-5 sm:space-y-8 w-full min-w-0">
      <PanelHeader icon={VideoIcon} title="Video & voice" />
      <Card>
        <h3 className="font-bold mb-4">Media devices</h3>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <VideoIcon className="size-4 opacity-70" /> Camera
            </label>
            <select
              className="select select-bordered w-full max-w-sm"
              value={mediaPrefs.videoId || ""}
              onChange={(e) => onMediaPrefChange("videoId", e.target.value)}
            >
              <option value="">Default Camera</option>
              {mediaDevices.cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera (${cam.deviceId.slice(0, 5)}...)`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MicIcon className="size-4 opacity-70" /> Microphone
            </label>
            <select
              className="select select-bordered w-full max-w-sm"
              value={mediaPrefs.audioId || ""}
              onChange={(e) => onMediaPrefChange("audioId", e.target.value)}
            >
              <option value="">Default Microphone</option>
              {mediaDevices.mics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone (${mic.deviceId.slice(0, 5)}...)`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Volume2Icon className="size-4 opacity-70" /> Speakers
            </label>
            <select
              className="select select-bordered w-full max-w-sm"
              value={mediaPrefs.speakerId || ""}
              onChange={(e) => onMediaPrefChange("speakerId", e.target.value)}
            >
              <option value="">Default Speakers</option>
              {mediaDevices.speakers.map((speaker) => (
                <option key={speaker.deviceId} value={speaker.deviceId}>
                  {speaker.label || `Speaker (${speaker.deviceId.slice(0, 5)}...)`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      <Card>
        <h3 className="font-bold mb-4">Call settings</h3>
        <div className="space-y-4">
          <SettingsToggleRow title="Enable HD Video" description="Send and receive up to 720p video">
             <SettingsToggle
               checked={settings?.appSettings?.video?.hdVideo !== false}
               onChange={(v) => {
                 setSettings(prev => ({
                   ...prev,
                   appSettings: {
                     ...prev.appSettings,
                     video: { ...(prev.appSettings?.video || {}), hdVideo: v }
                   }
                 }))
               }}
             />
          </SettingsToggleRow>
          <SettingsToggleRow title="Noise Suppression" description="Filter out background noise during calls">
             <SettingsToggle
               checked={settings?.appSettings?.video?.noiseSuppression !== false}
               onChange={(v) => {
                 setSettings(prev => ({
                   ...prev,
                   appSettings: {
                     ...prev.appSettings,
                     video: { ...(prev.appSettings?.video || {}), noiseSuppression: v }
                   }
                 }))
               }}
             />
          </SettingsToggleRow>
        </div>
      </Card>
    </div>
  );
}
