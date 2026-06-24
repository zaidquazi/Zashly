/**
 * Push Notifications utility for Zashly Android.
 *
 * Handles:
 *  - FCM registration in Capacitor native environment
 *  - Token registration with Zashly backend
 *  - Foreground notification handling (routing to correct screen)
 *  - Background notification tap handling (deep link navigation)
 */

import { isNative } from './platform';
import { navigateTo } from './navigation';

let _isRegistered = false;
let _listenerCleanup = null;

/**
 * Register push notifications with FCM and Zashly backend.
 * Call this after user authentication succeeds.
 *
 * @param {string} userId - The authenticated user's ID
 * @param {Function} registerTokenFn - API function to register FCM token with backend
 */
export async function registerPushNotifications(userId, registerTokenFn) {
  if (!isNative()) return; // Web uses browser Notification API — handled in useNotifications.js
  if (_isRegistered) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // ── 1. Request permission ──────────────────────────────────────────────
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('[Push] Notification permission not granted');
      return;
    }

    // ── 2. Register with FCM ───────────────────────────────────────────────
    await PushNotifications.register();

    // ── 3. Get FCM token and send to backend ───────────────────────────────
    const tokenListener = await PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] FCM token registered:', token.value?.slice(0, 20) + '...');
      try {
        if (registerTokenFn) {
          await registerTokenFn({ fcmToken: token.value, platform: 'android' });
        }
      } catch (err) {
        console.warn('[Push] Failed to register token with backend:', err.message);
      }
    });

    // ── 4. Handle registration errors ─────────────────────────────────────
    const errorListener = await PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Registration error:', err);
    });

    // ── 5. Handle foreground notifications ────────────────────────────────
    const foregroundListener = await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('[Push] Foreground notification received:', notification.title);
        // In foreground, the notification is already shown by Stream Chat / socket events
        // No action needed — in-app toast/notification system handles this
      }
    );

    // ── 6. Handle notification tap (app was in background/closed) ─────────
    const actionListener = await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        const data = action.notification?.data || {};
        console.log('[Push] Notification tapped, navigating...', data);
        handleNotificationNavigation(data);
      }
    );

    _isRegistered = true;
    _listenerCleanup = () => {
      tokenListener.remove();
      errorListener.remove();
      foregroundListener.remove();
      actionListener.remove();
      _isRegistered = false;
    };

    console.log('[Push] Push notification setup complete');
  } catch (err) {
    console.error('[Push] Setup failed:', err.message);
  }
}

/**
 * Navigate to the correct screen based on push notification data.
 */
function handleNotificationNavigation(data) {
  if (!data) return;

  const { type, channelId, userId, groupId } = data;

  switch (type) {
    case 'message':
      if (userId) navigateTo(`/chat/${userId}`);
      else if (groupId) navigateTo(`/group/${groupId}`);
      else if (channelId) navigateTo(`/group/${channelId}`);
      break;
    case 'friend_request':
      navigateTo('/notifications');
      break;
    case 'call':
      // Call overlay handles this via socket
      break;
    case 'moment_like':
    case 'moment_comment':
    case 'like':
    case 'comment':
      navigateTo('/notifications');
      break;
    default:
      navigateTo('/notifications');
  }
}

/**
 * Unregister push notifications (on logout).
 */
export async function unregisterPushNotifications() {
  if (_listenerCleanup) {
    _listenerCleanup();
    _listenerCleanup = null;
  }

  if (!isNative()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.unregister();
  } catch (err) {
    console.warn('[Push] Failed to unregister:', err.message);
  }
}
