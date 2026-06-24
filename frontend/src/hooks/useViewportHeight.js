import { useEffect } from 'react';
import { isNative } from '../lib/platform';

/**
 * useViewportHeight (Enhanced for Android + Capacitor)
 *
 * Manages the actual visual viewport height to prevent layout
 * issues when the Android keyboard opens/closes.
 *
 * Sets --app-height and --keyboard-height CSS custom properties.
 *
 * Priority order:
 *  1. Capacitor Keyboard plugin events (most accurate for Android)
 *  2. visualViewport API (good for modern browsers/WebView)
 *  3. window.resize fallback
 */
const useViewportHeight = () => {
  useEffect(() => {
    let capacitorCleanup = null;

    const setHeights = (viewportHeight, keyboardHeight = 0) => {
      document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      document.documentElement.style.setProperty(
        '--safe-bottom',
        `${Math.max(keyboardHeight, 0)}px`
      );
    };

    const getViewportHeight = () => {
      return window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
    };

    // ── Initial set ────────────────────────────────────────────────────────
    setHeights(getViewportHeight(), 0);

    const setupCapacitorKeyboard = async () => {
      if (!isNative()) return false;

      try {
        const { Keyboard } = await import('@capacitor/keyboard');

        const showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          const kbHeight = info.keyboardHeight || 0;
          const totalHeight = window.innerHeight;
          const viewportHeight = totalHeight - kbHeight;
          setHeights(viewportHeight, kbHeight);

          // Add class for CSS-level keyboard-open detection
          document.body.classList.add('keyboard-open');
          document.body.style.setProperty('--keyboard-height', `${kbHeight}px`);
        });

        const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setHeights(window.innerHeight, 0);
          document.body.classList.remove('keyboard-open');
          document.body.style.setProperty('--keyboard-height', '0px');
        });

        const didHideListener = await Keyboard.addListener('keyboardDidHide', () => {
          // Extra safety: re-set after animation completes
          setHeights(window.innerHeight, 0);
        });

        capacitorCleanup = () => {
          showListener.remove();
          hideListener.remove();
          didHideListener.remove();
        };

        return true;
      } catch (err) {
        console.warn('[useViewportHeight] Keyboard plugin not available:', err.message);
        return false;
      }
    };

    // ── Setup Capacitor or fall back to visualViewport ─────────────────────
    setupCapacitorKeyboard().then((hasCapacitor) => {
      if (hasCapacitor) return; // Capacitor keyboard handles it

      // VisualViewport API (works in Chrome/WebView without Capacitor)
      const onVisualViewportChange = () => {
        const vpHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = Math.max(0, windowHeight - vpHeight);
        setHeights(vpHeight, keyboardHeight);

        if (keyboardHeight > 0) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onVisualViewportChange);
        window.visualViewport.addEventListener('scroll', onVisualViewportChange);
        onVisualViewportChange();

        capacitorCleanup = () => {
          window.visualViewport.removeEventListener('resize', onVisualViewportChange);
          window.visualViewport.removeEventListener('scroll', onVisualViewportChange);
        };
      } else {
        // Absolute fallback
        const onResize = () => setHeights(window.innerHeight, 0);
        window.addEventListener('resize', onResize);
        capacitorCleanup = () => window.removeEventListener('resize', onResize);
      }
    });

    return () => {
      if (capacitorCleanup) capacitorCleanup();
    };
  }, []);
};

export default useViewportHeight;
