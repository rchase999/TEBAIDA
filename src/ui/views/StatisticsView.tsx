import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  BarChart3,
  Cpu,
  Users,
  AlertTriangle,
  BookOpen,
  Trophy,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Percent,
  RefreshCw,
  Flame,
  Cloud,
} from 'lucide-react';
import { useStore } from '../store';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ArgumentHeatmap } from '../components/ArgumentHeatmap';
import { DebateWordCloud } from '../components/DebateWordCloud';
import type { Debate, DebateStatus } from '../../types';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0';
  return ((numerator / denominator) * 100).toFixed(1);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/* ─── Stat Card sub-component ──────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'text-forge-600 dark:text-forge-400',
}) => (
  <Card className="flex items-center gap-4">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forge-100 dark:bg-forge-900/30">
      <Icon className={clsx('h-5 w-5', color)} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
        {value}
      </p>
      {subtext && (
        <p className="truncate text-xs text-gray-400 dark:text-gray-500">
          {subtext}
        </p>
      )}
    </div>
  </Card>
);

/* ─── Bar row sub-component (for horizontal bar charts) ────────────────────── */

interface BarRowProps {
  label: string;
  count: number;
  max: number;
  color: string;
}

const BarRow: React.FC<BarRowProps> = ({ label, count, max, color }) => {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="ml-2 shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
          {count}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/* ─── Main component ───────────────────────────────────────────────────────── */

const StatisticsView: React.FC = () => {
  const debates = useStore((s) => s.debates);

  const stats = useMemo(() => {
    /* ── Overview ── */
    const totalDebates = debates.length;
    const totalTurns = debates.reduce((sum, d) => sum + (d.turns?.length ?? 0), 0);
    const completedDebates = debates.filter((d) => d.status === 'completed');
    const completionRate =
      totalDebates > 0
        ? ((completedDebates.length / totalDebates) * 100).toFixed(1)
        : '0';
    const avgTurnsPerDebate =
      totalDebates > 0 ? (totalTurns / totalDebates).toFixed(1) : '0';

    /* ── Model usage ── */
    const modelCounts: Record<string, number> = {};
    debates.forEach((d) => {
      d.debaters?.forEach((db) => {
        if (db.position === 'housemaster') return;
        const name = db.model?.displayName ?? db.model?.name ?? 'Unknown';
        modelCounts[name] = (modelCounts[name] ?? 0) + 1;
      });
    });
    const modelUsage = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const modelMax = modelUsage[0]?.[1] ?? 0;

    /* ── Persona popularity ── */
    const personaCounts: Record<string, number> = {};
    debates.forEach((d) => {
      d.debaters?.forEach((db) => {
        if (db.position === 'housemaster') return;
        const name = db.persona?.name ?? 'Default';
        personaCounts[name] = (personaCounts[name] ?? 0) + 1;
      });
    });
    const personaUsage = Object.entries(personaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const personaMax = personaUsage[0]?.[1] ?? 0;

    /* ── Activity timeline (debates per day, last 14 days) ── */
    const dayMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }
    debates.forEach((d) => {
      const key = d.createdAt?.slice(0, 10);
      if (key && key in dayMap) {
        dayMap[key]++;
      }
    });
    const timeline = Object.entries(dayMap).map(([date, count]) => ({
      date,
      count,
    }));
    const timelineMax = Math.max(...timeline.map((t) => t.count), 1);

    /* ── Fallacy statistics ── */
    const fallacyCounts: Record<string, number> = {};
    let totalFallacies = 0;
    debates.forEach((d) => {
      d.turns?.forEach((t) => {
        t.fallacies?.forEach((f) => {
          totalFallacies++;
          const name = f.name ?? f.type ?? 'Unknown';
          fallacyCounts[name] = (fallacyCounts[name] ?? 0) + 1;
        });
      });
    });
    const fallacyUsage = Object.entries(fallacyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const fallacyMax = fallacyUsage[0]?.[1] ?? 0;

    /* ── Evidence quality ── */
    let totalCitations = 0;
    const sourceTypeCounts: Record<string, number> = {};
    debates.forEach((d) => {
      d.turns?.forEach((t) => {
        t.citations?.forEach((c) => {
          totalCitations++;
          const st = c.sourceType ?? 'unknown';
          sourceTypeCounts[st] = (sourceTypeCounts[st] ?? 0) + 1;
        });
      });
    });
    const avgCitationsPerTurn =
      totalTurns > 0 ? (totalCitations / totalTurns).toFixed(2) : '0';
    const sourceTypeUsage = Object.entries(sourceTypeCounts)
      .sort((a, b) => b[1] - a[1]);
    const sourceMax = sourceTypeUsage[0]?.[1] ?? 0;

    /* ── Win/Loss analysis ── */
    let propWins = 0;
    let oppWins = 0;
    let draws = 0;
    completedDebates.forEach((d) => {
      if (!d.scores || d.scores.length < 2) {
        draws++;
        return;
      }
      const propDebater = d.debaters?.find((db) => db.position === 'proposition');
      const oppDebater = d.debaters?.find((db) => db.position === 'opposition');
      if (!propDebater || !oppDebater) {
        draws++;
        return;
      }
      const propScore = d.scores.find((s) => s.debaterId === propDebater.id);
      const oppScore = d.scores.find((s) => s.debaterId === oppDebater.id);
      const pOverall = propScore?.categories?.overall ?? 0;
      const oOverall = oppScore?.categories?.overall ?? 0;
      if (pOverall > oOverall) propWins++;
      else if (oOverall > pOverall) oppWins++;
      else draws++;
    });
    const winTotalGames = propWins + oppWins + draws;

    /* ── Status breakdown ── */
    const statusCounts: Record<DebateStatus, number> = {
      setup: 0,
      'in-progress': 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
    };
    debates.forEach((d) => {
      if (d.status in statusCounts) statusCounts[d.status]++;
    });

    return {
      totalDebates,
      totalTurns,
      completionRate,
      avgTurnsPerDebate,
      modelUsage,
      modelMax,
      personaUsage,
      personaMax,
      timeline,
      timelineMax,
      fallacyUsage,
      fallacyMax,
      totalFallacies,
      totalCitations,
      avgCitationsPerTurn,
      sourceTypeUsage,
      sourceMax,
      propWins,
      oppWins,
      draws,
      winTotalGames,
      statusCounts,
    };
  }, [debates]);

  /* ── Empty state ── */
  if (debates.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-forge-100 p-3 dark:bg-forge-900/30">
            <BarChart3 className="h-8 w-8 text-forge-600 dark:text-forge-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            Statistics &amp; Analytics
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Insights from your debate history
          </p>
        </header>

        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center dark:border-surface-dark-4">
          <BarChart3 className="mx-auto mb-4 h-10 w-10 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            No data yet
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Complete some debates to see your analytics dashboard come alive.
          </p>
        </div>
      </div>
    );
  }

  /* ── Colors for bar charts ── */
  const MODEL_COLORS = [
    '#4c6ef5', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
  ];
  const PERSONA_COLORS = [
    '#8b5cf6', '#3b82f6', '#ef4444', '#10b981',
    '#f59e0b', '#06b6d4', '#ec4899', '#84cc16',
  ];
  const FALLACY_COLORS = [
    '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6',
    '#06b6d4', '#10b981', '#3b82f6', '#84cc16',
  ];
  const SOURCE_COLORS: Record<string, string> = {
    'peer-reviewed': '#10b981',
    government: '#3b82f6',
    news: '#f59e0b',
    blog: '#8b5cf6',
    'social-media': '#ec4899',
    unknown: '#6b7280',
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* ── Header ── */}
      <header className="mb-8">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-forge-100 p-3 dark:bg-forge-900/30">
          <BarChart3 className="h-8 w-8 text-forge-600 dark:text-forge-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          Statistics &amp; Analytics
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Insights from your debate history
        </p>
      </header>

      {/* ── 1. Overview Stats ── */}
      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Debates"
          value={stats.totalDebates}
        />
        <StatCard
          icon={Activity}
          label="Total Turns"
          value={stats.totalTurns}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Debate Length"
          value={`${stats.avgTurnsPerDebate} turns`}
        />
        <StatCard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          color="text-emerald-500"
        />
      </section>

      {/* ── Status breakdown row ── */}
      <section className="mb-10">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Debate Status Breakdown
          </h2>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ['completed', 'success'],
                ['in-progress', 'info'],
                ['paused', 'warning'],
                ['cancelled', 'error'],
                ['setup', 'default'],
              ] as [DebateStatus, 'success' | 'info' | 'warning' | 'error' | 'default'][]
            ).map(([status, variant]) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-surface-dark-3"
              >
                <Badge variant={variant} size="md">
                  {status}
                </Badge>
                <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {stats.statusCounts[status]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── 2. Model Usage  &  3. Persona Popularity (side by side) ── */}
      <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Model Usage */}
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-forge-600 dark:text-forge-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Model Usage
            </h2>
          </div>
          {stats.modelUsage.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No model data available.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.modelUsage.map(([name, count], i) => (
                <BarRow
                  key={name}
                  label={name}
                  count={count}
                  max={stats.modelMax}
                  color={MODEL_COLORS[i % MODEL_COLORS.length]}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Persona Popularity */}
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Persona Popularity
            </h2>
          </div>
          {stats.personaUsage.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No persona data available.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.personaUsage.map(([name, count], i) => (
                <BarRow
                  key={name}
                  label={name}
                  count={count}
                  max={stats.personaMax}
                  color={PERSONA_COLORS[i % PERSONA_COLORS.length]}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ── 4. Debate Activity Timeline ── */}
      <section className="mb-10">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Activity Timeline (Last 14 Days)
            </h2>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {stats.timeline.map(({ date, count }) => {
              const barHeight =
                stats.timelineMax > 0
                  ? (count / stats.timelineMax) * 100
                  : 0;
              return (
                <div
                  key={date}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: '100%' }}
                >
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-7 z-10 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover:block dark:bg-gray-700">
                    {formatDate(date)}: {count}
                  </div>
                  <div
                    className={clsx(
                      'w-full rounded-t transition-all duration-300',
                      count > 0
                        ? 'bg-forge-500 dark:bg-forge-400'
                        : 'bg-gray-200 dark:bg-surface-dark-3',
                    )}
                    style={{
                      height: count > 0 ? `${Math.max(barHeight, 6)}%` : '4%',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{formatDate(stats.timeline[0]?.date ?? '')}</span>
            <span>{formatDate(stats.timeline[stats.timeline.length - 1]?.date ?? '')}</span>
          </div>
        </Card>
      </section>

      {/* ── 5. Fallacy Statistics  &  6. Evidence Quality ── */}
      <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fallacy Statistics */}
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Fallacy Statistics
            </h2>
            <Badge variant="warning" size="sm">
              {stats.totalFallacies} total
            </Badge>
          </div>
          {stats.fallacyUsage.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No fallacies detected yet. Enable fallacy detection in Settings.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.fallacyUsage.map(([name, count], i) => (
                <BarRow
                  key={name}
                  label={name}
                  count={count}
                  max={stats.fallacyMax}
                  color={FALLACY_COLORS[i % FALLACY_COLORS.length]}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Evidence Quality */}
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Evidence Quality
            </h2>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-3 dark:border-surface-dark-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Citations
              </p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {stats.totalCitations}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-surface-dark-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Avg per Turn
              </p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {stats.avgCitationsPerTurn}
              </p>
            </div>
          </div>
          {stats.sourceTypeUsage.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No citation data available yet.
            </p>
          ) : (
            <>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Source Type Distribution
              </h3>
              <div className="space-y-3">
                {stats.sourceTypeUsage.map(([type, count]) => (
                  <BarRow
                    key={type}
                    label={type.replace('-', ' ')}
                    count={count}
                    max={stats.sourceMax}
                    color={SOURCE_COLORS[type] ?? '#6b7280'}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
      </section>

      {/* ── 7. Win/Loss Analysis ── */}
      <section className="mb-10">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Win / Loss Analysis
            </h2>
          </div>

          {stats.winTotalGames === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No completed debates with scores yet.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Visual distribution bar */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Proposition
                  </span>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    Draws
                  </span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    Opposition
                  </span>
                </div>
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${pct(stats.propWins, stats.winTotalGames)}%`,
                    }}
                  />
                  <div
                    className="bg-gray-400 transition-all duration-500 dark:bg-gray-500"
                    style={{
                      width: `${pct(stats.draws, stats.winTotalGames)}%`,
                    }}
                  />
                  <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{
                      width: `${pct(stats.oppWins, stats.winTotalGames)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                    {stats.propWins}
                  </p>
                  <p className="text-xs font-medium text-blue-500 dark:text-blue-400">
                    Proposition Wins ({pct(stats.propWins, stats.winTotalGames)}%)
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-surface-dark-3 dark:bg-surface-dark-2">
                  <p className="text-2xl font-bold tabular-nums text-gray-600 dark:text-gray-300">
                    {stats.draws}
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Draws ({pct(stats.draws, stats.winTotalGames)}%)
                  </p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-900/20">
                  <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                    {stats.oppWins}
                  </p>
                  <p className="text-xs font-medium text-rose-500 dark:text-rose-400">
                    Opposition Wins ({pct(stats.oppWins, stats.winTotalGames)}%)
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ── 8. Activity Heatmap ── */}
      <section className="mb-10">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Activity Heatmap (Last 12 Weeks)
            </h2>
          </div>
          <ArgumentHeatmap debates={debates} />
        </Card>
      </section>

      {/* ── 9. Word Cloud ── */}
      <section className="mb-10">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-sky-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Debate Word Cloud
            </h2>
          </div>
          <DebateWordCloud
            text={debates.map((d) => d.turns?.map((t) => t.content).join(' ') ?? '').join(' ')}
            maxWords={40}
          />
        </Card>
      </section>
    </div>
  );
};

export default StatisticsView;
