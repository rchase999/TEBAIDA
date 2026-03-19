import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Tag, X } from 'lucide-react';

/* ======================================================================
   Debate Tags — Tagging system for organizing debates
   ====================================================================== */

const STORAGE_KEY = 'debateforge-debate-tags';

// ---------------------------------------------------------------------------
// useDebateTags hook
// ---------------------------------------------------------------------------

interface DebateTagsMap {
  [debateId: string]: string[];
}

export function useDebateTags() {
  const [tagMap, setTagMap] = useState<DebateTagsMap>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DebateTagsMap) : {};
    } catch {
      return {};
    }
  });

  // Persist whenever the map changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tagMap));
  }, [tagMap]);

  const getTagsForDebate = useCallback(
    (debateId: string): string[] => tagMap[debateId] ?? [],
    [tagMap],
  );

  const setTagsForDebate = useCallback((debateId: string, tags: string[]) => {
    setTagMap((prev) => ({ ...prev, [debateId]: tags }));
  }, []);

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    for (const tags of Object.values(tagMap)) {
      for (const tag of tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [tagMap]);

  return { getTagsForDebate, setTagsForDebate, getAllTags };
}

// ---------------------------------------------------------------------------
// TagInput
// ---------------------------------------------------------------------------

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions that are not already selected and match the input
  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return suggestions.filter((s) => !tags.includes(s));
    const q = inputValue.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q) && !tags.includes(s));
  }, [inputValue, suggestions, tags]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={clsx(
          'flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-3 py-2 transition-colors',
          'dark:bg-surface-dark-1 dark:text-gray-100',
          'border-gray-300 focus-within:border-forge-500 focus-within:ring-2 focus-within:ring-forge-500/30',
          'dark:border-surface-dark-4 dark:focus-within:border-forge-500',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tag pills */}
        {tags.map((tag) => (
          <span
            key={tag}
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              'bg-forge-100 text-forge-700',
              'dark:bg-forge-900/30 dark:text-forge-300',
            )}
          >
            <Tag className="h-3 w-3" />
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-forge-200 dark:hover:bg-forge-800/40"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Short delay so suggestion clicks can register
            setTimeout(() => {
              if (inputValue.trim()) addTag(inputValue);
            }, 150);
          }}
          placeholder={tags.length === 0 ? 'Add tags (press Enter or comma)' : ''}
          className={clsx(
            'min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none',
            'text-gray-900 placeholder:text-gray-400',
            'dark:text-gray-100 dark:placeholder:text-gray-500',
          )}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className={clsx(
            'absolute z-20 mt-1 w-full rounded-lg border shadow-lg',
            'max-h-40 overflow-y-auto',
            'border-gray-200 bg-white',
            'dark:border-surface-dark-3 dark:bg-surface-dark-1',
          )}
        >
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
              className={clsx(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                'text-gray-700 hover:bg-gray-50',
                'dark:text-gray-300 dark:hover:bg-surface-dark-2',
              )}
            >
              <Tag className="h-3 w-3 text-gray-400 dark:text-gray-500" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TagFilter
// ---------------------------------------------------------------------------

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTags, onToggle }) => {
  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Tag className="h-3.5 w-3.5" />
        Filter:
      </span>
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={clsx(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150',
              isSelected
                ? 'bg-forge-600 text-white shadow-sm dark:bg-forge-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-surface-dark-3 dark:text-gray-300 dark:hover:bg-surface-dark-4',
            )}
          >
            {tag}
            {isSelected && <X className="ml-1 h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
};
