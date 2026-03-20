import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  Key, Swords, Users, Trophy, Settings,
  CheckCircle, Circle, ChevronRight, X, Sparkles,
} from 'lucide-react';

export interface OnboardingChecklistProps {
  hasApiKey: boolean;
  hasCompletedDebate: boolean;
  hasCustomPersona: boolean;
  hasTournament: boolean;
  debateCount: number;
  onNavigate: (view: string) => void;
  onDismiss: () => void;
  className?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  completed: boolean;
  action: string;
  view: string;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  hasApiKey,
  hasCompletedDebate,
  hasCustomPersona,
  hasTournament,
  debateCount,
  onNavigate,
  onDismiss,
  className,
}) => {
  const items: ChecklistItem[] = useMemo(() => [
    {
      id: 'api-key',
      label: 'Add an API key',
      description: 'Configure at least one AI provider to power your debates.',
      icon: Key,
      completed: hasApiKey,
      action: 'Go to Settings',
      view: 'settings',
    },
    {
      id: 'first-debate',
      label: 'Run your first debate',
      description: 'Set up a topic, pick your models, and watch them argue.',
      icon: Swords,
      completed: hasCompletedDebate,
      action: 'New Debate',
      view: 'setup',
    },
    {
      id: 'custom-persona',
      label: 'Create a custom persona',
      description: 'Design a debater with unique expertise and rhetorical style.',
      icon: Users,
      completed: hasCustomPersona,
      action: 'Persona Editor',
      view: 'personas',
    },
    {
      id: 'tournament',
      label: 'Start a tournament',
      description: 'Pit multiple models against each other in bracket competition.',
      icon: Trophy,
      completed: hasTournament,
      action: 'Tournament Mode',
      view: 'tournament',
    },
  ], [hasApiKey, hasCompletedDebate, hasCustomPersona, hasTournament]);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const allDone = completedCount === totalCount;
  const progressPct = (completedCount / totalCount) * 100;

  // Don't show if user has 5+ debates (they know their way around)
  if (debateCount >= 5 || allDone) return null;

  return (
    <div className={clsx(
      'rounded-xl border border-forge-200 bg-gradient-to-br from-forge-50 via-white to-purple-50 p-4',
      'dark:border-forge-800/40 dark:from-forge-950/20 dark:via-surface-dark-1 dark:to-purple-950/10',
      className,
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-forge-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Getting Started</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{completedCount}/{totalCount}</span>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forge-500 to-forge-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => !item.completed && onNavigate(item.view)}
              disabled={item.completed}
              className={clsx(
                'group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-all duration-200',
                item.completed
                  ? 'opacity-60'
                  : 'hover:bg-white dark:hover:bg-surface-dark-2 cursor-pointer',
              )}
            >
              {item.completed ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className={clsx(
                  'text-sm font-medium',
                  item.completed
                    ? 'text-gray-500 dark:text-gray-400 line-through'
                    : 'text-gray-900 dark:text-gray-100',
                )}>
                  {item.label}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.description}</p>
              </div>
              {!item.completed && (
                <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-medium text-forge-600 dark:text-forge-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.action} <ChevronRight className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
