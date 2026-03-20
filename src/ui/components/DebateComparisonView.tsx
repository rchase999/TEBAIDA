import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  GitCompareArrows,
  MessageSquare,
  AlertTriangle,
  Quote,
  Trophy,
  Users,
  Clock,
  BarChart3,
  ArrowRight,
  Minus,
} from 'lucide-react';
import type { Debate, DebateScore, DetectedFallacy } from '../../types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Select } from './Select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DebateComparisonViewProps {
  debates: Debate[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count all fallacies across every turn of a debate. */
function countFallacies(debate: Debate): number {
  return debate.turns.reduce((sum, turn) => sum + (turn.fallacies?.length ?? 0), 0);
}

/** Count all citations across every turn of a debate. */
function countCitations(debate: Debate): number {
  return debate.turns.reduce((sum, turn) => sum + (turn.citations?.length ?? 0), 0);
}

/** Get the overall winner from scores (highest overall score). */
function getWinner(debate: Debate): DebateScore | null {
  if (!debate.scores || debate.scores.length === 0) return null;
  return debate.scores.reduce((best, s) =>
    s.categories.overall > best.categories.overall ? s : best,
  );
}

/** Get a human-friendly model list for a debate. */
function modelNames(debate: Debate): string {
  return debate.debaters.map((d) => d.model.displayName || d.model.name).join(' vs ');
}

/** Get the unique list of fallacy types in a debate. */
function fallacyTypes(debate: Debate): string[] {
  const all: DetectedFallacy[] = debate.turns.flatMap((t) => t.fallacies ?? []);
  return [...new Set(all.map((f) => f.name))];
}

/** Format a date string nicely. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// StatCell — a single metric display
// ---------------------------------------------------------------------------

const StatCell: React.FC<{
  icon: React.ReactNode;
  label: string;
  valueA: string | number;
  valueB: string | number;
  highlight?: 'a' | 'b' | 'tie' | null;
}> = ({ icon, label, valueA, valueB, highlight }) => (
  <div
    className={clsx(
      'grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl px-4 py-3',
      'transition-colors duration-100',
      'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
    )}
  >
    {/* Left value */}
    <div className="text-right">
      <span
        className={clsx(
          'text-lg font-bold tabular-nums',
          highlight === 'a'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-gray-900 dark:text-gray-100',
        )}
      >
        {valueA}
      </span>
    </div>

    {/* Center label */}
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
    </div>

    {/* Right value */}
    <div className="text-left">
      <span
        className={clsx(
          'text-lg font-bold tabular-nums',
          highlight === 'b'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-gray-900 dark:text-gray-100',
        )}
      >
        {valueB}
      </span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ScoreBar — horizontal comparison bar
// ---------------------------------------------------------------------------

const ScoreBar: React.FC<{
  label: string;
  scoreA: number;
  scoreB: number;
  max?: number;
}> = ({ label, scoreA, scoreB, max = 10 }) => {
  const pctA = (scoreA / max) * 100;
  const pctB = (scoreB / max) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
          {label}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {scoreA.toFixed(1)} vs {scoreB.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Bar A (grows right to left) */}
        <div className="flex-1 flex justify-end">
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-surface-dark-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-forge-500 transition-all duration-500 ease-out float-right"
              style={{ width: `${pctA}%` }}
            />
          </div>
        </div>

        <Minus className="h-3 w-3 text-gray-300 dark:text-gray-600 shrink-0" />

        {/* Bar B (grows left to right) */}
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-surface-dark-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${pctB}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DebateComparisonView
// ---------------------------------------------------------------------------

export const DebateComparisonView: React.FC<DebateComparisonViewProps> = ({
  debates,
}) => {
  const completedDebates = useMemo(
    () => debates.filter((d) => d.status === 'completed'),
    [debates],
  );

  const options = useMemo(
    () =>
      completedDebates.map((d) => ({
        value: d.id,
        label: `${d.topic.slice(0, 50)}${d.topic.length > 50 ? '...' : ''} (${formatDate(d.createdAt)})`,
      })),
    [completedDebates],
  );

  const [debateAId, setDebateAId] = useState<string>('');
  const [debateBId, setDebateBId] = useState<string>('');

  const debateA = completedDebates.find((d) => d.id === debateAId) ?? null;
  const debateB = completedDebates.find((d) => d.id === debateBId) ?? null;

  const bothSelected = debateA && debateB;

  // Compute stats when both selected
  const stats = useMemo(() => {
    if (!debateA || !debateB) return null;

    const fallaciesA = countFallacies(debateA);
    const fallaciesB = countFallacies(debateB);
    const citationsA = countCitations(debateA);
    const citationsB = countCitations(debateB);
    const turnsA = debateA.turns.length;
    const turnsB = debateB.turns.length;
    const winnerA = getWinner(debateA);
    const winnerB = getWinner(debateB);
    const overallA = winnerA?.categories.overall ?? 0;
    const overallB = winnerB?.categories.overall ?? 0;

    return {
      fallaciesA,
      fallaciesB,
      citationsA,
      citationsB,
      turnsA,
      turnsB,
      winnerA,
      winnerB,
      overallA,
      overallB,
    };
  }, [debateA, debateB]);

  // ── Filter options so the same debate cannot be picked twice ────────────
  const optionsA = options.filter((o) => o.value !== debateBId);
  const optionsB = options.filter((o) => o.value !== debateAId);

  // ── Empty state ────────────────────────────────────────────────────────
  if (completedDebates.length < 2) {
    return (
      <Card className="text-center py-12">
        <GitCompareArrows className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Not enough completed debates
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Complete at least two debates to compare them side by side.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Selectors ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              'bg-forge-100 text-forge-600',
              'dark:bg-forge-900/30 dark:text-forge-400',
            )}
          >
            <GitCompareArrows className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Compare Debates
          </h2>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
          <Select
            label="Debate A"
            options={optionsA}
            placeholder="Select a debate..."
            value={debateAId}
            onChange={(e) => setDebateAId(e.target.value)}
          />

          <div className="pb-2">
            <ArrowRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </div>

          <Select
            label="Debate B"
            options={optionsB}
            placeholder="Select a debate..."
            value={debateBId}
            onChange={(e) => setDebateBId(e.target.value)}
          />
        </div>
      </Card>

      {/* ── Comparison content ──────────────────────────────────────────── */}
      {bothSelected && stats && (
        <>
          {/* ── Topic headers ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    'bg-forge-100 text-forge-600',
                    'dark:bg-forge-900/30 dark:text-forge-400',
                  )}
                >
                  <span className="text-xs font-bold">A</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {debateA!.topic}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {modelNames(debateA!)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="info" size="sm">
                      {debateA!.format.name}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {formatDate(debateA!.createdAt)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    'bg-blue-100 text-blue-600',
                    'dark:bg-blue-900/30 dark:text-blue-400',
                  )}
                >
                  <span className="text-xs font-bold">B</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {debateB!.topic}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {modelNames(debateB!)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="info" size="sm">
                      {debateB!.format.name}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {formatDate(debateB!.createdAt)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Key stats comparison ──────────────────────────────────── */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 px-4">
              Key Statistics
            </h3>

            <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
              <StatCell
                icon={<MessageSquare className="h-4 w-4" />}
                label="Turns"
                valueA={stats.turnsA}
                valueB={stats.turnsB}
                highlight={
                  stats.turnsA > stats.turnsB
                    ? 'a'
                    : stats.turnsB > stats.turnsA
                      ? 'b'
                      : 'tie'
                }
              />

              <StatCell
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Fallacies"
                valueA={stats.fallaciesA}
                valueB={stats.fallaciesB}
                highlight={
                  stats.fallaciesA < stats.fallaciesB
                    ? 'a'
                    : stats.fallaciesB < stats.fallaciesA
                      ? 'b'
                      : 'tie'
                }
              />

              <StatCell
                icon={<Quote className="h-4 w-4" />}
                label="Citations"
                valueA={stats.citationsA}
                valueB={stats.citationsB}
                highlight={
                  stats.citationsA > stats.citationsB
                    ? 'a'
                    : stats.citationsB > stats.citationsA
                      ? 'b'
                      : 'tie'
                }
              />

              <StatCell
                icon={<Trophy className="h-4 w-4" />}
                label="Top Score"
                valueA={stats.overallA ? stats.overallA.toFixed(1) : '--'}
                valueB={stats.overallB ? stats.overallB.toFixed(1) : '--'}
                highlight={
                  stats.overallA > stats.overallB
                    ? 'a'
                    : stats.overallB > stats.overallA
                      ? 'b'
                      : 'tie'
                }
              />

              <StatCell
                icon={<Users className="h-4 w-4" />}
                label="Debaters"
                valueA={debateA!.debaters.length}
                valueB={debateB!.debaters.length}
                highlight={null}
              />

              <StatCell
                icon={<Clock className="h-4 w-4" />}
                label="Format"
                valueA={debateA!.format.name}
                valueB={debateB!.format.name}
                highlight={null}
              />
            </div>
          </Card>

          {/* ── Score breakdown (if both have scores) ─────────────────── */}
          {debateA!.scores &&
            debateA!.scores.length > 0 &&
            debateB!.scores &&
            debateB!.scores.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-5 px-4">
                  <BarChart3 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Score Breakdown
                  </h3>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mb-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-forge-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Debate A
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Debate B
                    </span>
                  </div>
                </div>

                <div className="space-y-4 px-4 pb-2">
                  {(
                    ['argumentation', 'evidence', 'rebuttal', 'rhetoric', 'overall'] as const
                  ).map((cat) => {
                    const bestA = debateA!.scores!.reduce((best, s) =>
                      s.categories[cat] > best.categories[cat] ? s : best,
                    );
                    const bestB = debateB!.scores!.reduce((best, s) =>
                      s.categories[cat] > best.categories[cat] ? s : best,
                    );
                    return (
                      <ScoreBar
                        key={cat}
                        label={cat}
                        scoreA={bestA.categories[cat]}
                        scoreB={bestB.categories[cat]}
                      />
                    );
                  })}
                </div>
              </Card>
            )}

          {/* ── Fallacy types detected ────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Fallacies Detected (A)
              </h4>
              {fallacyTypes(debateA!).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {fallacyTypes(debateA!).map((name) => (
                    <Badge key={name} variant="warning" size="sm">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  No fallacies detected
                </p>
              )}
            </Card>

            <Card>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Fallacies Detected (B)
              </h4>
              {fallacyTypes(debateB!).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {fallacyTypes(debateB!).map((name) => (
                    <Badge key={name} variant="warning" size="sm">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  No fallacies detected
                </p>
              )}
            </Card>
          </div>

          {/* ── Winner comparison ──────────────────────────────────────── */}
          {(stats.winnerA || stats.winnerB) && (
            <Card>
              <div className="flex items-center gap-2 mb-4 px-4">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Winners
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 px-4 pb-2">
                <div
                  className={clsx(
                    'rounded-xl border p-4 text-center',
                    'border-gray-200 dark:border-surface-dark-3',
                  )}
                >
                  {stats.winnerA ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stats.winnerA.debaterName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Overall: {stats.winnerA.categories.overall.toFixed(1)} / 10
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                      No scores available
                    </p>
                  )}
                </div>

                <div
                  className={clsx(
                    'rounded-xl border p-4 text-center',
                    'border-gray-200 dark:border-surface-dark-3',
                  )}
                >
                  {stats.winnerB ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stats.winnerB.debaterName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Overall: {stats.winnerB.categories.overall.toFixed(1)} / 10
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                      No scores available
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Prompt to select ──────────────────────────────────────────── */}
      {!bothSelected && (debateAId || debateBId ? true : false) && (
        <Card className="text-center py-8">
          <GitCompareArrows className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Select both debates to see the comparison.
          </p>
        </Card>
      )}

      {!bothSelected && !debateAId && !debateBId && (
        <Card className="text-center py-8">
          <GitCompareArrows className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Choose two completed debates above to compare them side by side.
          </p>
        </Card>
      )}
    </div>
  );
};

export default DebateComparisonView;
