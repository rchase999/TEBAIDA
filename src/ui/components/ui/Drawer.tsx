import React, { useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg' | 'full';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const widthStyles: Record<NonNullable<DrawerProps['width']>, string> = {
  sm: 'max-w-sm w-full',
  md: 'max-w-md w-full',
  lg: 'max-w-lg w-full',
  full: 'w-full',
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  side = 'right',
  width = 'md',
  title,
  children,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  // Focus trap
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus the panel after opening
    const timer = setTimeout(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      clearTimeout(timer);
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  // Focus trap: cycle within the drawer
  useEffect(() => {
    if (!open) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  const isLeft = side === 'left';

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex',
        isLeft ? 'justify-start' : 'justify-end',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Drawer'}
    >
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={clsx(
          'absolute inset-0 bg-black/40 backdrop-blur-sm',
          'motion-safe:animate-fade-in',
        )}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={clsx(
          'relative z-10 flex flex-col bg-white shadow-2xl',
          'dark:bg-surface-dark-1 dark:border-surface-dark-3',
          isLeft ? 'border-r' : 'border-l',
          'border-gray-200 dark:border-surface-dark-3',
          widthStyles[width],
          isLeft
            ? 'motion-safe:animate-slide-in-left'
            : 'motion-safe:animate-slide-in-right',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-surface-dark-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title || '\u00A0'}
          </h2>
          <button
            onClick={onClose}
            className={clsx(
              'rounded-lg p-1.5 text-gray-400 transition-colors',
              'hover:bg-gray-100 hover:text-gray-600',
              'dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
            )}
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
