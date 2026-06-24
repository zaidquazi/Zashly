/**
 * Platform detection utility for Zashly.
 * Detects whether the app is running in a Capacitor native context
 * (Android/iOS WebView) or a regular web browser.
 *
 * SAFE to import anywhere — gracefully handles environments where
 * the Capacitor global is not yet available.
 */

/**
 * Returns true if running inside a Capacitor native container.
 */
export function isNative() {
  return (
    typeof window !== 'undefined' &&
    !!(window.Capacitor?.isNativePlatform?.() || window.Capacitor?.isNative)
  );
}

/**
 * Returns true if running on Android (native or web-on-Android).
 */
export function isAndroid() {
  if (isNative()) {
    return window.Capacitor?.getPlatform?.() === 'android';
  }
  return /android/i.test(navigator.userAgent);
}

/**
 * Returns true if running on iOS native.
 */
export function isIOS() {
  if (isNative()) {
    return window.Capacitor?.getPlatform?.() === 'ios';
  }
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Returns true if running in a standard web browser (not native).
 */
export function isWeb() {
  return !isNative();
}

/**
 * Returns the platform string: 'android' | 'ios' | 'web'
 */
export function getPlatform() {
  if (isNative()) {
    return window.Capacitor?.getPlatform?.() || 'web';
  }
  return 'web';
}

/**
 * The production backend URL for API calls.
 * In Capacitor native mode, relative paths ("/api") don't work
 * because the app is served from file://.
 * We need an absolute URL to the backend.
 */
export function getApiBaseUrl() {
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '';

  // In native mode, we MUST use an absolute URL
  if (isNative()) {
    if (envUrl) {
      // Normalize: strip trailing /api if present, then add /api
      const base = envUrl.replace(/\/api\/?$/, '');
      return `${base}/api`;
    }
    // Fallback — should be overridden via VITE_API_URL in production
    console.warn('[Platform] VITE_API_URL not set! Native API calls will fail.');
    return 'http://localhost:5002/api';
  }

  // Web mode: use env URL or fall back to relative proxy
  if (envUrl) {
    const base = envUrl.replace(/\/api\/?$/, '');
    return `${base}/api`;
  }
  return '/api';
}

/**
 * The WebSocket (Socket.IO) base URL.
 * In Capacitor, we need an absolute URL.
 */
export function getSocketUrl() {
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
    '';

  if (isNative()) {
    if (envUrl) {
      return envUrl.replace(/\/api\/?$/, '');
    }
    console.warn('[Platform] VITE_API_URL not set! Native Socket.IO will fail.');
    return 'http://localhost:5002';
  }

  // Web: use window origin (proxy handles routing to backend)
  return envUrl.replace(/\/api\/?$/, '') || '/';
}
