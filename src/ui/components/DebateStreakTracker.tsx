import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Flame, Trophy, Star, Zap, Target } from 'lucide-react';
import type { Debate } from '../../types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface DebateStreakTrackerProps {
  debates: Debate[];
  className?: string;
}

const Swords = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" x2="19" y1="19" y2="13" />
    <line x1="16" x2="20" y1="16" y2="20" />
    <line x1="19" x2="21" y1="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" x2="9" y1="14" y2="18" />
    <line x1="7" x2="4" y1="17" y2="20" />
    <line x1="3" x2="5" y1="19" y2="21" />
  </svg>
);

export const DebateStreakTracker: React.FC<DebateStreakTrackerProps> = ({ debates, className }) => {
  const { currentStreak, longestStreak, achievements } = useMemo(() => {
    // Calculate streak (consecutive days with debates)
    const debateDays = new Set(debates.map((d) => d.createdAt?.slice(0, 10)).filter(Boolean));
    const sortedDays = [...debateDays].sort().reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().slice(0, 10);

    // Current streak from today/yesterday
    if (sortedDays.length > 0) {
      const latestDay = sortedDays[0];
      const daysDiff = Math.floor((new Date(today).getTime() - new Date(latestDay).getTime()) / 86400000);
      if (daysDiff <= 1) {
        currentStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const prev = new Date(sortedDays[i - 1]);
          const curr = new Date(sortedDays[i]);
          const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Longest streak
    tempStreak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak, sortedDays.length > 0 ? 1 : 0);

    const completedDebates = debates.filter((d) => d.status === 'completed').length;
    const totalTurns = debates.reduce((sum, d) => sum + (d.turns?.length ?? 0), 0);
    const uniqueModels = new Set(debates.flatMap((d) => d.debaters.filter((db) => db.position !== 'housemaster').map((db) => db.model?.displayName))).size;
    const totalFallacies = debates.reduce((sum, d) => sum + (d.turns?.reduce((s, t) => s + (t.fallacies?.length ?? 0), 0) ?? 0), 0);

    const achievements: Achievement[] = [
      {
        id: 'first-debate',
        name: 'First Blood',
        description: 'Complete your first debate',
        icon: Swords,
        color: 'text-forge-600 dark:text-forge-400',
        bgColor: 'bg-forge-100 dark:bg-forge-900/30',
        unlocked: completedDebates >= 1,
        progress: Math.min(completedDebates, 1),
        target: 1,
      },
      {
        id: 'five-debates',
        name: 'Debate Enthusiast',
        description: 'Complete 5 debates',
        icon: Star,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        unlocked: completedDebates >= 5,
        progress: Math.min(completedDebates, 5),
        target: 5,
      },
      {
        id: 'streak-3',
        name: 'On Fire',
        description: 'Achieve a 3-day debate streak',
        icon: Flame,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        unlocked: longestStreak >= 3,
        progress: Math.min(longestStreak, 3),
        target: 3,
      },
      {
        id: 'multi-model',
        name: 'Model Collector',
        description: 'Use 3 different AI models',
        icon: Zap,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        unlocked: uniqueModels >= 3,
        progress: Math.min(uniqueModels, 3),
        target: 3,
      },
      {
        id: 'fallacy-hunter',
        name: 'Fallacy Hunter',
        description: 'Detect 10 logical fallacies',
        icon: Target,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        unlocked: totalFallacies >= 10,
        progress: Math.min(totalFallacies, 10),
        target: 10,
      },
      {
        id: 'marathon',
        name: 'Marathon Debater',
        description: 'Generate 100 total debate turns',
        icon: Trophy,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        unlocked: totalTurns >= 100,
        progress: Math.min(totalTurns, 100),
        target: 100,
      },
    ];

    return { currentStreak, longestStreak, achievements };
  }, [debates]);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Streak display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 dark:bg-orange-900/20">
          <Flame className={clsx('h-5 w-5', currentStreak > 0 ? 'text-orange-500' : 'text-gray-400')} />
          <div>
            <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">{currentStreak}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 dark:bg-amber-900/20">
          <Trophy className={clsx('h-5 w-5', longestStreak > 0 ? 'text-amber-500' : 'text-gray-400')} />
          <div>
            <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">{longestStreak}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Best Streak</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {achievements.map((a) => {
          const Icon = a.icon;
          const pct = Math.round((a.progress / a.target) * 100);
          return (
            <div
              key={a.id}
              className={clsx(
                'relative rounded-xl border p-3 transition-all duration-200',
                a.unlocked
                  ? 'border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-1'
                  : 'border-gray-100 bg-gray-50 opacity-60 dark:border-surface-dark-3 dark:bg-surface-dark-2',
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={clsx('flex h-7 w-7 items-center justify-center rounded-lg', a.bgColor)}>
                  <Icon className={clsx('h-4 w-4', a.color)} />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{a.name}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{a.description}</p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', a.unlocked ? 'bg-emerald-500' : 'bg-forge-500')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] tabular-nums text-gray-400 dark:text-gray-500">{a.progress}/{a.target}</p>
              {a.unlocked && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white shadow-sm">
                  &#10003;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DebateStreakTracker;
