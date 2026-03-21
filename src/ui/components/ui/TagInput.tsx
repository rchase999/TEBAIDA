import React, { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

export interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  colors?: Record<string, string>;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_TAG_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
];

function getTagColor(tag: string, index: number, colors?: Record<string, string>): string {
  if (colors && colors[tag]) return colors[tag];
  return DEFAULT_TAG_COLORS[index % DEFAULT_TAG_COLORS.length];
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Add a tag...',
  suggestions = [],
  maxTags,
  colors,
  className,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const isAtMax = maxTags !== undefined && tags.length >= maxTags;

  // Filter suggestions based on input and existing tags
  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(s) &&
      inputValue.trim().length > 0,
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      if (isAtMax) return;

      onChange([...tags, trimmed]);
      setInputValue('');
      setShowSuggestions(false);
      setFocusedSuggestion(-1);
    },
    [tags, onChange, isAtMax],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((t) => t !== tagToRemove));
    },
    [tags, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        if (focusedSuggestion >= 0 && filteredSuggestions[focusedSuggestion]) {
          addTag(filteredSuggestions[focusedSuggestion]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;
      }

      case 'Backspace': {
        if (inputValue === '' && tags.length > 0) {
          removeTag(tags[tags.length - 1]);
        }
        break;
      }

      case ',':
      case 'Tab': {
        if (inputValue.trim()) {
          e.preventDefault();
          addTag(inputValue);
        }
        break;
      }

      case 'ArrowDown': {
        e.preventDefault();
        if (showSuggestions && filteredSuggestions.length > 0) {
          setFocusedSuggestion((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
          );
        }
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        if (showSuggestions && filteredSuggestions.length > 0) {
          setFocusedSuggestion((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
          );
        }
        break;
      }

      case 'Escape': {
        setShowSuggestions(false);
        setFocusedSuggestion(-1);
        break;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setFocusedSuggestion(-1);
    setShowSuggestions(true);
  };

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setFocusedSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  // Scroll focused suggestion into view
  useEffect(() => {
    if (focusedSuggestion >= 0 && suggestionsRef.current) {
      const items = suggestionsRef.current.querySelectorAll('li');
      items[focusedSuggestion]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedSuggestion]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Tag container + input */}
      <div
        onClick={handleContainerClick}
        className={clsx(
          'flex flex-wrap items-center gap-1.5 rounded-lg border px-3 py-2',
          'transition-colors duration-150 cursor-text',
          'border-gray-300 bg-white dark:border-surface-dark-4 dark:bg-surface-dark-2',
          'focus-within:ring-2 focus-within:ring-forge-500 focus-within:border-forge-500',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-surface-dark-3',
        )}
      >
        {/* Rendered tags */}
        {tags.map((tag, index) => (
          <span
            key={tag}
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              'motion-safe:animate-scale-in',
              getTagColor(tag, index, colors),
            )}
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className={clsx(
                  'ml-0.5 rounded-full p-1 transition-colors',
                  'hover:bg-black/10 dark:hover:bg-white/10',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current',
                )}
                aria-label={`Remove tag: ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {/* Input field */}
        {!isAtMax && !disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className={clsx(
              'min-w-[80px] flex-1 border-none bg-transparent text-sm outline-none',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            )}
            aria-label="Tag input"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && filteredSuggestions.length > 0}
            role="combobox"
          />
        )}
      </div>

      {/* Max tags message */}
      {isAtMax && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Maximum of {maxTags} tag{maxTags !== 1 ? 's' : ''} reached
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && !isAtMax && (
        <ul
          ref={suggestionsRef}
          role="listbox"
          className={clsx(
            'absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg',
            'dark:border-surface-dark-3 dark:bg-surface-dark-1',
            'motion-safe:animate-scale-in origin-top',
          )}
        >
          {filteredSuggestions.map((suggestion, index) => {
            const isFocused = focusedSuggestion === index;
            return (
              <li
                key={suggestion}
                role="option"
                aria-selected={isFocused}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
                onMouseEnter={() => setFocusedSuggestion(index)}
                className={clsx(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  'text-gray-700 dark:text-gray-300',
                  isFocused && 'bg-gray-100 dark:bg-surface-dark-2',
                )}
              >
                {suggestion}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TagInput;
