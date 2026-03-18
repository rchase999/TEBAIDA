import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Swords,
  RotateCcw,
  Crown,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useStore } from '../../store';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Tooltip } from '../../components/Tooltip';
import type { ModelRating, HeadToHeadRecord } from '../../../core/elo/index';
import { h2hKey } from '../../../core/elo/index';

// ---------------------------------------------------------------------------
// Provider badge colors
// ---------------------------------------------------------------------------
const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  anthropic: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  openai: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  google: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  mistral: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  groq: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  ollama: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-400' },
  lmstudio: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
};

function getProviderStyle(provider: string) {
  return PROVIDER_COLORS[provider] ?? { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-400' };
}

// ---------------------------------------------------------------------------
// Rank display helpers
// ---------------------------------------------------------------------------
function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return null;
}

function getRankBg(rank: number): string {
  if (rank === 1) return 'bg-amber-50 dark:bg-amber-950/20';
  if (rank === 2) return 'bg-gray-50 dark:bg-gray-800/20';
  if (rank === 3) return 'bg-orange-50/50 dark:bg-orange-950/10';
  return '';
}

// ---------------------------------------------------------------------------
// ELO bar sizing (visual bar chart inline with each row)
// ---------------------------------------------------------------------------
function eloBarWidth(elo: number, maxElo: number, minElo: number): number {
  if (maxElo === minElo) return 50;
  // Map ELO range to 10%..100%
  const normalized = (elo - minElo) / (maxElo - minElo);
  return 10 + normalized * 90;
}

function eloColor(elo: number): string {
  if (elo >= 1700) return 'bg-amber-500 dark:bg-amber-400';
  if (elo >= 1600) return 'bg-emerald-500 dark:bg-emerald-400';
  if (elo >= 1500) return 'bg-blue-500 dark:bg-blue-400';
  if (elo >= 1400) return 'bg-purple-500 dark:bg-purple-400';
  return 'bg-gray-400 dark:bg-gray-500';
}

// ---------------------------------------------------------------------------
// Trend indicator
// ---------------------------------------------------------------------------
function TrendIndicator({ elo }: { elo: number }) {
  if (elo > 1500) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (elo < 1500) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400">
        <TrendingDown className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-gray-400 dark:text-gray-500">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stats summary cards
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <Card className="flex items-center gap-4">
    <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// LeaderboardView
// ---------------------------------------------------------------------------
const LeaderboardView: React.FC = () => {
  const getLeaderboard = useStore((s) => s.getLeaderboard);
  const getHeadToHeadFn = useStore((s) => s.getHeadToHead);
  const resetLeaderboard = useStore((s) => s.resetLeaderboard);
  const modelRatings = useStore((s) => s.modelRatings);

  // Re-derive leaderboard whenever modelRatings changes
  const leaderboard = useMemo(() => getLeaderboard(), [modelRatings]);

  const [h2hModelA, setH2hModelA] = useState('');
  const [h2hModelB, setH2hModelB] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Head-to-head result
  const h2hResult: HeadToHeadRecord | null = useMemo(() => {
    if (!h2hModelA || !h2hModelB || h2hModelA === h2hModelB) return null;
    return getHeadToHeadFn(h2hModelA, h2hModelB);
  }, [h2hModelA, h2hModelB, getHeadToHeadFn, modelRatings]);

  // Compute summary stats
  const totalDebates = useMemo(() => {
    let total = 0;
    for (const r of Object.values(modelRatings)) {
      total += r.wins + r.losses + r.draws;
    }
    // Each debate involves 2 participants, so divide by 2
    return Math.floor(total / 2);
  }, [modelRatings]);

  const topRated = leaderboard.length > 0 ? leaderboard[0] : null;
  const modelCount = leaderboard.length;

  const maxElo = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.elo)) : 1500;
  const minElo = leaderboard.length > 0 ? Math.min(...leaderboard.map((e) => e.elo)) : 1500;

  // Build select options for H2H picker
  const modelOptions = useMemo(
    () =>
      leaderboard.map((m) => ({
        value: m.modelId,
        label: `${m.displayName} (${m.elo})`,
      })),
    [leaderboard],
  );

  // H2H display labels
  const h2hModelAName = useMemo(
    () => modelRatings[h2hModelA]?.displayName ?? h2hModelA,
    [h2hModelA, modelRatings],
  );
  const h2hModelBName = useMemo(
    () => modelRatings[h2hModelB]?.displayName ?? h2hModelB,
    [h2hModelB, modelRatings],
  );

  // ── Empty state ──
  if (leaderboard.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-amber-100 p-6 dark:bg-amber-900/30">
              <Trophy className="h-12 w-12 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            No Ratings Yet
          </h2>
          <p className="mb-2 text-gray-500 dark:text-gray-400">
            The leaderboard tracks ELO ratings for AI models across debates.
            Complete a debate with a Housemaster verdict to see models ranked here.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Each model starts at 1500 ELO. Winning against higher-rated opponents earns more points.
          </p>
        </div>
      </div>
    );
  }

  // ── Main view ──
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Model Leaderboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ELO ratings based on debate performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-900/20">
                <span className="text-sm text-red-700 dark:text-red-400">Reset all ratings?</span>
                <Button variant="danger" size="sm" onClick={() => { resetLeaderboard(); setShowResetConfirm(false); }}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Debates"
            value={totalDebates}
            icon={<Swords className="h-5 w-5 text-white" />}
            color="bg-forge-600"
          />
          <StatCard
            label="Models Ranked"
            value={modelCount}
            icon={<BarChart3 className="h-5 w-5 text-white" />}
            color="bg-emerald-600"
          />
          <StatCard
            label="Top Rated"
            value={topRated ? `${topRated.displayName} (${topRated.elo})` : '--'}
            icon={<Crown className="h-5 w-5 text-white" />}
            color="bg-amber-600"
          />
        </div>

        {/* Leaderboard table */}
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-2">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    ELO Rating
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    W-L-D
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Win Rate
                  </th>
                  <th className="w-6 px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                {leaderboard.map((entry) => {
                  const provStyle = getProviderStyle(entry.provider);
                  return (
                    <tr
                      key={entry.modelId}
                      className={clsx(
                        'transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2',
                        getRankBg(entry.rank),
                      )}
                    >
                      {/* Rank */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank) ?? (
                            <span className="flex h-5 w-5 items-center justify-center text-sm font-medium text-gray-400 dark:text-gray-500">
                              {entry.rank}
                            </span>
                          )}
                          {entry.rank <= 3 && (
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Model name */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {entry.displayName}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {entry.modelName}
                          </span>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                            provStyle.bg,
                            provStyle.text,
                          )}
                        >
                          {entry.provider}
                        </span>
                      </td>

                      {/* ELO with bar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-right font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                            {entry.elo}
                          </span>
                          <div className="h-2.5 flex-1 rounded-full bg-gray-100 dark:bg-surface-dark-3">
                            <div
                              className={clsx('h-full rounded-full transition-all duration-500', eloColor(entry.elo))}
                              style={{ width: `${eloBarWidth(entry.elo, maxElo, minElo)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* W-L-D */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span className="font-mono text-sm">
                          <span className="text-emerald-600 dark:text-emerald-400">{entry.wins}</span>
                          <span className="text-gray-300 dark:text-gray-600"> - </span>
                          <span className="text-red-500 dark:text-red-400">{entry.losses}</span>
                          <span className="text-gray-300 dark:text-gray-600"> - </span>
                          <span className="text-gray-500 dark:text-gray-400">{entry.draws}</span>
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span
                          className={clsx(
                            'font-mono text-sm font-medium',
                            entry.winRate >= 60
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : entry.winRate >= 40
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-red-500 dark:text-red-400',
                          )}
                        >
                          {entry.totalDebates > 0 ? `${entry.winRate.toFixed(1)}%` : '--'}
                        </span>
                      </td>

                      {/* Trend */}
                      <td className="px-2 py-3">
                        <TrendIndicator elo={entry.elo} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Head-to-Head section */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Swords className="h-5 w-5 text-forge-600 dark:text-forge-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Head-to-Head Lookup
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Model A"
              options={modelOptions}
              value={h2hModelA}
              onChange={(e) => setH2hModelA(e.target.value)}
              placeholder="Select a model..."
            />
            <Select
              label="Model B"
              options={modelOptions}
              value={h2hModelB}
              onChange={(e) => setH2hModelB(e.target.value)}
              placeholder="Select a model..."
            />
          </div>

          {/* H2H result display */}
          {h2hModelA && h2hModelB && h2hModelA !== h2hModelB && (
            <div className="mt-4">
              {h2hResult ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-surface-dark-3 dark:bg-surface-dark-2">
                  <div className="flex items-center justify-between">
                    {/* Model A stats */}
                    <div className="text-center flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {h2hModelAName}
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {h2hResult.modelA === h2hModelA ? h2hResult.aWins : h2hResult.bWins}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Wins</p>
                    </div>

                    {/* Center divider */}
                    <div className="flex flex-col items-center gap-1 px-6">
                      <Swords className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {h2hResult.totalMatches} match{h2hResult.totalMatches !== 1 ? 'es' : ''}
                        </p>
                        {h2hResult.draws > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {h2hResult.draws} draw{h2hResult.draws !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Last: {new Date(h2hResult.lastPlayed).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Model B stats */}
                    <div className="text-center flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {h2hModelBName}
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {h2hResult.modelA === h2hModelB ? h2hResult.aWins : h2hResult.bWins}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Wins</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-surface-dark-3 dark:bg-surface-dark-2">
                  <Info className="mx-auto mb-2 h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    These models have not debated each other yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {h2hModelA && h2hModelB && h2hModelA === h2hModelB && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900/50 dark:bg-amber-900/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Please select two different models to compare.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardView;
