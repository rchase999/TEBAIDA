import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { Debate } from '../../types';

export interface ArgumentHeatmapProps {
  debates: Debate[];
  className?: string;
}

/**
 * A GitHub-style activity heatmap showing debate activity over the last 12 weeks.
 * Each cell represents a day, colored by the number of debates/turns on that day.
 */
export const ArgumentHeatmap: React.FC<ArgumentHeatmapProps> = ({ debates, className }) => {
  const { grid, maxCount, totalDays } = useMemo(() => {
    const dayMap: Record<string, number> = {};
    const now = new Date();
    const totalDays = 84; // 12 weeks

    // Initialize all days
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }

    // Count debate activity per day
    debates.forEach((d) => {
      const created = d.createdAt?.slice(0, 10);
      if (created && created in dayMap) dayMap[created]++;
      d.turns?.forEach((t) => {
        const day = t.timestamp?.slice(0, 10);
        if (day && day in dayMap) dayMap[day]++;
      });
    });

    const entries = Object.entries(dayMap).sort();
    const maxCount = Math.max(...entries.map(([, c]) => c), 1);

    // Organize into weeks (columns) with days (rows)
    const grid: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];

    entries.forEach(([date, count]) => {
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        grid.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ date, count, dayOfWeek });
    });
    if (currentWeek.length > 0) grid.push(currentWeek);

    return { grid, maxCount, totalDays };
  }, [debates]);

  function getCellColor(count: number): string {
    if (count === 0) return 'bg-gray-100 dark:bg-surface-dark-2';
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'bg-forge-200 dark:bg-forge-900/40';
    if (ratio < 0.5) return 'bg-forge-300 dark:bg-forge-800/50';
    if (ratio < 0.75) return 'bg-forge-400 dark:bg-forge-700/60';
    return 'bg-forge-600 dark:bg-forge-500';
  }

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className={clsx('', className)}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="flex h-3 items-center">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 w-6 text-right">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {grid.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const cell = week.find((c) => c.dayOfWeek === dayIdx);
                if (!cell) return <div key={dayIdx} className="h-4 w-4" />;
                return (
                  <div
                    key={dayIdx}
                    className={clsx(
                      'h-4 w-4 rounded-sm transition-all duration-200 hover:ring-1 hover:ring-forge-500 cursor-default',
                      getCellColor(cell.count),
                    )}
                    title={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'activity' : 'activities'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-gray-400 dark:text-gray-500">
        <span>Less</span>
        <div className="h-4 w-4 rounded-sm bg-gray-100 dark:bg-surface-dark-2" />
        <div className="h-4 w-4 rounded-sm bg-forge-200 dark:bg-forge-900/40" />
        <div className="h-4 w-4 rounded-sm bg-forge-300 dark:bg-forge-800/50" />
        <div className="h-4 w-4 rounded-sm bg-forge-400 dark:bg-forge-700/60" />
        <div className="h-4 w-4 rounded-sm bg-forge-600 dark:bg-forge-500" />
        <span>More</span>
      </div>
    </div>
  );
};

export default ArgumentHeatmap;
