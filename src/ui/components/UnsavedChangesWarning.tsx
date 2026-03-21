import React, { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { AlertTriangle, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that tracks dirty state and provides a way to show a confirmation
 * modal when the user attempts to navigate away with unsaved changes.
 *
 * @param isDirty - Whether there are unsaved changes.
 * @returns An object with `showWarning`, `confirm`, and `cancel` helpers,
 *          plus the `WarningModal` component to render.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const [showWarning, setShowWarning] = useState(false);
  const resolveRef = useRef<((discard: boolean) => void) | null>(null);

  // Warn on browser/Electron window close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /**
   * Call this before a navigation or destructive action.
   * Returns a promise that resolves to `true` if the user chose to discard,
   * or `false` if they chose to keep editing.
   */
  const confirmNavigation = useCallback((): Promise<boolean> => {
    if (!isDirty) return Promise.resolve(true);

    setShowWarning(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, [isDirty]);

  const handleDiscard = useCallback(() => {
    setShowWarning(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleKeepEditing = useCallback(() => {
    setShowWarning(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return {
    showWarning,
    confirmNavigation,
    handleDiscard,
    handleKeepEditing,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface UnsavedChangesWarningProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Called when user clicks "Discard Changes". */
  onDiscard: () => void;
  /** Called when user clicks "Keep Editing". */
  onKeepEditing: () => void;
}

/**
 * A modal warning about unsaved changes with backdrop blur.
 */
export const UnsavedChangesWarning: React.FC<UnsavedChangesWarningProps> = ({
  isOpen,
  onDiscard,
  onKeepEditing,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onKeepEditing();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onKeepEditing]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onKeepEditing();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-[9998] flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'animate-fade-in',
      )}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-desc"
    >
      <div
        className={clsx(
          'w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl',
          'dark:border-surface-dark-3 dark:bg-surface-dark-1',
          'animate-slide-up',
        )}
      >
        {/* Close button */}
        <button
          onClick={onKeepEditing}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-3 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Title */}
        <h2
          id="unsaved-changes-title"
          className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Unsaved Changes
        </h2>

        {/* Description */}
        <p
          id="unsaved-changes-desc"
          className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
        >
          You have unsaved changes that will be lost.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onDiscard}
            className={clsx(
              'flex-1 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors duration-150',
              'hover:bg-red-50 active:bg-red-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
              'dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:active:bg-red-900/40',
              'dark:focus-visible:ring-offset-surface-dark-0',
            )}
          >
            Discard Changes
          </button>
          <button
            onClick={onKeepEditing}
            className={clsx(
              'flex-1 rounded-lg bg-forge-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150',
              'hover:bg-forge-700 active:bg-forge-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
              'dark:focus-visible:ring-offset-surface-dark-0',
            )}
          >
            Keep Editing
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesWarning;
