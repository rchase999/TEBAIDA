import React, { useMemo } from 'react';
import clsx from 'clsx';

export interface DebateWordCloudProps {
  text: string;
  maxWords?: number;
  className?: string;
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
  'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all',
  'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
  'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
  'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'having',
  'does', 'did', 'doing', 'more', 'very', 'such', 'should', 'may', 'must', 'shall',
]);

const COLORS = [
  'text-forge-600 dark:text-forge-400',
  'text-blue-600 dark:text-blue-400',
  'text-purple-600 dark:text-purple-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-amber-600 dark:text-amber-400',
  'text-rose-600 dark:text-rose-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-indigo-600 dark:text-indigo-400',
];

export const DebateWordCloud: React.FC<DebateWordCloudProps> = ({
  text,
  maxWords = 30,
  className,
}) => {
  const words = useMemo(() => {
    const counts: Record<string, number> = {};
    const tokens = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);

    tokens.forEach((word) => {
      if (word.length < 4 || STOP_WORDS.has(word)) return;
      counts[word] = (counts[word] ?? 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxWords);

    if (sorted.length === 0) return [];

    const maxCount = sorted[0][1];
    const minCount = sorted[sorted.length - 1][1];
    const range = maxCount - minCount || 1;

    return sorted.map(([word, count], i) => {
      const normalized = (count - minCount) / range;
      const fontSize = 12 + normalized * 24; // 12px to 36px
      const opacity = 0.5 + normalized * 0.5;
      return { word, count, fontSize, opacity, color: COLORS[i % COLORS.length] };
    });
  }, [text, maxWords]);

  if (words.length === 0) {
    return (
      <div className={clsx('text-center py-8 text-sm text-gray-400 dark:text-gray-500', className)}>
        Not enough text to generate a word cloud.
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5', className)}>
      {words.map(({ word, fontSize, opacity, color }) => (
        <span
          key={word}
          className={clsx('inline-block font-semibold transition-all duration-200 hover:opacity-100 hover:scale-110 cursor-default', color)}
          style={{ fontSize: `${fontSize}px`, opacity }}
          title={word}
        >
          {word}
        </span>
      ))}
    </div>
  );
};

export default DebateWordCloud;
