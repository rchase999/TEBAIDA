import React from 'react';
import clsx from 'clsx';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
  lg: { track: 'h-7 w-[52px]', thumb: 'h-6 w-6', translate: 'translate-x-6' },
};

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}) => {
  const styles = sizeStyles[size];

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      {(label || description) && (
        <div className="mr-3">
          {label && (
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          checked ? 'bg-forge-600' : 'bg-gray-300 dark:bg-surface-dark-4',
          disabled && 'opacity-50 cursor-not-allowed',
          styles.track,
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? styles.translate : 'translate-x-0',
            styles.thumb,
          )}
        />
      </button>
    </div>
  );
};

export default Toggle;
