import React, { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { WifiOff, Wifi } from 'lucide-react';

type ConnectionState = 'online' | 'offline' | 'restored';

/**
 * Shows a banner when the user loses internet connection.
 * Slides in from the top with an amber warning when offline,
 * and briefly shows a green "Back online!" message when restored.
 */
export const OfflineIndicator: React.FC = () => {
  const [state, setState] = useState<ConnectionState>('online');
  const [visible, setVisible] = useState(false);
  const restoredTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);

  const handleOnline = useCallback(() => {
    if (wasOfflineRef.current) {
      setState('restored');
      wasOfflineRef.current = false;

      restoredTimeoutRef.current = setTimeout(() => {
        setVisible(false);
        // Allow exit animation to finish before resetting state
        setTimeout(() => {
          setState('online');
        }, 400);
      }, 2500);
    }
  }, []);

  const handleOffline = useCallback(() => {
    wasOfflineRef.current = true;
    setState('offline');
    setVisible(true);

    if (restoredTimeoutRef.current) {
      clearTimeout(restoredTimeoutRef.current);
      restoredTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (restoredTimeoutRef.current) {
        clearTimeout(restoredTimeoutRef.current);
      }
    };
  }, [handleOnline, handleOffline]);

  if (state === 'online' && !visible) return null;

  const isOffline = state === 'offline';
  const isRestored = state === 'restored';

  return (
    <div
      className={clsx(
        'fixed left-0 right-0 top-0 z-[10000] flex items-center justify-center',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : '-translate-y-full',
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={clsx(
          'flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium shadow-lg',
          isOffline && 'bg-amber-500 text-amber-950',
          isRestored && 'bg-emerald-500 text-white',
        )}
      >
        {isOffline && (
          <>
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>You&apos;re offline. Some features may be unavailable.</span>
          </>
        )}
        {isRestored && (
          <>
            <Wifi className="h-4 w-4 shrink-0" />
            <span>Back online!</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
