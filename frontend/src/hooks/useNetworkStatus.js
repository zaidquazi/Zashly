import { useEffect, useState, useCallback } from 'react';
import { isNative } from '../lib/platform';

/**
 * useNetworkStatus
 *
 * Provides real-time network connectivity status.
 * - In Capacitor native: uses @capacitor/network for reliable detection
 * - In web: uses navigator.onLine + online/offline events
 *
 * Returns:
 *   isOnline: boolean
 *   connectionType: 'wifi' | 'cellular' | 'none' | 'unknown'
 */
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setConnectionType('none');
  }, []);

  useEffect(() => {
    let cleanup = null;

    const setup = async () => {
      if (isNative()) {
        try {
          const { Network } = await import('@capacitor/network');

          // Get current status
          const status = await Network.getStatus();
          setIsOnline(status.connected);
          setConnectionType(status.connectionType);

          // Listen for changes
          const listener = await Network.addListener('networkStatusChange', (status) => {
            setIsOnline(status.connected);
            setConnectionType(status.connectionType);
          });

          cleanup = () => listener.remove();
        } catch (err) {
          console.warn('[useNetworkStatus] Network plugin error:', err.message);
          // Fall through to web implementation
          setupWebListeners();
        }
      } else {
        setupWebListeners();
      }
    };

    const setupWebListeners = () => {
      setIsOnline(navigator.onLine);
      setConnectionType(navigator.onLine ? 'unknown' : 'none');

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      cleanup = () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    };

    setup();

    return () => {
      if (cleanup) cleanup();
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, connectionType };
};

export default useNetworkStatus;
