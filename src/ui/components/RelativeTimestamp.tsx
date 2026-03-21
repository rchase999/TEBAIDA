import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';

export interface RelativeTimestampProps {
  /** The date to display. Accepts an ISO string or a Date object. */
  date: string | Date;
  /** Additional CSS classes */
  className?: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Computes a human-friendly relative time string.
 * - "Just now" (< 60s)
 * - "2m ago" (< 60min)
 * - "1h ago" (< 24h)
 * - "Yesterday" (24-48h)
 * - "3 days ago" (2-6 days)
 * - "Mar 15" (7+ days in current year)
 * - "Mar 15, 2024" (different year)
 */
function getRelativeTime(input: string | Date): string {
  try {
    const date = input instanceof Date ? input : new Date(input);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 0) return 'Just now';
    if (diffSecs < 60) return 'Just now';

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    // Older dates: show "Mar 15" or "Mar 15, 2024"
    const month = MONTH_NAMES[date.getMonth()];
    const day = date.getDate();
    if (date.getFullYear() === now.getFullYear()) {
      return `${month} ${day}`;
    }
    return `${month} ${day}, ${date.getFullYear()}`;
  } catch {
    return typeof input === 'string' ? input : '';
  }
}

/**
 * Formats the full date and time for the tooltip.
 */
function formatExactDatetime(input: string | Date): string {
  try {
    const date = input instanceof Date ? input : new Date(input);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return typeof input === 'string' ? input : '';
  }
}

/**
 * Smart relative timestamp component.
 * Shows human-friendly relative times that update automatically every minute.
 * Hover shows the exact datetime in a native tooltip.
 */
export const RelativeTimestamp: React.FC<RelativeTimestampProps> = ({
  date,
  className,
}) => {
  const [relative, setRelative] = useState(() => getRelativeTime(date));

  useEffect(() => {
    setRelative(getRelativeTime(date));
    const interval = setInterval(() => {
      setRelative(getRelativeTime(date));
    }, 60_000);
    return () => clearInterval(interval);
  }, [date]);

  const isoString = useMemo(() => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString();
    } catch {
      return typeof date === 'string' ? date : '';
    }
  }, [date]);

  const exactDatetime = useMemo(() => formatExactDatetime(date), [date]);

  return (
    <time
      dateTime={isoString}
      title={exactDatetime}
      className={clsx(
        'inline text-inherit tabular-nums whitespace-nowrap',
        className,
      )}
    >
      {relative}
    </time>
  );
};

export default RelativeTimestamp;
