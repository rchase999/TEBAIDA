import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps {
  variant: 'text' | 'avatar' | 'card' | 'chart' | 'table';
  count?: number;
  className?: string;
}

const basePulse =
  'animate-pulse rounded bg-gray-200 dark:bg-surface-dark-3';

/** A single skeleton line of text with a randomized-looking width. */
const TextSkeleton: React.FC<{ index: number }> = ({ index }) => {
  // Cycle through a set of widths to look natural
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3'];
  const width = widths[index % widths.length];
  return <div className={clsx(basePulse, 'h-4', width)} />;
};

/** Circular avatar placeholder. */
const AvatarSkeleton: React.FC = () => (
  <div className={clsx(basePulse, 'h-10 w-10 rounded-full')} />
);

/** Card-shaped placeholder with a header area and body lines. */
const CardSkeleton: React.FC = () => (
  <div
    className={clsx(
      'rounded-xl border border-gray-200 dark:border-surface-dark-3',
      'bg-white dark:bg-surface-dark-1 p-4 space-y-3',
    )}
  >
    {/* Header row: avatar + title */}
    <div className="flex items-center gap-3">
      <div className={clsx(basePulse, 'h-8 w-8 rounded-full shrink-0')} />
      <div className={clsx(basePulse, 'h-4 w-1/3')} />
    </div>
    {/* Body lines */}
    <div className="space-y-2">
      <div className={clsx(basePulse, 'h-3 w-full')} />
      <div className={clsx(basePulse, 'h-3 w-5/6')} />
      <div className={clsx(basePulse, 'h-3 w-2/3')} />
    </div>
    {/* Footer actions */}
    <div className="flex items-center gap-2 pt-1">
      <div className={clsx(basePulse, 'h-6 w-16 rounded-md')} />
      <div className={clsx(basePulse, 'h-6 w-16 rounded-md')} />
    </div>
  </div>
);

/** Chart placeholder with vertical bars. */
const ChartSkeleton: React.FC = () => {
  const barHeights = ['h-16', 'h-24', 'h-12', 'h-20', 'h-28', 'h-10', 'h-18', 'h-22'];
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 dark:border-surface-dark-3',
        'bg-white dark:bg-surface-dark-1 p-4',
      )}
    >
      {/* Title */}
      <div className={clsx(basePulse, 'h-4 w-1/4 mb-4')} />
      {/* Bars */}
      <div className="flex items-end gap-2 h-32">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={clsx(basePulse, 'flex-1 rounded-t', h)}
          />
        ))}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-2 mt-2">
        {barHeights.map((_, i) => (
          <div key={i} className={clsx(basePulse, 'flex-1 h-2 rounded')} />
        ))}
      </div>
    </div>
  );
};

/** Table rows placeholder. */
const TableSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <div
    className={clsx(
      'rounded-xl border border-gray-200 dark:border-surface-dark-3',
      'bg-white dark:bg-surface-dark-1 overflow-hidden',
    )}
  >
    {/* Header row */}
    <div className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-surface-dark-3">
      <div className={clsx(basePulse, 'h-3 w-1/6')} />
      <div className={clsx(basePulse, 'h-3 w-1/4')} />
      <div className={clsx(basePulse, 'h-3 w-1/5')} />
      <div className={clsx(basePulse, 'h-3 w-1/6')} />
    </div>
    {/* Data rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className={clsx(
          'flex gap-4 px-4 py-3',
          i < rows - 1 && 'border-b border-gray-100 dark:border-surface-dark-2',
        )}
      >
        <div className={clsx(basePulse, 'h-3 w-1/6')} />
        <div className={clsx(basePulse, 'h-3 w-1/4')} />
        <div className={clsx(basePulse, 'h-3 w-1/5')} />
        <div className={clsx(basePulse, 'h-3 w-1/6')} />
      </div>
    ))}
  </div>
);

/**
 * Reusable skeleton loading placeholders with multiple visual variants.
 * Uses Tailwind's animate-pulse for the shimmer effect.
 */
export const SkeletonLoader: React.FC<SkeletonProps> = ({
  variant,
  count = 1,
  className,
}) => {
  const items = Array.from({ length: count });

  return (
    <div
      className={clsx('w-full', className)}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    >
      {/* Screen-reader only text */}
      <span className="sr-only">Loading...</span>

      {variant === 'text' && (
        <div className="space-y-2.5">
          {items.map((_, i) => (
            <TextSkeleton key={i} index={i} />
          ))}
        </div>
      )}

      {variant === 'avatar' && (
        <div className="flex gap-3">
          {items.map((_, i) => (
            <AvatarSkeleton key={i} />
          ))}
        </div>
      )}

      {variant === 'card' && (
        <div className="space-y-4">
          {items.map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {variant === 'chart' && (
        <div className="space-y-4">
          {items.map((_, i) => (
            <ChartSkeleton key={i} />
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="space-y-4">
          {items.map((_, i) => (
            <TableSkeleton key={i} rows={count > 1 ? count : 5} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkeletonLoader;
