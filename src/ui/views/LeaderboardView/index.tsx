import React, { useState, useMemo, useCallback } from 'react';
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
  Flame,
  Star,
  Shield,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Hash,
  Zap,
  Target,
  Users,
} from 'lucide-react';
import { useStore } from '../../store';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Tooltip } from '../../components/Tooltip';
import type { ModelRating, HeadToHeadRecord } from '../../../core/elo/index';
import { h2hKey } from '../../../core/elo/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LeaderboardEntry = ModelRating & {
  rank: number;
  winRate: number;
  totalDebates: number;
};

type SortField = 'rank' | 'elo' | 'winRate' | 'totalDebates' | 'wins' | 'losses';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Provider theme configuration
// ---------------------------------------------------------------------------
const PROVIDER_THEME: Record<
  string,
  { bg: string; text: string; border: string; gradient: string; label: string }
> = {
  anthropic: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-blue-600',
    label: 'Anthropic',
  },
  openai: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-emerald-600',
    label: 'OpenAI',
  },
  google: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-red-600',
    label: 'Google',
  },
  mistral: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-purple-600',
    label: 'Mistral',
  },
  groq: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
    gradient: 'from-cyan-500 to-cyan-600',
    label: 'Groq',
  },
  ollama: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-500 to-orange-600',
    label: 'Ollama',
  },
  lmstudio: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
    gradient: 'from-pink-500 to-pink-600',
    label: 'LM Studio',
  },
};

function getProviderTheme(provider: string) {
  return (
    PROVIDER_THEME[provider] ?? {
      bg: 'bg-gray-100 dark:bg-gray-700/30',
      text: 'text-gray-700 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700',
      gradient: 'from-gray-500 to-gray-600',
      label: provider.charAt(0).toUpperCase() + provider.slice(1),
    }
  );
}

// ---------------------------------------------------------------------------
// Relative time formatter
// ---------------------------------------------------------------------------
function relativeTime(dateStr: string): string {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// ---------------------------------------------------------------------------
// ELO visual helpers
// ---------------------------------------------------------------------------
function eloBarWidth(elo: number, maxElo: number, minElo: number): number {
  if (maxElo === minElo) return 50;
  const normalized = (elo - minElo) / (maxElo - minElo);
  return 10 + normalized * 90;
}

function eloTierColor(elo: number): string {
  if (elo >= 1800) return 'from-amber-400 to-yellow-500';
  if (elo >= 1700) return 'from-amber-500 to-orange-500';
  if (elo >= 1600) return 'from-emerald-400 to-emerald-600';
  if (elo >= 1500) return 'from-blue-400 to-blue-600';
  if (elo >= 1400) return 'from-purple-400 to-purple-600';
  return 'from-gray-400 to-gray-500';
}

function eloTierLabel(elo: number): string {
  if (elo >= 1800) return 'Legendary';
  if (elo >= 1700) return 'Grandmaster';
  if (elo >= 1600) return 'Master';
  if (elo >= 1500) return 'Expert';
  if (elo >= 1400) return 'Skilled';
  return 'Novice';
}

function eloSolidColor(elo: number): string {
  if (elo >= 1700) return 'bg-amber-500 dark:bg-amber-400';
  if (elo >= 1600) return 'bg-emerald-500 dark:bg-emerald-400';
  if (elo >= 1500) return 'bg-blue-500 dark:bg-blue-400';
  if (elo >= 1400) return 'bg-purple-500 dark:bg-purple-400';
  return 'bg-gray-400 dark:bg-gray-500';
}

function winRateColor(rate: number): string {
  if (rate >= 70) return 'bg-emerald-500';
  if (rate >= 55) return 'bg-blue-500';
  if (rate >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function winRateTextColor(rate: number): string {
  if (rate >= 60) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 40) return 'text-gray-700 dark:text-gray-300';
  return 'text-red-500 dark:text-red-400';
}

// ---------------------------------------------------------------------------
// Trend Indicator
// ---------------------------------------------------------------------------
const TrendIndicator: React.FC<{ elo: number }> = ({ elo }) => {
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
};

// ---------------------------------------------------------------------------
// Medal / Podium helpers
// ---------------------------------------------------------------------------
const PODIUM_CONFIG = [
  {
    rank: 2,
    height: 'h-28',
    medal: 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-400 dark:to-gray-500',
    medalIcon: <Medal className="h-5 w-5 text-white" />,
    border: 'border-gray-300 dark:border-gray-500',
    glow: '',
    bg: 'bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800/60 dark:to-gray-800/30',
    label: 'Silver',
    textAccent: 'text-gray-500 dark:text-gray-400',
  },
  {
    rank: 1,
    height: 'h-36',
    medal:
      'bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-400 dark:to-yellow-500 shadow-lg shadow-amber-500/30',
    medalIcon: <Crown className="h-6 w-6 text-white" />,
    border: 'border-amber-400 dark:border-amber-500',
    glow: 'shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10',
    bg: 'bg-gradient-to-b from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/20',
    label: 'Gold',
    textAccent: 'text-amber-600 dark:text-amber-400',
  },
  {
    rank: 3,
    height: 'h-24',
    medal: 'bg-gradient-to-br from-amber-700 to-orange-800 dark:from-amber-600 dark:to-orange-700',
    medalIcon: <Medal className="h-5 w-5 text-white" />,
    border: 'border-amber-700 dark:border-amber-600',
    glow: '',
    bg: 'bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
    label: 'Bronze',
    textAccent: 'text-amber-700 dark:text-amber-500',
  },
];

// ---------------------------------------------------------------------------
// Podium Card sub-component
// ---------------------------------------------------------------------------
interface PodiumCardProps {
  entry: LeaderboardEntry;
  config: (typeof PODIUM_CONFIG)[number];
}

const PodiumCard: React.FC<PodiumCardProps> = ({ entry, config }) => {
  const provTheme = getProviderTheme(entry.provider);

  return (
    <div className="flex flex-col items-center">
      {/* Medal circle */}
      <div
        className={clsx(
          'relative mb-3 flex items-center justify-center rounded-full',
          config.rank === 1 ? 'h-16 w-16' : 'h-12 w-12',
          config.medal,
        )}
      >
        {config.medalIcon}
        {config.rank === 1 && (
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Card body */}
      <div
        className={clsx(
          'w-full rounded-xl border-2 p-4 text-center transition-all duration-300',
          config.border,
          config.bg,
          config.glow,
        )}
      >
        {/* Rank badge */}
        <div className={clsx('mb-2 text-xs font-bold uppercase tracking-widest', config.textAccent)}>
          {config.label}
        </div>

        {/* Model name */}
        <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-gray-100 truncate">
          {entry.displayName}
        </h3>

        {/* Provider */}
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize mb-3',
            provTheme.bg,
            provTheme.text,
          )}
        >
          {provTheme.label}
        </span>

        {/* ELO */}
        <div className="mb-2">
          <span className="text-2xl font-black tabular-nums text-gray-900 dark:text-gray-100">
            {entry.elo}
          </span>
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">ELO</span>
        </div>

        {/* Win rate bar */}
        <div className="mb-1.5">
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-700', winRateColor(entry.winRate))}
              style={{ width: `${Math.min(entry.winRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{entry.wins}W</span>
          <span className="text-red-500 dark:text-red-400 font-semibold">{entry.losses}L</span>
          <span className="text-gray-500 dark:text-gray-400 font-semibold">{entry.draws}D</span>
        </div>
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {entry.totalDebates > 0 ? `${entry.winRate.toFixed(1)}% win rate` : 'No debates'}
        </div>
      </div>

      {/* Podium bar */}
      <div
        className={clsx(
          'mt-2 w-full rounded-t-lg bg-gradient-to-t transition-all duration-500',
          config.rank === 1
            ? 'from-amber-500/30 to-amber-400/10 dark:from-amber-500/20 dark:to-amber-400/5'
            : config.rank === 2
            ? 'from-gray-400/30 to-gray-300/10 dark:from-gray-500/20 dark:to-gray-400/5'
            : 'from-orange-500/30 to-orange-400/10 dark:from-orange-500/20 dark:to-orange-400/5',
          config.height,
        )}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Summary Stat Card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subtitle }) => (
  <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
    {/* Decorative gradient bar */}
    <div className={clsx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', color)} />
    <div className="flex items-center gap-4 pt-1">
      <div
        className={clsx(
          'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
          color,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Sort Header sub-component
// ---------------------------------------------------------------------------
interface SortHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  align?: 'left' | 'center' | 'right';
}

const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  align = 'left',
}) => {
  const isActive = currentField === field;
  return (
    <th
      className={clsx(
        'px-4 py-3.5 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors',
        'hover:text-gray-700 dark:hover:text-gray-200',
        isActive ? 'text-forge-600 dark:text-forge-400' : 'text-gray-500 dark:text-gray-400',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
      )}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === 'desc' ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </th>
  );
};

// ---------------------------------------------------------------------------
// Main LeaderboardView
// ---------------------------------------------------------------------------
const LeaderboardView: React.FC = () => {
  const getLeaderboard = useStore((s) => s.getLeaderboard);
  const getHeadToHeadFn = useStore((s) => s.getHeadToHead);
  const resetLeaderboard = useStore((s) => s.resetLeaderboard);
  const modelRatings = useStore((s) => s.modelRatings);

  // Re-derive leaderboard whenever modelRatings changes
  const leaderboard = useMemo(() => getLeaderboard(), [modelRatings]);

  // --- Local state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [h2hModelA, setH2hModelA] = useState('');
  const [h2hModelB, setH2hModelB] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // --- Sort handler ---
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        // Default: descending for most fields, ascending for rank
        setSortDir(field === 'rank' ? 'asc' : 'desc');
      }
    },
    [sortField],
  );

  // --- Filtered + sorted entries ---
  const filteredEntries = useMemo(() => {
    let entries = [...leaderboard];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      entries = entries.filter(
        (e) =>
          e.displayName.toLowerCase().includes(q) ||
          e.modelName.toLowerCase().includes(q) ||
          e.provider.toLowerCase().includes(q),
      );
    }

    // Sort
    entries.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'rank':
          cmp = a.rank - b.rank;
          break;
        case 'elo':
          cmp = a.elo - b.elo;
          break;
        case 'winRate':
          cmp = a.winRate - b.winRate;
          break;
        case 'totalDebates':
          cmp = a.totalDebates - b.totalDebates;
          break;
        case 'wins':
          cmp = a.wins - b.wins;
          break;
        case 'losses':
          cmp = a.losses - b.losses;
          break;
        default:
          cmp = a.rank - b.rank;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return entries;
  }, [leaderboard, searchQuery, sortField, sortDir]);

  // --- Head-to-head ---
  const h2hResult: HeadToHeadRecord | null = useMemo(() => {
    if (!h2hModelA || !h2hModelB || h2hModelA === h2hModelB) return null;
    return getHeadToHeadFn(h2hModelA, h2hModelB);
  }, [h2hModelA, h2hModelB, getHeadToHeadFn, modelRatings]);

  const h2hModelAName = useMemo(
    () => modelRatings[h2hModelA]?.displayName ?? h2hModelA,
    [h2hModelA, modelRatings],
  );
  const h2hModelBName = useMemo(
    () => modelRatings[h2hModelB]?.displayName ?? h2hModelB,
    [h2hModelB, modelRatings],
  );
  const h2hModelARating = useMemo(() => modelRatings[h2hModelA], [h2hModelA, modelRatings]);
  const h2hModelBRating = useMemo(() => modelRatings[h2hModelB], [h2hModelB, modelRatings]);

  // --- Aggregate stats ---
  const totalDebates = useMemo(() => {
    let total = 0;
    for (const r of Object.values(modelRatings)) {
      total += r.wins + r.losses + r.draws;
    }
    return Math.floor(total / 2);
  }, [modelRatings]);

  const topRated = leaderboard.length > 0 ? leaderboard[0] : null;
  const modelCount = leaderboard.length;
  const maxElo = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.elo)) : 1500;
  const minElo = leaderboard.length > 0 ? Math.min(...leaderboard.map((e) => e.elo)) : 1500;

  const avgElo = useMemo(() => {
    if (leaderboard.length === 0) return 1500;
    return Math.round(leaderboard.reduce((sum, e) => sum + e.elo, 0) / leaderboard.length);
  }, [leaderboard]);

  // Head-to-head dropdown options
  const modelOptions = useMemo(
    () =>
      leaderboard.map((m) => ({
        value: m.modelId,
        label: `#${m.rank} ${m.displayName} (${m.elo})`,
      })),
    [leaderboard],
  );

  // Top 3 for podium
  const podiumEntries = useMemo(() => {
    const top = leaderboard.slice(0, 3);
    // Arrange: [#2, #1, #3] for visual podium layout
    const arranged: (LeaderboardEntry | null)[] = [null, null, null];
    for (const entry of top) {
      if (entry.rank === 1) arranged[1] = entry;
      else if (entry.rank === 2) arranged[0] = entry;
      else if (entry.rank === 3) arranged[2] = entry;
    }
    return arranged;
  }, [leaderboard]);

  // =====================================================================
  // EMPTY STATE
  // =====================================================================
  if (leaderboard.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          {/* Animated trophy icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
              <div className="relative rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 p-8 dark:from-amber-900/40 dark:to-yellow-900/30 shadow-lg">
                <Trophy className="h-16 w-16 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
            </div>
          </div>

          <h2 className="mb-3 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            No Ratings Yet
          </h2>
          <p className="mb-4 text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            The leaderboard tracks ELO ratings for AI models across debates.
            Complete a debate with a Housemaster verdict to see models ranked here.
          </p>
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 mt-0.5 text-amber-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  How ELO works
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Each model starts at 1500 ELO. Winning against higher-rated opponents earns more
                  points. The system uses a K-factor of 32 for meaningful rating changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // MAIN VIEW
  // =====================================================================
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-7xl space-y-8 p-6 pb-12">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 blur-lg opacity-40" />
              <div className="relative rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 p-3 shadow-lg">
                <Trophy className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                Model Leaderboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ELO rankings powered by debate performance across{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {totalDebates}
                </span>{' '}
                debate{totalDebates !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResetModal(true)}
            icon={<RotateCcw className="h-4 w-4" />}
            className="self-start sm:self-auto"
          >
            Reset Ratings
          </Button>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Debates"
            value={totalDebates}
            icon={<Swords className="h-5 w-5 text-white" />}
            color="from-forge-500 to-forge-700"
            subtitle={`${modelCount} models competing`}
          />
          <StatCard
            label="Models Ranked"
            value={modelCount}
            icon={<Users className="h-5 w-5 text-white" />}
            color="from-emerald-500 to-emerald-700"
            subtitle={`Avg ELO: ${avgElo}`}
          />
          <StatCard
            label="Top Rated"
            value={topRated ? topRated.displayName : '--'}
            icon={<Crown className="h-5 w-5 text-white" />}
            color="from-amber-400 to-amber-600"
            subtitle={topRated ? `${topRated.elo} ELO - ${eloTierLabel(topRated.elo)}` : undefined}
          />
          <StatCard
            label="Highest ELO"
            value={topRated ? topRated.elo : '--'}
            icon={<Flame className="h-5 w-5 text-white" />}
            color="from-red-500 to-orange-600"
            subtitle={topRated ? `${topRated.winRate.toFixed(1)}% win rate` : undefined}
          />
        </div>

        {/* ── Top 3 Podium ── */}
        {leaderboard.length >= 2 && (
          <Card className="!p-6 overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-5 dark:opacity-[0.03] pointer-events-none">
              <div className="absolute top-4 right-8">
                <Trophy className="h-32 w-32 text-amber-500" />
              </div>
            </div>

            <div className="relative">
              <div className="mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Champions Podium
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-4 items-end">
                {PODIUM_CONFIG.map((config, idx) => {
                  const entry = podiumEntries[idx];
                  if (!entry) return <div key={config.rank} />;
                  return <PodiumCard key={entry.modelId} entry={entry} config={config} />;
                })}
              </div>
            </div>
          </Card>
        )}

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Search models, providers..."
              icon={<Search className="h-4 w-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-4 w-4" />
            <span>
              Showing {filteredEntries.length} of {leaderboard.length} models
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 rounded px-1.5 py-0.5 text-xs text-forge-600 hover:bg-forge-50 dark:text-forge-400 dark:hover:bg-forge-900/20 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Rankings Table ── */}
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-surface-dark-3 dark:bg-surface-dark-2/80 backdrop-blur-sm">
                  <SortHeader
                    label="Rank"
                    field="rank"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Model
                  </th>
                  <SortHeader
                    label="ELO Rating"
                    field="elo"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="W / L / D"
                    field="wins"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <SortHeader
                    label="Win Rate"
                    field="winRate"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortHeader
                    label="Debates"
                    field="totalDebates"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Last Played
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Search className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No models match &quot;{searchQuery}&quot;
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const provTheme = getProviderTheme(entry.provider);
                    const isTopThree = entry.rank <= 3;

                    return (
                      <tr
                        key={entry.modelId}
                        className={clsx(
                          'group transition-colors duration-150',
                          'hover:bg-gray-50/80 dark:hover:bg-surface-dark-2/50',
                          isTopThree && entry.rank === 1 && 'bg-amber-50/30 dark:bg-amber-950/10',
                          isTopThree && entry.rank === 2 && 'bg-gray-50/30 dark:bg-gray-800/10',
                          isTopThree && entry.rank === 3 && 'bg-orange-50/20 dark:bg-orange-950/5',
                        )}
                      >
                        {/* Rank */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {entry.rank === 1 ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-sm">
                                <Crown className="h-4 w-4 text-white" />
                              </div>
                            ) : entry.rank === 2 ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-400 dark:to-gray-500 shadow-sm">
                                <Medal className="h-4 w-4 text-white" />
                              </div>
                            ) : entry.rank === 3 ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-orange-800 dark:from-amber-600 dark:to-orange-700 shadow-sm">
                                <Medal className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-surface-dark-3">
                                <span className="text-sm font-bold tabular-nums text-gray-500 dark:text-gray-400">
                                  {entry.rank}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Model + Provider */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {entry.displayName}
                                </span>
                                <TrendIndicator elo={entry.elo} />
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span
                                  className={clsx(
                                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                                    provTheme.bg,
                                    provTheme.text,
                                  )}
                                >
                                  {provTheme.label}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                  {entry.modelName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ELO with bar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <span className="w-12 text-right font-mono text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                              {entry.elo}
                            </span>
                            <div className="flex-1">
                              <div className="h-2 rounded-full bg-gray-100 dark:bg-surface-dark-3 overflow-hidden">
                                <div
                                  className={clsx(
                                    'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
                                    eloTierColor(entry.elo),
                                  )}
                                  style={{ width: `${eloBarWidth(entry.elo, maxElo, minElo)}%` }}
                                />
                              </div>
                              <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                {eloTierLabel(entry.elo)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* W-L-D */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-surface-dark-2">
                            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {entry.wins}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">/</span>
                            <span className="font-mono text-sm font-bold text-red-500 dark:text-red-400">
                              {entry.losses}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">/</span>
                            <span className="font-mono text-sm font-bold text-gray-500 dark:text-gray-400">
                              {entry.draws}
                            </span>
                          </div>
                        </td>

                        {/* Win Rate with progress bar */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={clsx(
                                'font-mono text-sm font-bold tabular-nums',
                                entry.totalDebates > 0
                                  ? winRateTextColor(entry.winRate)
                                  : 'text-gray-400 dark:text-gray-500',
                              )}
                            >
                              {entry.totalDebates > 0 ? `${entry.winRate.toFixed(1)}%` : '--'}
                            </span>
                            {entry.totalDebates > 0 && (
                              <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className={clsx(
                                    'h-full rounded-full transition-all duration-500',
                                    winRateColor(entry.winRate),
                                  )}
                                  style={{ width: `${Math.min(entry.winRate, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Total Debates */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                            <Target className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="font-semibold tabular-nums">{entry.totalDebates}</span>
                          </span>
                        </td>

                        {/* Last Played */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {relativeTime(entry.lastPlayed)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Head-to-Head Comparison ── */}
        <Card className="relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Swords className="h-48 w-48 text-gray-500" />
            </div>
          </div>

          <div className="relative">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-forge-500 to-forge-700 p-2">
                <Swords className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Head-to-Head Comparison
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Compare the direct record between any two models
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Model A"
                options={modelOptions}
                value={h2hModelA}
                onChange={(e) => setH2hModelA(e.target.value)}
                placeholder="Select first model..."
              />
              <Select
                label="Model B"
                options={modelOptions}
                value={h2hModelB}
                onChange={(e) => setH2hModelB(e.target.value)}
                placeholder="Select second model..."
              />
            </div>

            {/* H2H result display */}
            {h2hModelA && h2hModelB && h2hModelA !== h2hModelB && (
              <div className="mt-5">
                {h2hResult ? (
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6 dark:border-surface-dark-3 dark:from-surface-dark-2 dark:via-surface-dark-1 dark:to-surface-dark-2">
                    <div className="flex items-center justify-between gap-4">
                      {/* Model A side */}
                      <div className="flex-1 text-center">
                        <div className="mb-2">
                          {h2hModelARating && (
                            <span
                              className={clsx(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                                getProviderTheme(h2hModelARating.provider).bg,
                                getProviderTheme(h2hModelARating.provider).text,
                              )}
                            >
                              {getProviderTheme(h2hModelARating.provider).label}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">
                          {h2hModelAName}
                        </p>
                        {h2hModelARating && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {h2hModelARating.elo} ELO
                          </p>
                        )}
                        <div className="mt-3">
                          <p
                            className={clsx(
                              'text-4xl font-black tabular-nums',
                              (h2hResult.modelA === h2hModelA ? h2hResult.aWins : h2hResult.bWins) >
                                (h2hResult.modelA === h2hModelA ? h2hResult.bWins : h2hResult.aWins)
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : (h2hResult.modelA === h2hModelA ? h2hResult.aWins : h2hResult.bWins) <
                                  (h2hResult.modelA === h2hModelA ? h2hResult.bWins : h2hResult.aWins)
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-300',
                            )}
                          >
                            {h2hResult.modelA === h2hModelA ? h2hResult.aWins : h2hResult.bWins}
                          </p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                            Wins
                          </p>
                        </div>
                      </div>

                      {/* Center divider */}
                      <div className="flex flex-col items-center gap-2 px-4">
                        <div className="rounded-full bg-gray-100 p-3 dark:bg-surface-dark-3">
                          <Swords className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {h2hResult.totalMatches}
                          </p>
                          <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Match{h2hResult.totalMatches !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        {h2hResult.draws > 0 && (
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                              {h2hResult.draws}
                            </p>
                            <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                              Draw{h2hResult.draws !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {relativeTime(h2hResult.lastPlayed)}
                          </p>
                        </div>

                        {/* Win dominance bar */}
                        <div className="w-24 mt-1">
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
                            {(() => {
                              const aWins = h2hResult.modelA === h2hModelA ? h2hResult.aWins : h2hResult.bWins;
                              const bWins = h2hResult.modelA === h2hModelA ? h2hResult.bWins : h2hResult.aWins;
                              const total = aWins + bWins + h2hResult.draws;
                              if (total === 0) return null;
                              return (
                                <>
                                  <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${(aWins / total) * 100}%` }}
                                  />
                                  <div
                                    className="h-full bg-gray-400 transition-all duration-500"
                                    style={{ width: `${(h2hResult.draws / total) * 100}%` }}
                                  />
                                  <div
                                    className="h-full bg-red-500 transition-all duration-500"
                                    style={{ width: `${(bWins / total) * 100}%` }}
                                  />
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Model B side */}
                      <div className="flex-1 text-center">
                        <div className="mb-2">
                          {h2hModelBRating && (
                            <span
                              className={clsx(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                                getProviderTheme(h2hModelBRating.provider).bg,
                                getProviderTheme(h2hModelBRating.provider).text,
                              )}
                            >
                              {getProviderTheme(h2hModelBRating.provider).label}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">
                          {h2hModelBName}
                        </p>
                        {h2hModelBRating && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {h2hModelBRating.elo} ELO
                          </p>
                        )}
                        <div className="mt-3">
                          <p
                            className={clsx(
                              'text-4xl font-black tabular-nums',
                              (h2hResult.modelA === h2hModelB ? h2hResult.aWins : h2hResult.bWins) >
                                (h2hResult.modelA === h2hModelB ? h2hResult.bWins : h2hResult.aWins)
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : (h2hResult.modelA === h2hModelB ? h2hResult.aWins : h2hResult.bWins) <
                                  (h2hResult.modelA === h2hModelB ? h2hResult.bWins : h2hResult.aWins)
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-300',
                            )}
                          >
                            {h2hResult.modelA === h2hModelB ? h2hResult.aWins : h2hResult.bWins}
                          </p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                            Wins
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-600 dark:bg-gray-800/30">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-gray-100 p-3 dark:bg-surface-dark-3">
                        <Shield className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          No matches found
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {h2hModelAName} and {h2hModelBName} have not debated each other yet.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {h2hModelA && h2hModelB && h2hModelA === h2hModelB && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Please select two different models to compare their head-to-head record.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Reset Confirmation Modal ── */}
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title="Reset Leaderboard"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  This action cannot be undone
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  All ELO ratings, win/loss records, and head-to-head history for{' '}
                  <span className="font-semibold">{modelCount} model{modelCount !== 1 ? 's' : ''}</span> across{' '}
                  <span className="font-semibold">{totalDebates} debate{totalDebates !== 1 ? 's' : ''}</span> will
                  be permanently erased. All models will return to 1500 ELO.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  resetLeaderboard();
                  setShowResetModal(false);
                }}
              >
                Reset All Ratings
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default LeaderboardView;
