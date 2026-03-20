import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

export interface RelativeTimeProps {
  date: string;
  className?: string;
  showTooltip?: boolean;
}

function getRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Displays a relative timestamp that auto-updates every minute.
 * Hover shows the full date in a tooltip.
 */
export const RelativeTime: React.FC<RelativeTimeProps> = ({
  date,
  className,
  showTooltip = true,
}) => {
  const [relative, setRelative] = useState(() => getRelativeTime(date));

  useEffect(() => {
    setRelative(getRelativeTime(date));
    const interval = setInterval(() => {
      setRelative(getRelativeTime(date));
    }, 60000);
    return () => clearInterval(interval);
  }, [date]);

  return (
    <time
      dateTime={date}
      title={showTooltip ? formatFullDate(date) : undefined}
      className={clsx('tabular-nums', className)}
    >
      {relative}
    </time>
  );
};

export default RelativeTime;
