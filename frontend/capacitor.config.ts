import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.zashly.app',
  appName: 'Zashly',
  webDir: 'dist',
  // ─── Server Configuration ──────────────────────────────────────────────────
  // During development, you can uncomment "url" to point to your local dev server.
  // For production builds, remove "url" so the app serves from the bundled dist/.
  server: {
    // url: 'http://192.168.x.x:5173', // Your local dev server IP for live reload
    androidScheme: 'https',
    cleartext: false, // Disable cleartext in production; use https
    allowNavigation: [],
  },
  // ─── Android Platform Configuration ───────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    // Enable mixed content for WebRTC / LiveKit
    allowMixedContent: false,
    // Override back button behavior (handled in JS via useAndroidBackButton)
    captureInput: true,
    // Web views with hardware acceleration for smooth rendering
    webContentsDebuggingEnabled: false, // Set true only for debug builds
    loggingBehavior: 'none',
  },
  // ─── Plugin Configurations ─────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false, // We hide it manually after app is ready
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.None,
      resizeOnFullScreen: false,
      style: KeyboardStyle.Dark,
      // KeyboardResize.None prevents the Android system from resizing the WebView body.
      // The useViewportHeight JS hook manages --app-height / --keyboard-height
      // via Capacitor Keyboard events, avoiding the double-shrink blank space bug.
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // Allow picking from gallery
      saveToGallery: false,
    },
    // App plugin — handles back button, app state, deep links
    App: {
      // Nothing extra needed — defaults work
    },
  },
};

export default config;
