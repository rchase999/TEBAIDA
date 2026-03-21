import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { X, Info, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export interface AnnouncementBarProps {
  message: string;
  link?: string;
  linkText?: string;
  variant?: 'info' | 'success' | 'warning';
  onDismiss?: () => void;
  className?: string;
}

/**
 * Simple hash function to create a localStorage key from the message text.
 */
function hashMessage(msg: string): string {
  let hash = 0;
  for (let i = 0; i < msg.length; i++) {
    const char = msg.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `debateforge-announcement-${hash}`;
}

const variantConfig: Record<
  NonNullable<AnnouncementBarProps['variant']>,
  {
    icon: React.FC<{ className?: string }>;
    bg: string;
    text: string;
    closeHover: string;
  }
> = {
  info: {
    icon: Info,
    bg: 'bg-gradient-to-r from-blue-500 to-forge-500 dark:from-blue-600 dark:to-forge-600',
    text: 'text-white',
    closeHover: 'hover:bg-white/20',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600',
    text: 'text-white',
    closeHover: 'hover:bg-white/20',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600',
    text: 'text-white',
    closeHover: 'hover:bg-white/20',
  },
};

/**
 * Dismissible announcement bar pinned above the main content.
 * Remembers dismissal in localStorage keyed by a hash of the message.
 * Slides down on mount and up on dismiss.
 */
export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message,
  link,
  linkText,
  variant = 'info',
  onDismiss,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const storageKey = hashMessage(message);

  useEffect(() => {
    try {
      const wasDismissed = localStorage.getItem(storageKey);
      if (wasDismissed) return;
    } catch {
      // localStorage unavailable
    }
    // Small delay so slide-down animation fires after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    setDismissing(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // ignore
    }
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300);
  }, [storageKey, onDismiss]);

  if (!visible) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'relative z-40 w-full overflow-hidden',
        config.bg,
        config.text,
        'transition-all duration-300 ease-out',
        dismissing
          ? 'max-h-0 opacity-0 -translate-y-full'
          : 'max-h-14 opacity-100 translate-y-0',
        className,
      )}
      role="status"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-10 py-2 text-center">
        <Icon className="h-4 w-4 shrink-0 opacity-90" />
        <p className="text-sm font-medium truncate">
          {message}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-0.5 underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
            >
              {linkText || 'Learn more'}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className={clsx(
          'absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors',
          'opacity-70 hover:opacity-100',
          config.closeHover,
        )}
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
