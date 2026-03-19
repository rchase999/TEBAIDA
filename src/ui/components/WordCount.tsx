import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Type, BarChart2 } from 'lucide-react';
import { Tooltip } from './Tooltip';
import type { DebateTurn, DebaterConfig } from '../../types';

/**
 * WordCountBadge — Shows word count for a single turn.
 */
export const WordCountBadge: React.FC<{ content: string; className?: string }> = ({ content, className }) => {
  const count = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);

  return (
    <Tooltip content={`${count} words`}>
      <span className={clsx(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500',
        className,
      )}>
        <Type className="h-2.5 w-2.5" />
        {count}
      </span>
    </Tooltip>
  );
};

/**
 * DebateWordStats — Summary of word counts per debater, shown after debate.
 */
interface DebateWordStatsProps {
  turns: DebateTurn[];
  debaters: DebaterConfig[];
}

export const DebateWordStats: React.FC<DebateWordStatsProps> = ({ turns, debaters }) => {
  const stats = useMemo(() => {
    const map = new Map<string, { name: string; position: string; totalWords: number; turnCount: number; avgWords: number }>();

    for (const d of debaters) {
      map.set(d.id, { name: d.name, position: d.position, totalWords: 0, turnCount: 0, avgWords: 0 });
    }

    for (const turn of turns) {
      const entry = map.get(turn.debaterId);
      if (entry) {
        const words = turn.content.split(/\s+/).filter(Boolean).length;
        entry.totalWords += words;
        entry.turnCount += 1;
      }
    }

    for (const entry of map.values()) {
      entry.avgWords = entry.turnCount > 0 ? Math.round(entry.totalWords / entry.turnCount) : 0;
    }

    return Array.from(map.values()).filter((s) => s.turnCount > 0);
  }, [turns, debaters]);

  const maxWords = Math.max(...stats.map((s) => s.totalWords), 1);
  const totalWords = stats.reduce((sum, s) => sum + s.totalWords, 0);

  const ROLE_COLORS: Record<string, string> = {
    proposition: 'bg-blue-400',
    opposition: 'bg-rose-400',
    housemaster: 'bg-amber-400',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-surface-dark-3 dark:bg-surface-dark-1">
      <div className="mb-3 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Word Count Analysis</span>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{totalWords.toLocaleString()} total words</span>
      </div>
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-24 truncate text-xs font-medium text-gray-700 dark:text-gray-300">{s.name}</span>
            <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-surface-dark-3 overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all duration-500', ROLE_COLORS[s.position] ?? 'bg-gray-400')}
                style={{ width: `${(s.totalWords / maxWords) * 100}%` }}
              />
            </div>
            <span className="w-20 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
              {s.totalWords} ({s.avgWords}/turn)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
