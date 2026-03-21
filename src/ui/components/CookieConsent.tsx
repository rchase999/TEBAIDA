import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Shield, X, Cookie, BarChart3, Settings2 } from 'lucide-react';

const STORAGE_KEY = 'debateforge-storage-consent';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: false,
  preferences: false,
};

export interface CookieConsentProps {
  className?: string;
  onAccept?: (preferences: ConsentPreferences) => void;
}

/**
 * Cookie/storage consent banner adapted for a desktop app.
 * Informs the user about local data storage and lets them manage preferences.
 * Only shown on first launch (checks localStorage). Fixed to bottom of screen
 * with a slide-up animation.
 */
export const CookieConsent: React.FC<CookieConsentProps> = ({
  className,
  onAccept,
}) => {
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so the slide-up animation is visible
        const t = setTimeout(() => setVisible(true), 300);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage not available — don't show
    }
  }, []);

  const dismiss = useCallback((prefs: ConsentPreferences) => {
    setDismissing(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
    onAccept?.(prefs);
    setTimeout(() => setVisible(false), 300);
  }, [onAccept]);

  const handleAcceptAll = useCallback(() => {
    dismiss({ essential: true, analytics: true, preferences: true });
  }, [dismiss]);

  const handleDecline = useCallback(() => {
    dismiss({ essential: true, analytics: false, preferences: false });
  }, [dismiss]);

  const handleSavePreferences = useCallback(() => {
    setShowManage(false);
    dismiss(preferences);
  }, [dismiss, preferences]);

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-[100]',
          'transition-transform duration-300 ease-out',
          dismissing ? 'translate-y-full' : 'translate-y-0',
          className,
        )}
      >
        <div className="mx-auto max-w-4xl px-4 pb-4">
          <div
            className={clsx(
              'rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-modal backdrop-blur-lg',
              'dark:border-surface-dark-3 dark:bg-surface-dark-1/95',
              'animate-slide-up',
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Icon + Text */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forge-100 dark:bg-forge-900/30">
                  <Shield className="h-5 w-5 text-forge-600 dark:text-forge-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Local Data Storage
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    DebateForge stores data locally to improve your experience.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDecline}
                  className={clsx(
                    'px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors',
                    'hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                  )}
                >
                  Decline
                </button>
                <button
                  onClick={() => setShowManage(true)}
                  className={clsx(
                    'rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium',
                    'text-gray-700 transition-colors hover:bg-gray-50',
                    'dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2',
                  )}
                >
                  Manage
                </button>
                <button
                  onClick={handleAcceptAll}
                  className={clsx(
                    'rounded-lg bg-forge-600 px-4 py-1.5 text-sm font-medium text-white',
                    'shadow-sm transition-colors hover:bg-forge-700 active:bg-forge-800',
                  )}
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Modal */}
      {showManage && (
        <div
          className={clsx(
            'fixed inset-0 z-[101] flex items-center justify-center p-4',
            'bg-black/50 backdrop-blur-sm animate-fade-in',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Manage storage preferences"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManage(false);
          }}
        >
          <div
            className={clsx(
              'w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-modal',
              'dark:border-surface-dark-3 dark:bg-surface-dark-1',
              'animate-slide-up',
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-surface-dark-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Storage Preferences
              </h2>
              <button
                onClick={() => setShowManage(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-3 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toggles */}
            <div className="divide-y divide-gray-100 px-6 dark:divide-surface-dark-3">
              {/* Essential */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <Cookie className="h-5 w-5 shrink-0 mt-0.5 text-forge-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Essential</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Required for core functionality. Always enabled.
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-forge-600 opacity-75 transition-colors"
                  role="switch"
                  aria-checked={true}
                  aria-label="Essential storage"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm transition-transform" />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Analytics</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Debate statistics, usage patterns, and performance data.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                  className={clsx(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    preferences.analytics ? 'bg-forge-600' : 'bg-gray-300 dark:bg-surface-dark-4',
                  )}
                  role="switch"
                  aria-checked={preferences.analytics}
                  aria-label="Analytics storage"
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                      preferences.analytics ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Preferences */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <Settings2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Preferences</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Theme choices, layout settings, and customizations.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreferences((p) => ({ ...p, preferences: !p.preferences }))}
                  className={clsx(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    preferences.preferences ? 'bg-forge-600' : 'bg-gray-300 dark:bg-surface-dark-4',
                  )}
                  role="switch"
                  aria-checked={preferences.preferences}
                  aria-label="Preferences storage"
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                      preferences.preferences ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-surface-dark-3">
              <button
                onClick={() => setShowManage(false)}
                className={clsx(
                  'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium',
                  'text-gray-700 transition-colors hover:bg-gray-50',
                  'dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2',
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                className={clsx(
                  'rounded-lg bg-forge-600 px-4 py-2 text-sm font-medium text-white',
                  'shadow-sm transition-colors hover:bg-forge-700 active:bg-forge-800',
                )}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
