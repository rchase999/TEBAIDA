import React from 'react';

export interface SearchHighlightProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Renders text with search query matches highlighted.
 * Case-insensitive matching.
 */
export const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  query,
  className,
  highlightClassName = 'bg-amber-200/60 dark:bg-amber-500/30 rounded-sm px-0.5',
}) => {
  if (!query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={highlightClassName}>{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </span>
  );
};

export default SearchHighlight;
