import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Users,
} from 'lucide-react';
import { Button } from './Button';

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface AudiencePanelProps {
  votes: { for: number; against: number; undecided: number };
  onVote: (side: 'for' | 'against' | 'undecided') => void;
  onReset: () => void;
  topic: string;
  isExpanded: boolean;
  onToggle: () => void;
}

/* ─── Animated counter digit ───────────────────────────────────────────────── */

const AnimatedCount: React.FC<{ value: number; className?: string }> = ({
  value,
  className,
}) => (
  <span
    key={value}
    className={clsx(
      'inline-block tabular-nums transition-all duration-300 animate-fade-in',
      className,
    )}
  >
    {value}
  </span>
);

/* ─── Main component ───────────────────────────────────────────────────────── */

const AudiencePanel: React.FC<AudiencePanelProps> = ({
  votes,
  onVote,
  onReset,
  topic,
  isExpanded,
  onToggle,
}) => {
  const total = useMemo(
    () => votes.for + votes.against + votes.undecided,
    [votes],
  );

  const pct = useMemo(() => {
    if (total === 0) return { for: 0, against: 0, undecided: 0 };
    return {
      for: (votes.for / total) * 100,
      against: (votes.against / total) * 100,
      undecided: (votes.undecided / total) * 100,
    };
  }, [votes, total]);

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300',
        'dark:border-surface-dark-3 dark:bg-surface-dark-1',
      )}
    >
      {/* ── Collapsed header (always visible) ── */}
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          'flex w-full items-center justify-between px-4 py-3 text-left transition-colors',
          'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-forge-600 dark:text-forge-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Audience Vote
          </span>
          {total > 0 && (
            <span className="rounded-full bg-forge-100 px-2 py-0.5 text-xs font-medium tabular-nums text-forge-700 dark:bg-forge-900/30 dark:text-forge-300">
              {total} vote{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {/* ── Expanded panel ── */}
      {isExpanded && (
        <div className="animate-fade-in border-t border-gray-200 px-4 pb-4 pt-3 dark:border-surface-dark-3">
          {/* Topic reminder */}
          <p className="mb-4 truncate text-xs text-gray-500 dark:text-gray-400">
            Topic: <span className="font-medium text-gray-700 dark:text-gray-300">{topic}</span>
          </p>

          {/* Voting buttons */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onVote('for')}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all duration-200',
                'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100',
                'dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/40',
                'active:scale-95',
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              <span>For</span>
            </button>

            <button
              type="button"
              onClick={() => onVote('undecided')}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all duration-200',
                'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100',
                'dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-surface-dark-3',
                'active:scale-95',
              )}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Undecided</span>
            </button>

            <button
              type="button"
              onClick={() => onVote('against')}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all duration-200',
                'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100',
                'dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:border-rose-600 dark:hover:bg-rose-900/40',
                'active:scale-95',
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              <span>Against</span>
            </button>
          </div>

          {/* Vote distribution bar */}
          {total > 0 && (
            <div className="mb-3">
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${pct.for}%` }}
                />
                <div
                  className="bg-gray-400 transition-all duration-500 dark:bg-gray-500"
                  style={{ width: `${pct.undecided}%` }}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${pct.against}%` }}
                />
              </div>
            </div>
          )}

          {/* Vote counts with percentages */}
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <AnimatedCount
                value={votes.for}
                className="text-base font-bold text-blue-600 dark:text-blue-400"
              />
              <p className="text-gray-500 dark:text-gray-400">
                For ({total > 0 ? pct.for.toFixed(1) : '0'}%)
              </p>
            </div>
            <div>
              <AnimatedCount
                value={votes.undecided}
                className="text-base font-bold text-gray-600 dark:text-gray-300"
              />
              <p className="text-gray-500 dark:text-gray-400">
                Undecided ({total > 0 ? pct.undecided.toFixed(1) : '0'}%)
              </p>
            </div>
            <div>
              <AnimatedCount
                value={votes.against}
                className="text-base font-bold text-rose-600 dark:text-rose-400"
              />
              <p className="text-gray-500 dark:text-gray-400">
                Against ({total > 0 ? pct.against.toFixed(1) : '0'}%)
              </p>
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={total === 0}
              icon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              Reset votes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudiencePanel;
