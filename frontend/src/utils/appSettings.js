export const DEFAULT_APP_SETTINGS = {
  general: {
    enterToSend: true,
    showOnlineStatus: true,
    showLinkPreviews: true,
    compactChatList: false,
  },
  notifications: {
    soundEnabled: true,
    desktopEnabled: true,
    messages: true,
    groups: true,
    moments: true,
    friendRequests: true,
  },
  media: {
    autoDownloadImages: false,
  },
};


export function mergeAppSettings(fromUser) {
  const src = fromUser?.appSettings || {};
  return {
    general: { ...DEFAULT_APP_SETTINGS.general, ...src.general },
    notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...src.notifications },
    media: { ...DEFAULT_APP_SETTINGS.media, ...src.media },
  };
}

export function buildSettingsState(authUser) {
  return {
    chatWallpaper: authUser?.chatWallpaper || "",
    privacySettings: {
      lastSeen: authUser?.privacySettings?.lastSeen || "everyone",
      readReceipts: authUser?.privacySettings?.readReceipts ?? true,
    },
    appSettings: mergeAppSettings(authUser),
  };
}


export function getNotificationPrefs(authUser) {
  return mergeAppSettings(authUser).notifications;
}

const MEDIA_PREFS_KEY = "zashly_media_device_prefs";

const DEFAULT_MEDIA_PREFS = {
  cameraId: "",
  micId: "",
  speakerId: "",
};

export function getMediaDevicePrefs() {
  try {
    const raw = localStorage.getItem(MEDIA_PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_MEDIA_PREFS, ...JSON.parse(raw) };
    }
  } catch {
    /* corrupted data – fall back to defaults */
  }
  return { ...DEFAULT_MEDIA_PREFS };
}

export function saveMediaDevicePrefs(prefs) {
  try {
    localStorage.setItem(MEDIA_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage full or unavailable */
  }
}
