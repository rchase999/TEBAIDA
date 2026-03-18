import React, { useCallback } from 'react';
import clsx from 'clsx';

/** The five available reaction types. */
export const REACTIONS = [
  { emoji: '\uD83D\uDD25', label: 'Strong point' },
  { emoji: '\uD83D\uDCA1', label: 'Interesting' },
  { emoji: '\uD83E\uDD14', label: 'Questionable' },
  { emoji: '\u274C', label: 'Weak argument' },
  { emoji: '\uD83D\uDC4F', label: 'Well said' },
] as const;

export type ReactionEmoji = (typeof REACTIONS)[number]['emoji'];

/** Reaction counts for a single turn: emoji -> count. */
export type ReactionCounts = Record<string, number>;

/** Full reaction state: turnId -> ReactionCounts. */
export type ReactionsMap = Record<string, ReactionCounts>;

export interface ReactionBarProps {
  turnId: string;
  counts: ReactionCounts;
  onReact: (turnId: string, emoji: string, event: React.MouseEvent) => void;
  compact?: boolean;
}

/**
 * Row of emoji reaction buttons for a debate turn.
 * Displays counts when > 0. Triggers a floating animation via onReact callback.
 */
const ReactionBar: React.FC<ReactionBarProps> = ({ turnId, counts, onReact, compact = false }) => {
  const handleClick = useCallback(
    (emoji: string, e: React.MouseEvent) => {
      onReact(turnId, emoji, e);
    },
    [turnId, onReact],
  );

  return (
    <div className={clsx('flex items-center gap-1', compact ? 'mt-1' : 'mt-2')}>
      {REACTIONS.map(({ emoji, label }) => {
        const count = counts[emoji] ?? 0;
        return (
          <button
            key={emoji}
            type="button"
            title={label}
            aria-label={`${label}${count > 0 ? ` (${count})` : ''}`}
            onClick={(e) => handleClick(emoji, e)}
            className={clsx(
              'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-all duration-150',
              'hover:scale-110 active:scale-95',
              count > 0
                ? 'border-gray-300 bg-gray-100 dark:border-surface-dark-4 dark:bg-surface-dark-2'
                : 'border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-surface-dark-2',
            )}
          >
            <span className={clsx(compact ? 'text-sm' : 'text-base')}>{emoji}</span>
            {count > 0 && (
              <span className="text-[10px] font-medium tabular-nums text-gray-600 dark:text-gray-400">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ReactionBar;

/**
 * Compact inline display of reaction counts for a turn bubble header.
 * Only shows emojis that have at least one reaction.
 */
export const ReactionSummary: React.FC<{ counts: ReactionCounts }> = ({ counts }) => {
  const entries = Object.entries(counts).filter(([, c]) => c > 0);
  if (entries.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {entries.map(([emoji, count]) => (
        <span key={emoji} className="inline-flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="text-xs">{emoji}</span>
          <span className="text-[10px] tabular-nums">{count}</span>
        </span>
      ))}
    </span>
  );
};
