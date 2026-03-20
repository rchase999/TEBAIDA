import React, { useState } from 'react';
import clsx from 'clsx';
import { Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

export interface AlertBannerProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const typeConfig: Record<NonNullable<AlertBannerProps['type']>, {
  icon: React.FC<{ className?: string }>;
  styles: string;
  iconColor: string;
}> = {
  info: {
    icon: Info,
    styles: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/40 dark:bg-blue-900/10 dark:text-blue-300',
    iconColor: 'text-blue-500',
  },
  success: {
    icon: CheckCircle,
    styles: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/10 dark:text-emerald-300',
    iconColor: 'text-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    styles: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
  error: {
    icon: XCircle,
    styles: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300',
    iconColor: 'text-red-500',
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  children,
  dismissible = false,
  action,
  className,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-xl border p-4',
        config.styles,
        className,
      )}
      role="alert"
    >
      <Icon className={clsx('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold mb-0.5">{title}</p>}
        <div className="text-sm">{children}</div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-semibold underline underline-offset-2 hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
