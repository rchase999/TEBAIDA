import React, { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Send } from 'lucide-react';
import type { UserComment } from '../../types';

export interface CommentaryInputProps {
  /** Current number of completed turns (used as afterTurn value). */
  currentTurnCount: number;
  /** Called when the user submits a comment. */
  onSubmit: (comment: UserComment) => void;
  /** Whether the debate is still active (controls visibility). */
  isActive: boolean;
}

/**
 * Thin input bar at the bottom of the debate view that lets the user
 * type live commentary as the debate progresses. Pressing Enter or
 * clicking the send button submits the comment.
 */
const CommentaryInput: React.FC<CommentaryInputProps> = ({ currentTurnCount, onSubmit, isActive }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;

    onSubmit({
      content: trimmed,
      afterTurn: currentTurnCount,
      timestamp: new Date().toISOString(),
    });

    setValue('');
    inputRef.current?.focus();
  }, [value, currentTurnCount, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  if (!isActive) return null;

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-surface-dark-3 dark:bg-surface-dark-1">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">You:</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add your commentary..."
          className={clsx(
            'flex-1 rounded-md border bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm transition-colors',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-1 focus:ring-forge-500 focus:border-forge-500',
            'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-surface-dark-4',
            'border-gray-300 dark:border-surface-dark-4',
          )}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className={clsx(
            'inline-flex items-center justify-center rounded-md p-1.5 transition-colors',
            'text-gray-400 hover:text-forge-600 hover:bg-gray-200',
            'dark:hover:text-forge-400 dark:hover:bg-surface-dark-3',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
          title="Send comment"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CommentaryInput;

/**
 * Inline comment bubble rendered in the transcript after a turn.
 */
export const CommentBubble: React.FC<{ comment: UserComment }> = ({ comment }) => (
  <div className="flex justify-end animate-fade-in">
    <div className="max-w-[70%] rounded-xl rounded-br-sm bg-gray-200 px-3 py-2 dark:bg-surface-dark-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          You
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {new Date(comment.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
    </div>
  </div>
);
