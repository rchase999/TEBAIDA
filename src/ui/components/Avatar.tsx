import React from 'react';
import clsx from 'clsx';

export interface AvatarProps {
  name?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

const sizeStyles: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

/**
 * Generates a deterministic HSL color from a string.
 */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/**
 * Extracts initials from a name string (up to 2 characters).
 */
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
  className,
}) => {
  const bgColor = color ?? (name ? stringToColor(name) : '#6b7280');

  return (
    <div
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none',
        sizeStyles[size],
        className,
      )}
      style={{ backgroundColor: bgColor }}
      aria-label={name}
      title={name}
    >
      {icon ? icon : name ? getInitials(name) : '?'}
    </div>
  );
};

export default Avatar;
