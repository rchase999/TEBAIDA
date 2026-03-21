import React from 'react';
import clsx from 'clsx';

export interface AvatarProps {
  name?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  status?: 'online' | 'idle' | 'offline';
  className?: string;
}

const sizeStyles: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

const statusColors: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  offline: 'bg-gray-400',
};

const statusSizes: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  color,
  size = 'md',
  icon,
  status,
  className,
}) => {
  const bgColor = color ?? (name ? stringToColor(name) : '#6b7280');

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={clsx(
          'inline-flex items-center justify-center rounded-full font-semibold text-white select-none shadow-sm',
          sizeStyles[size],
          className,
        )}
        style={{ backgroundColor: bgColor }}
        aria-label={name}
        title={name}
      >
        {icon ? icon : name ? getInitials(name) : '?'}
      </div>
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-surface-dark-1',
            statusColors[status],
            statusSizes[size],
          )}
        />
      )}
    </div>
  );
};

/* --- Avatar Group (stacked) --- */

export interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  names,
  max = 4,
  size = 'sm',
  className,
}) => {
  const visible = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {visible.map((name, i) => (
        <Avatar
          key={`${name}-${i}`}
          name={name}
          size={size}
          className="ring-2 ring-white dark:ring-surface-dark-1"
        />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'inline-flex items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-600 ring-2 ring-white dark:bg-surface-dark-3 dark:text-gray-400 dark:ring-surface-dark-1',
            sizeStyles[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default Avatar;
