import React from 'react';
import clsx from 'clsx';

export interface ProgressBarProps {
  value: number; // 0 - 100
  label?: string;
  color?: string;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color,
  animated = false,
  className,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            !color && 'bg-forge-600 dark:bg-forge-500',
            animated && 'animate-pulse-soft',
          )}
          style={{
            width: `${clampedValue}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
