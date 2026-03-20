import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Quote, Copy, Check, Trash2, Download,
  ChevronDown, ChevronUp, Star,
} from 'lucide-react';
import type { Debate, DebateTurn } from '../../types';
import { Card } from './Card';

export interface ClipboardItem {
  id: string;
  turnIndex: number;
  debaterName: string;
  phase: string;
  excerpt: string;
  fullContent: string;
  starred: boolean;
}

export interface DebateClipboardProps {
  debate: Debate;
  className?: string;
}

/**
 * A clipboard/scrapbook for saving the best quotes and moments from a debate.
 * Users can clip excerpts, star their favorites, and export them.
 */
export const DebateClipboard: React.FC<DebateClipboardProps> = ({ debate, className }) => {
  const [clips, setClips] = useState<ClipboardItem[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-extract the best quotes (first sentences from opening/closing)
  const suggestedClips = useMemo(() => {
    const suggestions: ClipboardItem[] = [];
    const turns = debate.turns ?? [];

    turns.forEach((turn, i) => {
      if (turn.phase === 'opening' || turn.phase === 'closing') {
        const firstSentence = turn.content?.split(/[.!?]\s/)[0] ?? '';
        if (firstSentence.length > 30) {
          suggestions.push({
            id: `auto-${turn.id}`,
            turnIndex: i,
            debaterName: turn.debaterName,
            phase: turn.phase,
            excerpt: firstSentence.slice(0, 200),
            fullContent: turn.content,
            starred: false,
          });
        }
      }
    });

    return suggestions.slice(0, 4);
  }, [debate.turns]);

  const addClip = (clip: ClipboardItem) => {
    if (!clips.find((c) => c.id === clip.id)) {
      setClips((prev) => [...prev, clip]);
    }
  };

  const removeClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleStar = (id: string) => {
    setClips((prev) => prev.map((c) => c.id === id ? { ...c, starred: !c.starred } : c));
  };

  const copyClip = async (clip: ClipboardItem) => {
    const text = `"${clip.excerpt}" — ${clip.debaterName} (${clip.phase})`;
    await navigator.clipboard.writeText(text);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportClips = () => {
    const allClips = clips.length > 0 ? clips : suggestedClips;
    const text = allClips
      .map((c) => `"${c.excerpt}"\n  — ${c.debaterName} (${c.phase})\n`)
      .join('\n');
    const header = `Best Quotes from: ${debate.topic}\n${'='.repeat(40)}\n\n`;
    const blob = new Blob([header + text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debate-quotes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const allClips = clips.length > 0 ? clips : suggestedClips;

  return (
    <Card className={clsx('', className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4 text-forge-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Best Quotes
          </h3>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {allClips.length} clips
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {allClips.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
              No notable quotes yet. Keep debating!
            </p>
          )}

          {allClips.map((clip) => {
            const isCopied = copiedId === clip.id;
            const isUserClip = clips.find((c) => c.id === clip.id);

            return (
              <div
                key={clip.id}
                className={clsx(
                  'group rounded-lg border p-3 transition-all duration-200',
                  clip.starred
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-900/10'
                    : 'border-gray-100 bg-gray-50/50 dark:border-surface-dark-3 dark:bg-surface-dark-2/50',
                )}
              >
                <p className="text-xs italic text-gray-700 dark:text-gray-300 line-clamp-3">
                  &ldquo;{clip.excerpt}&rdquo;
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    — {clip.debaterName} ({clip.phase})
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleStar(clip.id)}
                      className="rounded p-1 text-gray-400 hover:text-amber-500 transition-colors"
                      title="Star"
                    >
                      <Star className={clsx('h-3 w-3', clip.starred && 'fill-amber-400 text-amber-400')} />
                    </button>
                    <button
                      onClick={() => copyClip(clip)}
                      className="rounded p-1 text-gray-400 hover:text-forge-500 transition-colors"
                      title="Copy"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                    {isUserClip && (
                      <button
                        onClick={() => removeClip(clip.id)}
                        className="rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {allClips.length > 0 && (
            <button
              onClick={exportClips}
              className="flex w-full items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium text-gray-400 hover:text-forge-500 dark:text-gray-500 dark:hover:text-forge-400 transition-colors"
            >
              <Download className="h-3 w-3" /> Export quotes
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default DebateClipboard;
