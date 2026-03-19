import React, { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronRight, X, Crown, Shield, Swords } from 'lucide-react';
import { Badge } from './Badge';

/* ======================================================================
   Debate Bookmarks — Save and navigate to key moments in a debate
   ====================================================================== */

export interface DebateBookmark {
  id: string;
  turnIndex: number;
  turnId: string;
  debaterName: string;
  role: 'proposition' | 'opposition' | 'housemaster';
  phase: string;
  note: string;
  timestamp: string;
}

interface BookmarkButtonProps {
  turnId: string;
  turnIndex: number;
  debaterName: string;
  role: 'proposition' | 'opposition' | 'housemaster';
  phase: string;
  isBookmarked: boolean;
  onToggle: (bookmark: Omit<DebateBookmark, 'id' | 'timestamp'>) => void;
}

/** Inline bookmark toggle button for each turn */
export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  turnId, turnIndex, debaterName, role, phase, isBookmarked, onToggle,
}) => (
  <button
    onClick={() => onToggle({ turnId, turnIndex, debaterName, role, phase, note: '' })}
    className={clsx(
      'inline-flex items-center justify-center rounded-full p-1 transition-colors',
      isBookmarked
        ? 'text-amber-500 hover:text-amber-600'
        : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400',
    )}
    title={isBookmarked ? 'Remove bookmark' : 'Bookmark this moment'}
  >
    {isBookmarked ? (
      <BookmarkCheck className="h-3.5 w-3.5" />
    ) : (
      <Bookmark className="h-3.5 w-3.5" />
    )}
  </button>
);

interface BookmarksPanelProps {
  bookmarks: DebateBookmark[];
  onRemove: (id: string) => void;
  onNavigate: (turnIndex: number) => void;
  onUpdateNote: (id: string, note: string) => void;
}

function getRoleIcon(role: string, className: string) {
  switch (role) {
    case 'housemaster': return <Crown className={className} />;
    case 'proposition': return <Shield className={className} />;
    case 'opposition': return <Swords className={className} />;
    default: return null;
  }
}

/** Collapsible bookmarks panel */
export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  bookmarks, onRemove, onNavigate, onUpdateNote,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (bookmarks.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2"
      >
        <div className="flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Bookmarks ({bookmarks.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-1 border-t border-gray-200 px-2 py-2 dark:border-surface-dark-3">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2"
            >
              <button
                onClick={() => onNavigate(bm.turnIndex)}
                className="flex flex-1 items-center gap-2 text-left min-w-0"
              >
                <span className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  bm.role === 'housemaster' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  bm.role === 'proposition' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
                )}>
                  {getRoleIcon(bm.role, 'h-3 w-3')}
                  Step {bm.turnIndex + 1}
                </span>
                <span className="truncate text-gray-700 dark:text-gray-300">{bm.debaterName}</span>
                <Badge size="sm">{bm.phase}</Badge>
              </button>
              <button
                onClick={() => onRemove(bm.id)}
                className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Hook for managing bookmarks state */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<DebateBookmark[]>([]);

  const isBookmarked = useCallback(
    (turnId: string) => bookmarks.some((b) => b.turnId === turnId),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    (data: Omit<DebateBookmark, 'id' | 'timestamp'>) => {
      setBookmarks((prev) => {
        const existing = prev.find((b) => b.turnId === data.turnId);
        if (existing) {
          return prev.filter((b) => b.turnId !== data.turnId);
        }
        return [
          ...prev,
          {
            ...data,
            id: `bm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    },
    [],
  );

  const removeBookmark = useCallback(
    (id: string) => setBookmarks((prev) => prev.filter((b) => b.id !== id)),
    [],
  );

  const updateNote = useCallback(
    (id: string, note: string) =>
      setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, note } : b))),
    [],
  );

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark, updateNote };
}
