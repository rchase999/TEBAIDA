import React, { useMemo, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  User,
  Edit3,
  Save,
  X,
  Trophy,
  MessageSquare,
  FileText,
  Cpu,
  Calendar,
  Settings,
  Palette,
  Globe,
  ChevronRight,
  BarChart3,
  Clock,
  Target,
  Play,
  CheckCircle,
  Percent,
} from 'lucide-react';
import { useStore } from '../store';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { DebateStreakTracker } from '../components/DebateStreakTracker';
import type { Debate, DebateFormat, DebateStatus } from '../../types';

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  avatarColor: string;
  createdAt: string;
}

/* ─── Constants ────────────────────────────────────────────────────────────── */

const PROFILE_KEY = 'debateforge-profile';
const BIO_MAX = 160;

const FORMAT_LABELS: Record<DebateFormat, string> = {
  'oxford-union': 'Oxford Union',
  'lincoln-douglas': 'Lincoln-Douglas',
  parliamentary: 'Parliamentary',
};

const FORMAT_COLORS: Record<DebateFormat, string> = {
  'oxford-union': '#4c6ef5',
  'lincoln-douglas': '#10b981',
  parliamentary: '#f59e0b',
};

const STATUS_VARIANT: Record<DebateStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  setup: 'default',
  'in-progress': 'info',
  paused: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const STATUS_ICONS: Record<DebateStatus, React.FC<{ className?: string }>> = {
  setup: Target,
  'in-progress': Play,
  paused: Clock,
  completed: Trophy,
  cancelled: X,
};

const THEME_LABELS: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch {
    // corrupted data
  }
  return {
    displayName: 'Debater',
    username: 'debater',
    bio: '',
    avatarColor: '#4c6ef5',
    createdAt: new Date().toISOString(),
  };
}

function persistProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage full or unavailable
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatShortDate(iso);
  } catch {
    return iso;
  }
}

/* ─── Stat Card ────────────────────────────────────────────────────────────── */

interface ProfileStatCardProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  bgColor?: string;
}

const ProfileStatCard: React.FC<ProfileStatCardProps> = ({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'text-forge-600 dark:text-forge-400',
  bgColor = 'bg-forge-100 dark:bg-forge-900/30',
}) => (
  <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {subtext && (
          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
            {subtext}
          </p>
        )}
      </div>
      <div
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
          bgColor,
        )}
      >
        <Icon className={clsx('h-5 w-5', color)} />
      </div>
    </div>
    <div className={clsx('absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-5 transition-opacity group-hover:opacity-10', bgColor)} />
  </Card>
);

/* ─── Format Distribution Bar ──────────────────────────────────────────────── */

interface FormatBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const FormatBar: React.FC<FormatBarProps> = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="ml-2 shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/* ─── Main Component ───────────────────────────────────────────────────────── */

const ProfileView: React.FC = () => {
  const debates = useStore((s) => s.debates);
  const theme = useStore((s) => s.theme);
  const settings = useStore((s) => s.settings);
  const navigateTo = useStore((s) => s.navigateTo);

  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);

  // Sync profile from localStorage on mount
  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setDraft(loaded);
  }, []);

  const startEdit = useCallback(() => {
    setDraft({ ...profile });
    setEditing(true);
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setDraft({ ...profile });
    setEditing(false);
  }, [profile]);

  const saveProfile = useCallback(() => {
    const trimmed: UserProfile = {
      ...draft,
      displayName: draft.displayName.trim() || 'Debater',
      username: draft.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'debater',
      bio: draft.bio.slice(0, BIO_MAX),
    };
    setProfile(trimmed);
    setDraft(trimmed);
    persistProfile(trimmed);
    setEditing(false);
  }, [draft]);

  /* ─── Computed stats ─── */
  const stats = useMemo(() => {
    const totalDebates = debates.length;

    // Win rate: from completed debates that have scores
    const completedWithScores = debates.filter(
      (d) => d.status === 'completed' && d.scores && d.scores.length >= 2,
    );
    let wins = 0;
    completedWithScores.forEach((d) => {
      if (!d.scores || d.scores.length < 2) return;
      const propDebater = d.debaters?.find((db) => db.position === 'proposition');
      const oppDebater = d.debaters?.find((db) => db.position === 'opposition');
      if (!propDebater || !oppDebater) return;
      const propScore = d.scores.find((s) => s.debaterId === propDebater.id);
      const oppScore = d.scores.find((s) => s.debaterId === oppDebater.id);
      const pOverall = propScore?.categories?.overall ?? 0;
      const oOverall = oppScore?.categories?.overall ?? 0;
      if (pOverall !== oOverall) wins++;
    });
    const winRate =
      completedWithScores.length > 0
        ? ((wins / completedWithScores.length) * 100).toFixed(1)
        : '0.0';

    // Total words written
    const totalWords = debates.reduce((sum, d) => {
      return (
        sum +
        (d.turns?.reduce((tSum, t) => {
          const wordCount = t.content?.split(/\s+/).filter(Boolean).length ?? 0;
          return tSum + wordCount;
        }, 0) ?? 0)
      );
    }, 0);

    // Favorite model (most used)
    const modelCounts: Record<string, number> = {};
    debates.forEach((d) => {
      d.debaters?.forEach((db) => {
        if (db.position === 'housemaster') return;
        const name = db.model?.displayName ?? db.model?.name ?? 'Unknown';
        modelCounts[name] = (modelCounts[name] ?? 0) + 1;
      });
    });
    const favoriteModel =
      Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None yet';

    // Format distribution
    const formatCounts: Record<string, number> = {};
    debates.forEach((d) => {
      const fmt = d.format?.id;
      if (fmt) formatCounts[fmt] = (formatCounts[fmt] ?? 0) + 1;
    });

    // Recent 5 debates
    const recentDebates = [...debates]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalDebates,
      winRate,
      totalWords,
      favoriteModel,
      formatCounts,
      recentDebates,
      completedCount: completedWithScores.length,
    };
  }, [debates]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* ── Header ── */}
      <header className="mb-8">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-forge-100 p-3 dark:bg-forge-900/30">
          <User className="h-8 w-8 text-forge-600 dark:text-forge-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          Profile
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Your DebateForge identity and stats
        </p>
      </header>

      {/* ── Profile Header Card ── */}
      <section className="mb-8">
        <Card variant="gradient" padding="lg">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar
                name={profile.displayName}
                color={profile.avatarColor}
                size="xl"
                className="ring-4 ring-white/50 dark:ring-surface-dark-3/50 shadow-lg"
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-3">
                  {/* Display name */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={draft.displayName}
                      onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                      maxLength={40}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-lg font-bold text-gray-900 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-100"
                      placeholder="Your display name"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Username
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-400 dark:text-gray-500">@</span>
                      <input
                        type="text"
                        value={draft.username}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                          })
                        }
                        maxLength={24}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-300"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Bio
                    </label>
                    <textarea
                      value={draft.bio}
                      onChange={(e) => setDraft({ ...draft, bio: e.target.value.slice(0, BIO_MAX) })}
                      maxLength={BIO_MAX}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-300"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="mt-0.5 text-right text-xs tabular-nums text-gray-400 dark:text-gray-500">
                      {draft.bio.length}/{BIO_MAX}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Save className="h-4 w-4" />}
                      onClick={saveProfile}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<X className="h-4 w-4" />}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                        {profile.displayName}
                      </h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        @{profile.username}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit3 className="h-4 w-4" />}
                      onClick={startEdit}
                    >
                      Edit Profile
                    </Button>
                  </div>

                  {profile.bio ? (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-gray-400 dark:text-gray-500">
                      No bio yet. Click "Edit Profile" to add one.
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Member since {formatDate(profile.createdAt)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ── Stats Grid ── */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileStatCard
          icon={FileText}
          label="Total Debates"
          value={stats.totalDebates}
          color="text-forge-600 dark:text-forge-400"
          bgColor="bg-forge-100 dark:bg-forge-900/30"
        />
        <ProfileStatCard
          icon={Percent}
          label="Win Rate"
          value={`${stats.winRate}%`}
          subtext={`${stats.completedCount} scored debate${stats.completedCount !== 1 ? 's' : ''}`}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <ProfileStatCard
          icon={MessageSquare}
          label="Words Written"
          value={stats.totalWords.toLocaleString()}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <ProfileStatCard
          icon={Cpu}
          label="Favorite Model"
          value={stats.favoriteModel}
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
        />
      </section>

      {/* ── Achievement Badges ── */}
      <section className="mb-8">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Achievements &amp; Streaks
            </h2>
          </div>
          {debates.length > 0 ? (
            <DebateStreakTracker debates={debates} />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center dark:border-surface-dark-4">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete your first debate to start earning achievements.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* ── Debate History Summary ── */}
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Format Distribution */}
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-forge-600 dark:text-forge-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Format Distribution
            </h2>
          </div>
          {Object.keys(stats.formatCounts).length > 0 ? (
            <div className="space-y-3">
              {(Object.entries(FORMAT_LABELS) as [DebateFormat, string][]).map(([fmt, label]) => {
                const count = stats.formatCounts[fmt] ?? 0;
                if (count === 0 && stats.totalDebates > 0) return null;
                return (
                  <FormatBar
                    key={fmt}
                    label={label}
                    count={count}
                    total={stats.totalDebates}
                    color={FORMAT_COLORS[fmt]}
                  />
                );
              })}
              {/* Show any unrecognized formats */}
              {Object.entries(stats.formatCounts)
                .filter(([key]) => !(key in FORMAT_LABELS))
                .map(([key, count]) => (
                  <FormatBar
                    key={key}
                    label={key}
                    count={count}
                    total={stats.totalDebates}
                    color="#6b7280"
                  />
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No debate history yet.
            </p>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Recent Activity
            </h2>
          </div>
          {stats.recentDebates.length > 0 ? (
            <div className="space-y-1">
              {stats.recentDebates.map((debate) => {
                const StatusIcon = STATUS_ICONS[debate.status] ?? Clock;
                const statusColors: Record<string, string> = {
                  completed: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                  'in-progress': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
                  paused: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
                  cancelled: 'text-red-500 bg-red-50 dark:bg-red-900/20',
                  setup: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
                };

                return (
                  <div
                    key={debate.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2"
                  >
                    <div
                      className={clsx(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        statusColors[debate.status] ?? statusColors.setup,
                      )}
                    >
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {debate.topic || 'Untitled Debate'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {getRelativeTime(debate.updatedAt)}
                        </span>
                        <Badge variant={STATUS_VARIANT[debate.status]} size="sm">
                          {debate.status}
                        </Badge>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
                      {debate.turns?.length ?? 0} turns
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No debates yet. Start your first one!
            </p>
          )}
        </Card>
      </section>

      {/* ── Preferences Quick Links ── */}
      <section className="mb-8">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Preferences
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
            {/* Theme */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-dark-3">
                  <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {THEME_LABELS[theme] ?? theme}
                  </p>
                </div>
              </div>
              <Badge variant="default" size="sm">
                {THEME_LABELS[theme] ?? theme}
              </Badge>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-dark-3">
                  <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Language</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {settings.language || 'English (default)'}
                  </p>
                </div>
              </div>
              <Badge variant="default" size="sm">
                {settings.language || 'EN'}
              </Badge>
            </div>

            {/* Go to Settings */}
            <div className="pt-4">
              <Button
                variant="outline"
                size="sm"
                icon={<Settings className="h-4 w-4" />}
                onClick={() => navigateTo('settings')}
              >
                Go to Settings
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ProfileView;
