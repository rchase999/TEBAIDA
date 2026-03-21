import React from 'react';
import clsx from 'clsx';
import {
  MessageSquare, Crown, Shield, Swords, Gavel,
  AlertTriangle, BookOpen, Flag, CheckCircle,
} from 'lucide-react';
import type { Debate, DebateTurn, DebatePhase } from '../../types';

export interface DebateTimelineProps {
  debate: Debate;
  onTurnClick?: (turnIndex: number) => void;
  activeTurnIndex?: number;
  className?: string;
}

const PHASE_ICONS: Record<DebatePhase, React.FC<{ className?: string }>> = {
  introduction: Crown,
  opening: Flag,
  transition: BookOpen,
  rebuttal: Swords,
  'cross-examination': AlertTriangle,
  closing: Shield,
  verdict: Gavel,
};

const PHASE_COLORS: Record<DebatePhase, string> = {
  introduction: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  opening: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  transition: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  rebuttal: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  'cross-examination': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  closing: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  verdict: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const ROLE_COLORS: Record<string, string> = {
  proposition: 'border-blue-400',
  opposition: 'border-rose-400',
  housemaster: 'border-amber-400',
};

/**
 * A vertical timeline visualization of a debate's turns.
 * Shows phase icons, speaker names, and turn previews.
 * Clicking a turn can navigate to it.
 */
export const DebateTimeline: React.FC<DebateTimelineProps> = ({
  debate,
  onTurnClick,
  activeTurnIndex,
  className,
}) => {
  const turns = debate.turns ?? [];

  if (turns.length === 0) {
    return (
      <div className={clsx('text-center py-6 text-sm text-gray-400 dark:text-gray-500', className)}>
        No turns yet. Start the debate to see the timeline.
      </div>
    );
  }

  return (
    <div className={clsx('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-surface-dark-3" />

      <div className="space-y-1">
        {turns.map((turn, index) => {
          const PhaseIcon = PHASE_ICONS[turn.phase] ?? MessageSquare;
          const phaseColor = PHASE_COLORS[turn.phase] ?? PHASE_COLORS.transition;
          const roleColor = ROLE_COLORS[turn.debaterId?.includes('housemaster') ? 'housemaster' : turn.debaterId?.includes('0') ? 'proposition' : 'opposition'] ?? 'border-gray-400';
          const isActive = activeTurnIndex === index;
          const wordCount = turn.content?.split(/\s+/).length ?? 0;
          const fallacyCount = turn.fallacies?.length ?? 0;
          const preview = turn.content?.slice(0, 80)?.replace(/\n/g, ' ') ?? '';

          return (
            <button
              key={turn.id}
              onClick={() => onTurnClick?.(index)}
              className={clsx(
                'group relative flex w-full items-start gap-3 rounded-lg py-2 pl-2 pr-3 text-left transition-all duration-200',
                isActive
                  ? 'bg-forge-50 dark:bg-forge-900/10'
                  : 'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
                onTurnClick && 'cursor-pointer',
              )}
            >
              {/* Timeline node */}
              <div className={clsx(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                isActive ? 'border-forge-500 bg-forge-50 dark:bg-forge-900/30' : `bg-white dark:bg-surface-dark-1 ${roleColor}`,
              )}>
                <PhaseIcon className={clsx('h-3.5 w-3.5', isActive ? 'text-forge-600 dark:text-forge-400' : 'text-gray-500 dark:text-gray-400')} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {turn.debaterName}
                  </span>
                  <span className={clsx('rounded-full px-1.5 py-0.5 text-xs font-medium', phaseColor)}>
                    {turn.phase}
                  </span>
                  {fallacyCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-2.5 w-2.5" /> {fallacyCount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  {preview}{preview.length >= 80 ? '...' : ''}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {wordCount} words
                </span>
              </div>

              {/* Turn number */}
              <span className="shrink-0 text-xs font-medium tabular-nums text-gray-400 dark:text-gray-500 pt-1">
                #{index + 1}
              </span>
            </button>
          );
        })}

        {/* Completion marker */}
        {debate.status === 'completed' && (
          <div className="relative flex items-center gap-3 pl-2 py-2">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Debate Complete</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebateTimeline;
