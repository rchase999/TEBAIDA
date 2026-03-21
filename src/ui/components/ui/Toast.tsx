import React, { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
}

export interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Style Maps
// ──────────────────────────────────────────────────────────────────────────────

const iconMap: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const typeStyles: Record<ToastType, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-200',
  error:
    'border-red-200 bg-red-50 text-red-900 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-200',
  info:
    'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-200',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-emerald-500 dark:text-emerald-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-blue-500 dark:text-blue-400',
};

const progressColorMap: Record<ToastType, string> = {
  success: 'bg-emerald-500 dark:bg-emerald-400',
  error: 'bg-red-500 dark:bg-red-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  info: 'bg-blue-500 dark:bg-blue-400',
};

// ──────────────────────────────────────────────────────────────────────────────
// Imperative toast() API
// ──────────────────────────────────────────────────────────────────────────────

type ToastFn = (message: string, type?: ToastType, options?: ToastOptions) => string;
type DismissFn = (id: string) => void;

let _globalToast: ToastFn | null = null;
let _globalDismiss: DismissFn | null = null;

/**
 * Show a toast notification imperatively.
 * Requires `<ToastContainer />` to be mounted somewhere in the React tree.
 *
 * @example
 * toast('File saved!', 'success');
 * toast('Something went wrong', 'error', { duration: 8000 });
 */
export function toast(
  message: string,
  type: ToastType = 'info',
  options?: ToastOptions,
): string {
  if (!_globalToast) {
    console.warn('[Toast] ToastContainer is not mounted. Cannot show toast.');
    return '';
  }
  return _globalToast(message, type, options);
}

toast.dismiss = (id: string) => {
  _globalDismiss?.(id);
};

// ──────────────────────────────────────────────────────────────────────────────
// Single Toast Item Component
// ──────────────────────────────────────────────────────────────────────────────

interface ToastItemComponentProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastItemComponent: React.FC<ToastItemComponentProps> = ({ item, onDismiss }) => {
  const [exiting, setExiting] = useState(false);
  const Icon = iconMap[item.type];
  const duration = item.duration ?? 5000;

  const handleDismiss = useCallback(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onDismiss(item.id);
      return;
    }
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 200);
  }, [item.id, onDismiss]);

  return (
    <div
      className={clsx(
        'group relative flex items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg',
        'w-96 max-w-[calc(100vw-2rem)]',
        'backdrop-blur-sm',
        typeStyles[item.type],
        exiting
          ? 'motion-safe:animate-[slideOutRight_0.2s_ease-in_forwards]'
          : 'motion-safe:animate-slide-in-right',
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <style>{`
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }
      `}</style>

      <Icon className={clsx('h-5 w-5 shrink-0 mt-0.5', iconColorMap[item.type])} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.message}</p>
        {item.description && (
          <p className="mt-0.5 text-xs opacity-75">{item.description}</p>
        )}
        {item.action && (
          <button
            onClick={() => {
              item.action!.onClick();
              handleDismiss();
            }}
            className="mt-1.5 text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
          >
            {item.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className={clsx(
          'shrink-0 rounded-lg p-1 opacity-40 transition-opacity',
          'hover:opacity-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:opacity-100',
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Auto-dismiss shrinking progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5">
        <div
          className={clsx(
            'h-full',
            progressColorMap[item.type],
          )}
          style={{
            animation: `progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Toast Container
// ──────────────────────────────────────────────────────────────────────────────

export interface ToastContainerProps {
  /** Optional max toasts visible at once. Default 3. */
  maxToasts?: number;
}

let toastIdCounter = 0;

export const ToastContainer: React.FC<ToastContainerProps> = ({ maxToasts = 3 }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions): string => {
      const id = `toast-ui-${++toastIdCounter}`;
      const duration = options?.duration ?? 5000;

      const item: ToastItem = {
        id,
        type,
        message,
        description: options?.description,
        action: options?.action,
        duration,
      };

      setToasts((prev) => {
        const next = [...prev, item];
        return next.slice(-maxToasts);
      });

      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss, maxToasts],
  );

  // Register/unregister global functions
  useEffect(() => {
    _globalToast = show;
    _globalDismiss = dismiss;
    return () => {
      _globalToast = null;
      _globalDismiss = null;
    };
  }, [show, dismiss]);

  // Cleanup all timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach((t) => clearTimeout(t));
      currentTimers.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItemComponent key={t.id} item={t} onDismiss={dismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
