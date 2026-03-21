import React, { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  closable?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const defaultIcons: Record<AlertVariant, React.FC<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const variantStyles: Record<AlertVariant, string> = {
  info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/15',
  success: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/15',
  warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/15',
  error: 'border-l-red-500 bg-red-50 dark:bg-red-900/15',
};

const iconStyles: Record<AlertVariant, string> = {
  info: 'text-blue-500 dark:text-blue-400',
  success: 'text-emerald-500 dark:text-emerald-400',
  warning: 'text-amber-500 dark:text-amber-400',
  error: 'text-red-500 dark:text-red-400',
};

const titleStyles: Record<AlertVariant, string> = {
  info: 'text-blue-800 dark:text-blue-200',
  success: 'text-emerald-800 dark:text-emerald-200',
  warning: 'text-amber-800 dark:text-amber-200',
  error: 'text-red-800 dark:text-red-200',
};

const descriptionStyles: Record<AlertVariant, string> = {
  info: 'text-blue-700 dark:text-blue-300',
  success: 'text-emerald-700 dark:text-emerald-300',
  warning: 'text-amber-700 dark:text-amber-300',
  error: 'text-red-700 dark:text-red-300',
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  closable = false,
  onClose,
  icon,
  action,
  className,
  children,
}) => {
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setDismissing(true);
  }, []);

  useEffect(() => {
    if (!dismissing) return;

    const el = alertRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setVisible(false);
      onClose?.();
      return;
    }

    const onEnd = () => {
      setVisible(false);
      onClose?.();
    };

    el.addEventListener('animationend', onEnd, { once: true });
    return () => el.removeEventListener('animationend', onEnd);
  }, [dismissing, onClose]);

  if (!visible) return null;

  const DefaultIcon = defaultIcons[variant];
  const renderedIcon = icon ?? <DefaultIcon className={clsx('h-5 w-5 shrink-0', iconStyles[variant])} />;

  return (
    <div
      ref={alertRef}
      role="alert"
      aria-live="polite"
      className={clsx(
        'relative flex items-start gap-3 rounded-lg border border-transparent border-l-4 p-4',
        'transition-all duration-200',
        variantStyles[variant],
        dismissing && 'animate-[fadeOut_0.25s_ease-out_forwards]',
        !dismissing && 'motion-safe:animate-fade-in',
        className,
      )}
      style={
        dismissing
          ? {
              animation: 'fadeOut 0.25s ease-out forwards',
            }
          : undefined
      }
    >
      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>

      <span className="mt-0.5 shrink-0">{renderedIcon}</span>

      <div className="flex-1 min-w-0">
        {title && (
          <p className={clsx('text-sm font-semibold', titleStyles[variant])}>
            {title}
          </p>
        )}
        {description && (
          <p className={clsx('text-sm', title && 'mt-1', descriptionStyles[variant])}>
            {description}
          </p>
        )}
        {children && (
          <div className={clsx('text-sm', (title || description) && 'mt-1', descriptionStyles[variant])}>
            {children}
          </div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {closable && (
        <button
          onClick={handleClose}
          className={clsx(
            'shrink-0 rounded-md p-1 transition-colors',
            'hover:bg-black/10 dark:hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            titleStyles[variant],
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
