import React from 'react';
import clsx from 'clsx';

export interface DividerProps {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  orientation = 'horizontal',
  className,
}) => {
  if (orientation === 'vertical') {
    return <div className={clsx('h-full w-px bg-gray-200 dark:bg-surface-dark-3', className)} />;
  }

  if (label) {
    return (
      <div className={clsx('flex items-center gap-3', className)}>
        <div className="h-px flex-1 bg-gray-200 dark:bg-surface-dark-3" />
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-surface-dark-3" />
      </div>
    );
  }

  return <div className={clsx('h-px w-full bg-gray-200 dark:bg-surface-dark-3', className)} />;
};

export default Divider;
