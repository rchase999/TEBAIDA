import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { Debate } from '../../types';

export interface DebateHeatmapCalendarProps {
  debates: Debate[];
}

/** Number of weeks to display. */
const WEEKS = 52;

/** Day labels shown along the left side. */
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'] as const;

/** Month names for header labels. */
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Returns a date string in YYYY-MM-DD format (local time).
 */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Normalise JS getDay() (0=Sun) to ISO weekday (0=Mon, 6=Sun).
 */
function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

interface CellData {
  date: Date;
  dateKey: string;
  count: number;
  col: number;
  row: number;
}

/**
 * A GitHub-style contribution heatmap showing debate activity
 * over the last 52 weeks.
 */
export const DebateHeatmapCalendar: React.FC<DebateHeatmapCalendarProps> = ({
  debates,
}) => {
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);

  // Build a map of date -> debate count
  const countMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const debate of debates) {
      const key = toDateKey(new Date(debate.createdAt));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [debates]);

  // Build grid cells for the last 52 weeks
  const { cells, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the Monday of the week 51 weeks ago
    const todayWeekday = isoWeekday(today);
    const endOfGrid = new Date(today);
    // endOfGrid is the last Saturday (end of current week column)
    // Actually we include today's full week column
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - todayWeekday);

    const startOfGrid = new Date(startOfCurrentWeek);
    startOfGrid.setDate(startOfGrid.getDate() - (WEEKS - 1) * 7);

    const cellList: CellData[] = [];
    const labels: { text: string; col: number }[] = [];
    const seenMonths = new Set<string>();

    const cursor = new Date(startOfGrid);
    let col = 0;

    while (col < WEEKS) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(cursor);
        const dateKey = toDateKey(d);

        cellList.push({
          date: d,
          dateKey,
          count: countMap.get(dateKey) ?? 0,
          col,
          row,
        });

        // Month label: record first occurrence per month in each column
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        if (row === 0 && !seenMonths.has(monthKey)) {
          seenMonths.add(monthKey);
          labels.push({ text: MONTH_NAMES[d.getMonth()], col });
        }

        cursor.setDate(cursor.getDate() + 1);
      }
      col++;
    }

    return { cells: cellList, monthLabels: labels };
  }, [countMap]);

  const getIntensityClass = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-forge-200 dark:bg-forge-900';
    if (count === 2) return 'bg-forge-400 dark:bg-forge-600';
    return 'bg-forge-600 dark:bg-forge-400';
  };

  const cellSize = 13;
  const cellGap = 3;
  const labelWidth = 32;
  const headerHeight = 20;

  const gridWidth = WEEKS * (cellSize + cellGap);
  const gridHeight = 7 * (cellSize + cellGap);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{
            width: labelWidth + gridWidth + 8,
            minHeight: headerHeight + gridHeight + 8,
          }}
        >
          {/* Month labels along the top */}
          <div
            className="flex"
            style={{ paddingLeft: labelWidth, height: headerHeight }}
          >
            {monthLabels.map((label, i) => (
              <span
                key={`${label.text}-${i}`}
                className="text-xs text-gray-500 dark:text-gray-400"
                style={{
                  position: 'absolute',
                  left: labelWidth + label.col * (cellSize + cellGap),
                  top: 0,
                }}
              >
                {label.text}
              </span>
            ))}
          </div>

          {/* Day labels along the left */}
          <div
            className="absolute left-0"
            style={{ top: headerHeight }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-xs text-gray-500 dark:text-gray-400"
                style={{
                  height: cellSize + cellGap,
                  lineHeight: `${cellSize + cellGap}px`,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div
            className="relative"
            style={{
              marginLeft: labelWidth,
              marginTop: headerHeight,
              width: gridWidth,
              height: gridHeight,
            }}
          >
            {cells.map((cell) => (
              <div
                key={cell.dateKey}
                className={clsx(
                  'absolute rounded-sm transition-colors duration-100',
                  getIntensityClass(cell.count),
                  'hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500',
                )}
                style={{
                  left: cell.col * (cellSize + cellGap),
                  top: cell.row * (cellSize + cellGap),
                  width: cellSize,
                  height: cellSize,
                }}
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
                role="gridcell"
                aria-label={`${formatDate(cell.date)}: ${cell.count} debate${cell.count !== 1 ? 's' : ''}`}
              />
            ))}

            {/* Tooltip */}
            {hoveredCell && (
              <div
                className={clsx(
                  'pointer-events-none absolute z-50 whitespace-nowrap',
                  'rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg',
                  'dark:bg-gray-700',
                )}
                style={{
                  left: hoveredCell.col * (cellSize + cellGap) + cellSize / 2,
                  top: hoveredCell.row * (cellSize + cellGap) - 8,
                  transform: 'translate(-50%, -100%)',
                }}
                role="tooltip"
              >
                <span className="font-semibold">
                  {hoveredCell.count} debate{hoveredCell.count !== 1 ? 's' : ''}
                </span>
                {' on '}
                {formatDate(hoveredCell.date)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map((level) => (
            <div
              key={level}
              className={clsx(
                'h-3 w-3 rounded-sm',
                level === 0 && 'bg-gray-100 dark:bg-gray-800',
                level === 1 && 'bg-forge-200 dark:bg-forge-900',
                level === 2 && 'bg-forge-400 dark:bg-forge-600',
                level === 3 && 'bg-forge-600 dark:bg-forge-400',
              )}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default DebateHeatmapCalendar;
