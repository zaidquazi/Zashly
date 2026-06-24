import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import useNetworkStatus from '../hooks/useNetworkStatus';

/**
 * NetworkStatusBar
 *
 * Non-intrusive banner that shows when the device goes offline.
 * Animates in from the top with a smooth slide-down.
 * Auto-dismisses when connection is restored.
 */
const NetworkStatusBar = () => {
  const { isOnline, connectionType } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', paddingTop: 'max(10px, env(safe-area-inset-top))' }}
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="size-4 flex-shrink-0" />
          <span>No internet connection</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusBar;
