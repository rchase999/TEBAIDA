import React, { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';

export interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
  color?: string;
  className?: string;
}

/**
 * Collapsible thinking/reasoning display, similar to Claude.ai and ChatGPT.
 * Shows the model's internal reasoning process in a distinct visual block.
 */
export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  isStreaming = false,
  color,
  className,
}) => {
  const [expanded, setExpanded] = useState(isStreaming);

  // Auto-expand while streaming
  React.useEffect(() => {
    if (isStreaming) setExpanded(true);
  }, [isStreaming]);

  const lines = content.split('\n').filter(Boolean);
  const previewText = lines[0]?.slice(0, 80) ?? 'Reasoning...';

  return (
    <div
      className={clsx(
        'rounded-lg border transition-colors',
        isStreaming
          ? 'border-amber-300/60 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-950/20'
          : 'border-gray-200/60 bg-gray-50/50 dark:border-surface-dark-4/60 dark:bg-surface-dark-1/50',
        className,
      )}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        {isStreaming ? (
          <Brain
            className="h-3.5 w-3.5 shrink-0 animate-pulse"
            style={{ color: color ?? '#f59e0b' }}
          />
        ) : (
          <Brain className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        )}

        <span className="flex-1 truncate">
          {isStreaming ? (
            <span className="text-amber-600 dark:text-amber-400">
              Thinking...
            </span>
          ) : (
            <span>{previewText}{previewText.length >= 80 ? '...' : ''}</span>
          )}
        </span>

        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-200/40 px-3 py-2 dark:border-surface-dark-4/40">
          <div className="max-h-60 overflow-auto text-xs leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-amber-500 dark:bg-amber-400 animate-pulse rounded-sm" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
