import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { GitCompareArrows, Trophy, ArrowRight, BarChart3 } from 'lucide-react';
import type { Debate } from '../../types';

export interface DebateComparisonToolProps {
  debates: Debate[];
}

interface MetricRow {
  label: string;
  valueA: string | number;
  valueB: string | number;
  numericA?: number;
  numericB?: number;
  /** Which side wins: 'a', 'b', 'tie', or 'none' (non-comparable). */
  winner?: 'a' | 'b' | 'tie' | 'none';
  /** If true, render as a progress bar comparison. */
  bar?: boolean;
}

function countWords(debate: Debate): number {
  return debate.turns.reduce((sum, turn) => {
    return sum + turn.content.split(/\s+/).filter(Boolean).length;
  }, 0);
}

function countFallacies(debate: Debate): number {
  return debate.turns.reduce((sum, turn) => {
    return sum + (turn.fallacies?.length ?? 0);
  }, 0);
}

function overallScore(debate: Debate): number | null {
  if (!debate.scores || debate.scores.length === 0) return null;
  const total = debate.scores.reduce((s, sc) => s + sc.categories.overall, 0);
  return Math.round((total / debate.scores.length) * 10) / 10;
}

function getDebaterModels(debate: Debate): string {
  return debate.debaters.map((d) => d.model.displayName || d.model.name).join(' vs ');
}

/**
 * Side-by-side comparison of two debates.
 * Users pick two debates from dropdowns and see metrics compared visually.
 */
export const DebateComparisonTool: React.FC<DebateComparisonToolProps> = ({
  debates,
}) => {
  const [idA, setIdA] = useState<string>('');
  const [idB, setIdB] = useState<string>('');

  const debateA = useMemo(() => debates.find((d) => d.id === idA) ?? null, [debates, idA]);
  const debateB = useMemo(() => debates.find((d) => d.id === idB) ?? null, [debates, idB]);

  // Build metrics when both debates are selected
  const metrics: MetricRow[] = useMemo(() => {
    if (!debateA || !debateB) return [];

    const wordsA = countWords(debateA);
    const wordsB = countWords(debateB);
    const turnsA = debateA.turns.length;
    const turnsB = debateB.turns.length;
    const fallaciesA = countFallacies(debateA);
    const fallaciesB = countFallacies(debateB);
    const scoreA = overallScore(debateA);
    const scoreB = overallScore(debateB);

    const rows: MetricRow[] = [
      {
        label: 'Topic',
        valueA: debateA.topic,
        valueB: debateB.topic,
        winner: 'none',
      },
      {
        label: 'Format',
        valueA: debateA.format.name,
        valueB: debateB.format.name,
        winner: 'none',
      },
      {
        label: 'Models',
        valueA: getDebaterModels(debateA),
        valueB: getDebaterModels(debateB),
        winner: 'none',
      },
      {
        label: 'Turns',
        valueA: turnsA,
        valueB: turnsB,
        numericA: turnsA,
        numericB: turnsB,
        winner: turnsA > turnsB ? 'a' : turnsB > turnsA ? 'b' : 'tie',
        bar: true,
      },
      {
        label: 'Word Count',
        valueA: wordsA.toLocaleString(),
        valueB: wordsB.toLocaleString(),
        numericA: wordsA,
        numericB: wordsB,
        winner: wordsA > wordsB ? 'a' : wordsB > wordsA ? 'b' : 'tie',
        bar: true,
      },
      {
        label: 'Fallacies Detected',
        valueA: fallaciesA,
        valueB: fallaciesB,
        numericA: fallaciesA,
        numericB: fallaciesB,
        // Fewer fallacies is better
        winner: fallaciesA < fallaciesB ? 'a' : fallaciesB < fallaciesA ? 'b' : 'tie',
        bar: true,
      },
    ];

    if (scoreA !== null || scoreB !== null) {
      rows.push({
        label: 'Average Score',
        valueA: scoreA !== null ? `${scoreA}/10` : 'N/A',
        valueB: scoreB !== null ? `${scoreB}/10` : 'N/A',
        numericA: scoreA ?? 0,
        numericB: scoreB ?? 0,
        winner:
          scoreA !== null && scoreB !== null
            ? scoreA > scoreB
              ? 'a'
              : scoreB > scoreA
                ? 'b'
                : 'tie'
            : 'none',
        bar: true,
      });
    }

    return rows;
  }, [debateA, debateB]);

  // Empty state
  if (debates.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-surface-dark-4">
        <GitCompareArrows className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
          Not enough debates
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Complete at least two debates to compare them side by side.
        </p>
      </div>
    );
  }

  const selectOptions = debates.map((d) => ({
    value: d.id,
    label: d.topic.length > 50 ? d.topic.slice(0, 50) + '...' : d.topic,
  }));

  const barPercent = (a: number, b: number): [number, number] => {
    const max = Math.max(a, b, 1);
    return [Math.round((a / max) * 100), Math.round((b / max) * 100)];
  };

  return (
    <div className="w-full space-y-6">
      {/* Debate selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Debate A
          </label>
          <select
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            className={clsx(
              'block w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-forge-500/30 focus:border-forge-500',
              'dark:bg-surface-dark-1 dark:text-gray-100 dark:border-surface-dark-4 dark:focus:border-forge-500',
              'border-gray-300',
            )}
          >
            <option value="">Select a debate...</option>
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === idB}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-center pb-2">
          <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 rotate-0 sm:rotate-0" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Debate B
          </label>
          <select
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            className={clsx(
              'block w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-forge-500/30 focus:border-forge-500',
              'dark:bg-surface-dark-1 dark:text-gray-100 dark:border-surface-dark-4 dark:focus:border-forge-500',
              'border-gray-300',
            )}
          >
            <option value="">Select a debate...</option>
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === idA}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison table */}
      {debateA && debateB && metrics.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-surface-dark-3">
          {/* Header */}
          <div className="grid grid-cols-[180px_1fr_1fr] bg-gray-50 dark:bg-surface-dark-2">
            <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-surface-dark-3">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Metric
              </span>
            </div>
            <div className="border-b border-l border-gray-200 px-4 py-3 text-center dark:border-surface-dark-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-forge-600 dark:text-forge-400">
                Debate A
              </span>
            </div>
            <div className="border-b border-l border-gray-200 px-4 py-3 text-center dark:border-surface-dark-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-forge-600 dark:text-forge-400">
                Debate B
              </span>
            </div>
          </div>

          {/* Rows */}
          {metrics.map((metric, idx) => {
            const isLast = idx === metrics.length - 1;
            const [pctA, pctB] =
              metric.bar && metric.numericA !== undefined && metric.numericB !== undefined
                ? barPercent(metric.numericA, metric.numericB)
                : [0, 0];

            return (
              <div
                key={metric.label}
                className={clsx(
                  'grid grid-cols-[180px_1fr_1fr]',
                  !isLast && 'border-b border-gray-200 dark:border-surface-dark-3',
                  idx % 2 === 0
                    ? 'bg-white dark:bg-surface-dark-1'
                    : 'bg-gray-50/50 dark:bg-surface-dark-2/50',
                )}
              >
                {/* Label */}
                <div className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </div>

                {/* Value A */}
                <div
                  className={clsx(
                    'flex flex-col justify-center border-l border-gray-200 px-4 py-3 dark:border-surface-dark-3',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {metric.winner === 'a' && (
                      <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span
                      className={clsx(
                        'text-sm',
                        metric.winner === 'a'
                          ? 'font-semibold text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-400',
                      )}
                    >
                      {metric.valueA}
                    </span>
                  </div>
                  {metric.bar && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-500',
                          metric.winner === 'a'
                            ? 'bg-forge-600 dark:bg-forge-400'
                            : 'bg-gray-400 dark:bg-gray-600',
                        )}
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Value B */}
                <div
                  className={clsx(
                    'flex flex-col justify-center border-l border-gray-200 px-4 py-3 dark:border-surface-dark-3',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {metric.winner === 'b' && (
                      <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span
                      className={clsx(
                        'text-sm',
                        metric.winner === 'b'
                          ? 'font-semibold text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-400',
                      )}
                    >
                      {metric.valueB}
                    </span>
                  </div>
                  {metric.bar && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-500',
                          metric.winner === 'b'
                            ? 'bg-forge-600 dark:bg-forge-400'
                            : 'bg-gray-400 dark:bg-gray-600',
                        )}
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prompt to select both */}
      {(!debateA || !debateB) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-surface-dark-4">
          <GitCompareArrows className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Select two debates above to see a side-by-side comparison.
          </p>
        </div>
      )}
    </div>
  );
};

export default DebateComparisonTool;
