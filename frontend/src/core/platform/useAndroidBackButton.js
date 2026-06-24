import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isNative } from '../lib/platform';

/**
 * useAndroidBackButton
 *
 * Handles the Android hardware back button with this priority:
 *  1. Close any open modal (searched in DOM for [data-modal-open])
 *  2. Close any open drawer
 *  3. Navigate back in history
 *  4. Exit app only if on a root screen (to prevent accidental exit)
 *
 * Works in both Capacitor native AND web (keyboard Escape key on desktop).
 */
const ROOT_PATHS = ['/app', '/friends', '/groups', '/calls', '/notifications', '/settings', '/admin'];

const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const exitConfirmRef = useRef(false);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    if (!isNative()) return; // Only needed for native Android

    let App;
    let Toast;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');

        const handler = await App.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname;

          // ── 1. Check for open modals (DaisyUI or custom) ──────────────
          const openModal = document.querySelector(
            '.modal-open, [data-modal="open"], [aria-modal="true"][aria-hidden="false"]'
          );
          if (openModal) {
            // Dispatch Escape key to close modal
            openModal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            // Also look for a close button
            const closeBtn = openModal.querySelector('[data-modal-close], .modal-backdrop, [aria-label="Close"]');
            if (closeBtn) closeBtn.click();
            return;
          }

          // ── 2. Check for open drawers/sheets ──────────────────────────
          const openDrawer = document.querySelector('[data-drawer="open"], .drawer-toggle:checked');
          if (openDrawer) {
            if (openDrawer.type === 'checkbox') {
              openDrawer.checked = false;
              openDrawer.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return;
          }

          // ── 3. Check for open overlays / panels (group info, etc.) ────
          const openPanel = document.querySelector('[data-panel="open"]');
          if (openPanel) {
            openPanel.dataset.panel = 'closed';
            openPanel.dispatchEvent(new CustomEvent('panel:close'));
            return;
          }

          // ── 4. If we can go back in history, go back ──────────────────
          if (canGoBack) {
            navigate(-1);
            return;
          }

          // ── 5. Root screen — ask for exit confirmation ─────────────────
          const isRoot = ROOT_PATHS.some((p) => currentPath === p || currentPath === '/');
          if (isRoot) {
            if (exitConfirmRef.current) {
              // Second press — exit app
              App.exitApp();
              return;
            }

            exitConfirmRef.current = true;

            // Show "Press back again to exit" using dynamic import of toast
            import('react-hot-toast').then(({ default: toast }) => {
              toast('Press back again to exit', { icon: '⬅️', duration: 2000 });
            });

            // Reset after 2 seconds
            clearTimeout(exitTimerRef.current);
            exitTimerRef.current = setTimeout(() => {
              exitConfirmRef.current = false;
            }, 2000);
          } else {
            // Not root, not in history — navigate to home
            navigate('/app', { replace: true });
          }
        });

        return () => {
          handler.remove();
          clearTimeout(exitTimerRef.current);
        };
      } catch (err) {
        console.warn('[useAndroidBackButton] Capacitor App plugin not available:', err.message);
      }
    };

    const cleanup = setupBackButton();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [navigate, location.pathname]);
};

export default useAndroidBackButton;
