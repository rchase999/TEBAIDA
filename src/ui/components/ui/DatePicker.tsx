import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabled?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate) {
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    if (date < min) return true;
  }
  if (maxDate) {
    const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    if (date > max) return true;
  }
  return false;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select a date',
  minDate,
  maxDate,
  className,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value || new Date());
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Focus management within calendar
  const handleCalendarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusedDate) return;

      let next = new Date(focusedDate);
      let handled = false;

      switch (e.key) {
        case 'ArrowLeft':
          next.setDate(next.getDate() - 1);
          handled = true;
          break;
        case 'ArrowRight':
          next.setDate(next.getDate() + 1);
          handled = true;
          break;
        case 'ArrowUp':
          next.setDate(next.getDate() - 7);
          handled = true;
          break;
        case 'ArrowDown':
          next.setDate(next.getDate() + 7);
          handled = true;
          break;
        case 'Enter':
        case ' ':
          if (!isDateDisabled(focusedDate, minDate, maxDate)) {
            onChange(focusedDate);
            setOpen(false);
          }
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        if (next.getMonth() !== viewDate.getMonth() || next.getFullYear() !== viewDate.getFullYear()) {
          setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
        }
        setFocusedDate(next);
      }
    },
    [focusedDate, viewDate, minDate, maxDate, onChange],
  );

  const handleOpen = () => {
    if (disabled) return;
    setOpen((v) => {
      if (!v) {
        setViewDate(value || new Date());
        setFocusedDate(value || new Date());
      }
      return !v;
    });
  };

  const handlePrevMonth = () => {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date, minDate, maxDate)) return;
    onChange(date);
    setOpen(false);
  };

  // Quick presets
  const presets = useMemo(() => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = getStartOfWeek(todayStart);
    const monthStart = getMonthStart(todayStart);

    return [
      { label: 'Today', date: todayStart },
      { label: 'Yesterday', date: yesterday },
      { label: 'This Week', date: weekStart },
      { label: 'This Month', date: monthStart },
    ].filter((p) => !isDateDisabled(p.date, minDate, maxDate));
  }, [today, minDate, maxDate]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }

    return days;
  }, [viewDate]);

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={clsx(
          'flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
          'dark:border-surface-dark-4 dark:bg-surface-dark-2',
          'transition-colors duration-150',
          'hover:border-gray-400 dark:hover:border-surface-dark-4',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          value
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-400 dark:text-gray-500',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Choose date"
      >
        <Calendar className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        <span>{value ? formatDate(value) : placeholder}</span>
      </button>

      {/* Calendar Popup */}
      {open && (
        <div
          ref={calendarRef}
          onKeyDown={handleCalendarKeyDown}
          className={clsx(
            'absolute left-0 z-50 mt-1.5 w-[320px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl',
            'dark:border-surface-dark-3 dark:bg-surface-dark-1',
            'motion-safe:animate-scale-in origin-top-left',
          )}
          role="dialog"
          aria-label="Date picker calendar"
        >
          {/* Header: month/year nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className={clsx(
                'rounded-lg p-1.5 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-surface-dark-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
                'transition-colors duration-150',
              )}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className={clsx(
                'rounded-lg p-1.5 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-surface-dark-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
                'transition-colors duration-150',
              )}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-0">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-xs font-medium text-gray-400 dark:text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0" role="grid">
            {calendarDays.map(({ date, isCurrentMonth }, i) => {
              const isToday = isSameDay(date, today);
              const isSelected = value ? isSameDay(date, value) : false;
              const isFocused = focusedDate ? isSameDay(date, focusedDate) : false;
              const isDisabled = isDateDisabled(date, minDate, maxDate);

              return (
                <button
                  key={i}
                  type="button"
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => handleSelectDate(date)}
                  onFocus={() => setFocusedDate(date)}
                  disabled={isDisabled}
                  className={clsx(
                    'relative h-9 w-full rounded-lg text-sm transition-colors duration-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forge-500',
                    isDisabled && 'opacity-30 cursor-not-allowed',
                    !isCurrentMonth && !isSelected && 'text-gray-300 dark:text-gray-600',
                    isCurrentMonth && !isSelected && !isToday && 'text-gray-700 dark:text-gray-300',
                    isCurrentMonth && !isSelected && !isDisabled && 'hover:bg-gray-100 dark:hover:bg-surface-dark-2',
                    isSelected && 'bg-forge-600 text-white font-semibold hover:bg-forge-700',
                    !isSelected && isToday && 'font-semibold text-forge-600 dark:text-forge-400 ring-1 ring-inset ring-forge-200 dark:ring-forge-800',
                    isFocused && !isSelected && 'ring-2 ring-inset ring-forge-300 dark:ring-forge-700',
                  )}
                  aria-label={date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  aria-selected={isSelected}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Quick presets */}
          {presets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-200 pt-3 dark:border-surface-dark-3">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectDate(preset.date)}
                  className={clsx(
                    'rounded-md px-2.5 py-1 text-xs font-medium',
                    'bg-gray-100 text-gray-600 dark:bg-surface-dark-2 dark:text-gray-400',
                    'hover:bg-gray-200 dark:hover:bg-surface-dark-3',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
