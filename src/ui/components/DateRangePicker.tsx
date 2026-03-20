import React, { useState } from 'react';
import clsx from 'clsx';
import { Calendar, ChevronDown } from 'lucide-react';

export interface DateRange {
  label: string;
  days: number;
}

export interface DateRangePickerProps {
  value: number; // days
  onChange: (days: number) => void;
  ranges?: DateRange[];
  className?: string;
}

const DEFAULT_RANGES: DateRange[] = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: 0 },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  ranges = DEFAULT_RANGES,
  className,
}) => {
  return (
    <div className={clsx('inline-flex items-center rounded-lg border border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-1 overflow-hidden', className)}>
      {ranges.map((range) => (
        <button
          key={range.days}
          onClick={() => onChange(range.days)}
          className={clsx(
            'px-2.5 py-1.5 text-xs font-medium transition-colors',
            value === range.days
              ? 'bg-forge-600 text-white'
              : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-surface-dark-2',
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangePicker;
