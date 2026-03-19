import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { StickyNote, ChevronDown, ChevronRight, Save } from 'lucide-react';

/**
 * DebateNotes — Free-form notes that users can attach to a debate.
 * Persisted to localStorage per debate ID.
 */

const NOTES_KEY_PREFIX = 'debateforge-notes-';

function loadNotes(debateId: string): string {
  try {
    return localStorage.getItem(`${NOTES_KEY_PREFIX}${debateId}`) ?? '';
  } catch {
    return '';
  }
}

function persistNotes(debateId: string, notes: string): void {
  try {
    if (notes.trim()) {
      localStorage.setItem(`${NOTES_KEY_PREFIX}${debateId}`, notes);
    } else {
      localStorage.removeItem(`${NOTES_KEY_PREFIX}${debateId}`);
    }
  } catch { /* ignore */ }
}

interface DebateNotesProps {
  debateId: string;
  className?: string;
}

export const DebateNotes: React.FC<DebateNotesProps> = ({ debateId, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(() => loadNotes(debateId));
  const [saved, setSaved] = useState(true);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    persistNotes(debateId, notes);
    setSaved(true);
    setTimeout(() => setSaved(true), 1500);
  }, [debateId, notes]);

  const handleBlur = useCallback(() => {
    if (!saved) {
      persistNotes(debateId, notes);
      setSaved(true);
    }
  }, [debateId, notes, saved]);

  const hasNotes = notes.trim().length > 0;

  return (
    <div className={clsx('rounded-xl border border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-1', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2"
      >
        <div className="flex items-center gap-2">
          <StickyNote className={clsx('h-4 w-4', hasNotes ? 'text-forge-500' : 'text-gray-400')} />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Notes
          </span>
          {hasNotes && !isExpanded && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
              — {notes.slice(0, 50)}{notes.length > 50 ? '...' : ''}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-surface-dark-3">
          <textarea
            value={notes}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Add your notes about this debate..."
            rows={4}
            className={clsx(
              'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors',
              'placeholder:text-gray-400 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/30',
              'dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
              'border-gray-300 resize-none',
            )}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {notes.length} characters
            </span>
            <button
              onClick={handleSave}
              className={clsx(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                saved
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-forge-600 hover:bg-forge-50 dark:text-forge-400 dark:hover:bg-forge-900/20',
              )}
            >
              <Save className="h-3 w-3" />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateNotes;
