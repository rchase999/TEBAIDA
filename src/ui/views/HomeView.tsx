import React, { useMemo, useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  Swords, Plus, ShieldCheck, Users, Cpu,
  AlertTriangle, Clock, BarChart3, Sparkles,
  Trophy, Crown, Shield, TrendingUp, Search, X,
  Trash2, ChevronRight, Zap, Target, Brain,
  Award, Flame, MessageSquare, Calendar,
  ArrowUpRight, ArrowDownRight, BookOpen,
  Play, RotateCcw, Star, Hash, Filter, PieChart,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { DebateStreakTracker } from '../components/DebateStreakTracker';
import { ArgumentHeatmap } from '../components/ArgumentHeatmap';
import { OnboardingChecklist } from '../components/OnboardingChecklist';
import { Badge } from '../components/Badge';
import type { Debate, DebateFormat, DebateStatus } from '../../types';

const FORMAT_LABELS: Record<DebateFormat, string> = {
  'oxford-union': 'Oxford Union',
  'lincoln-douglas': 'Lincoln-Douglas',
  'parliamentary': 'Parliamentary',
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
    return formatDate(iso);
  } catch {
    return iso;
  }
}

/* ─── Quick Stat Card ─── */
interface QuickStatProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  color: string;
  bgColor: string;
  delay?: number;
}

const QuickStat: React.FC<QuickStatProps> = ({ icon: Icon, label, value, trend, color, bgColor, delay = 0 }) => (
  <Card className={clsx('group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5')}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100 animate-count-up">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center gap-1">
            {trend.value >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={clsx('text-xs font-medium', trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </div>
        )}
      </div>
      <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110', bgColor)}>
        <Icon className={clsx('h-5 w-5', color)} />
      </div>
    </div>
    {/* Decorative gradient */}
    <div className={clsx('absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-5 transition-opacity group-hover:opacity-10', bgColor)} />
  </Card>
);

/* ─── Activity Item ─── */
interface ActivityItemProps {
  debate: Debate;
  onClick: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ debate, onClick }) => {
  const StatusIcon = STATUS_ICONS[debate.status] ?? Clock;
  const statusColors: Record<string, string> = {
    completed: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    'in-progress': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    paused: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    cancelled: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    setup: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
  };

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-gray-50 dark:hover:bg-surface-dark-2"
    >
      <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', statusColors[debate.status] ?? statusColors.setup)}>
        <StatusIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-forge-600 dark:group-hover:text-forge-400 transition-colors">
          {debate.topic}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {debate.turns?.length ?? 0} turns &middot; {getRelativeTime(debate.updatedAt || debate.createdAt)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
};

/* ─── Quick Action Button ─── */
interface QuickActionProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick: () => void;
  color: string;
  bgColor: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, onClick, color, bgColor }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-surface-dark-2"
  >
    <div className={clsx('flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110', bgColor)}>
      <Icon className={clsx('h-5 w-5', color)} />
    </div>
    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{label}</span>
  </button>
);

/* ─── Suggested Topics ─── */
const SUGGESTED_TOPICS = [
  'Should AI have legal personhood?',
  'Is universal basic income inevitable?',
  'Can democracy survive social media?',
  'Should gene editing be regulated?',
  'Is space colonization a moral imperative?',
  'Will quantum computing break encryption?',
  'Should autonomous weapons be banned?',
  'Is nuclear energy the best climate solution?',
];

/* ─── Feature Highlight ─── */
interface FeatureCardProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color, bgColor }) => (
  <div className="group flex gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4">
    <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110', bgColor)}>
      <Icon className={clsx('h-5 w-5', color)} />
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  </div>
);

/* ─── Main HomeView ─── */
const HomeView: React.FC = () => {
  const debates = useStore((s) => s.debates);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setCurrentDebate = useStore((s) => s.setCurrentDebate);
  const deleteDebate = useStore((s) => s.deleteDebate);
  const resetSetup = useStore((s) => s.resetSetup);
  const setSetupTopic = useStore((s) => s.setSetupTopic);
  const apiKeys = useStore((s) => s.apiKeys);
  const personas = useStore((s) => s.personas);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DebateStatus | 'all'>('all');
  const [randomTopics, setRandomTopics] = useState<string[]>([]);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try { return localStorage.getItem('debateforge-onboarding-dismissed') === 'true'; } catch { return false; }
  });

  // Pick 3 random suggested topics on mount
  useEffect(() => {
    const shuffled = [...SUGGESTED_TOPICS].sort(() => Math.random() - 0.5);
    setRandomTopics(shuffled.slice(0, 3));
  }, []);

  const filteredDebates = useMemo(() => {
    let result = debates;
    if (filterStatus !== 'all') {
      result = result.filter((d) => d.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) =>
        d.topic?.toLowerCase().includes(q) ||
        d.debaters?.some((db) => db.name?.toLowerCase().includes(q) || db.model?.displayName?.toLowerCase().includes(q) || db.persona?.name?.toLowerCase().includes(q)) ||
        d.turns?.some((t) => t.content?.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [debates, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const total = debates.length;
    const completed = debates.filter((d) => d.status === 'completed').length;
    const totalTurns = debates.reduce((sum, d) => sum + (d.turns?.length ?? 0), 0);

    const formatCounts: Record<string, number> = {};
    debates.forEach((d) => {
      const fmtName = d.format?.name ?? 'Unknown';
      formatCounts[fmtName] = (formatCounts[fmtName] ?? 0) + 1;
    });
    const favoriteFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '--';

    const modelCounts: Record<string, number> = {};
    debates.forEach((d) => {
      d.debaters.forEach((db) => {
        if (db.position === 'housemaster') return;
        const name = db.model?.displayName ?? db.model?.name ?? 'Unknown';
        modelCounts[name] = (modelCounts[name] ?? 0) + 1;
      });
    });
    const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '--';

    // Fallacy count
    let totalFallacies = 0;
    debates.forEach((d) => d.turns?.forEach((t) => { totalFallacies += t.fallacies?.length ?? 0; }));

    return { total, completed, totalTurns, favoriteFormat, topModel, totalFallacies };
  }, [debates]);

  const handleNewDebate = () => { resetSetup(); setCurrentView('setup'); };
  const handleOpenDebate = (debate: Debate) => { setCurrentDebate(debate); setCurrentView('debate'); };
  const handleTopicSuggestion = (topic: string) => {
    resetSetup();
    setSetupTopic(topic);
    setCurrentView('setup');
  };

  const greeting = getTimeGreeting();

  return (
    <div className="mx-auto max-w-7xl px-6 py-6" id="main-content">
      {/* Greeting & CTA */}
      <section className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {greeting} <span className="animate-fade-in">&#128075;</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {debates.length === 0 ? 'Ready to start your first AI debate?' : `You've run ${stats.total} debate${stats.total !== 1 ? 's' : ''}. Keep going!`}
          </p>
        </div>
        <Button size="lg" onClick={handleNewDebate} icon={<Plus className="h-5 w-5" />} className="animate-pulse-glow shrink-0">
          New Debate
        </Button>
      </section>

      {/* Onboarding Checklist */}
      {!onboardingDismissed && (
        <section className="mb-8">
          <OnboardingChecklist
            hasApiKey={Object.values(apiKeys ?? {}).some((k) => typeof k === 'string' && k.length > 5)}
            hasCompletedDebate={debates.some((d) => d.status === 'completed')}
            hasCustomPersona={personas.length > 8}
            hasTournament={false}
            debateCount={debates.length}
            onNavigate={(view) => setCurrentView(view as any)}
            onDismiss={() => {
              setOnboardingDismissed(true);
              try { localStorage.setItem('debateforge-onboarding-dismissed', 'true'); } catch {}
            }}
          />
        </section>
      )}

      {/* Quick Stats */}
      {debates.length > 0 && (
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <QuickStat
            icon={Swords}
            label="Total Debates"
            value={stats.total}
            color="text-forge-600 dark:text-forge-400"
            bgColor="bg-forge-100 dark:bg-forge-900/30"
            delay={0}
          />
          <QuickStat
            icon={Trophy}
            label="Completed"
            value={stats.completed}
            trend={stats.total > 3 ? { value: Math.round((stats.completed / stats.total) * 100), label: 'rate' } : undefined}
            color="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-100 dark:bg-emerald-900/30"
            delay={50}
          />
          <QuickStat
            icon={MessageSquare}
            label="Total Turns"
            value={stats.totalTurns}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-100 dark:bg-blue-900/30"
            delay={100}
          />
          <QuickStat
            icon={AlertTriangle}
            label="Fallacies Found"
            value={stats.totalFallacies}
            color="text-amber-600 dark:text-amber-400"
            bgColor="bg-amber-100 dark:bg-amber-900/30"
            delay={150}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <Card className="!p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quick Actions</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
              <QuickAction icon={Swords} label="New Debate" onClick={handleNewDebate} color="text-forge-600 dark:text-forge-400" bgColor="bg-forge-100 dark:bg-forge-900/30" />
              <QuickAction icon={Users} label="Personas" onClick={() => setCurrentView('personas')} color="text-purple-600 dark:text-purple-400" bgColor="bg-purple-100 dark:bg-purple-900/30" />
              <QuickAction icon={Trophy} label="Tournament" onClick={() => setCurrentView('tournament')} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-100 dark:bg-amber-900/30" />
              <QuickAction icon={BarChart3} label="Leaderboard" onClick={() => setCurrentView('leaderboard')} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-100 dark:bg-emerald-900/30" />
              <QuickAction icon={PieChart} label="Statistics" onClick={() => setCurrentView('statistics')} color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-100 dark:bg-blue-900/30" />
              <QuickAction icon={Zap} label="Settings" onClick={() => setCurrentView('settings')} color="text-gray-600 dark:text-gray-400" bgColor="bg-gray-100 dark:bg-gray-800/50" />
            </div>
          </Card>

          {/* Debate History */}
          {debates.length > 0 && (
            <section>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {searchQuery ? `Search Results (${filteredDebates.length})` : 'Recent Debates'}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Status filter */}
                  <div className="flex items-center rounded-lg border border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-1 overflow-hidden text-xs">
                    {(['all', 'completed', 'in-progress', 'paused'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={clsx(
                          'px-2.5 py-1.5 font-medium transition-colors capitalize',
                          filterStatus === status
                            ? 'bg-forge-600 text-white'
                            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-surface-dark-2',
                        )}
                      >
                        {status === 'all' ? 'All' : status === 'in-progress' ? 'Active' : status}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-36 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-7 text-xs text-gray-900 transition-all placeholder:text-gray-400 focus:w-52 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <Card className="!p-2">
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  {filteredDebates.slice(0, searchQuery ? 50 : 8).map((debate) => {
                    const prop = debate.debaters?.find((d) => d.position === 'proposition');
                    const opp = debate.debaters?.find((d) => d.position === 'opposition');
                    return (
                      <div key={debate.id} className="group flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2">
                        <button onClick={() => handleOpenDebate(debate)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <div className={clsx(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            debate.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                            debate.status === 'in-progress' ? 'bg-blue-50 dark:bg-blue-900/20' :
                            'bg-gray-50 dark:bg-gray-800/50',
                          )}>
                            {React.createElement(STATUS_ICONS[debate.status] ?? Clock, {
                              className: clsx('h-4 w-4',
                                debate.status === 'completed' ? 'text-emerald-500' :
                                debate.status === 'in-progress' ? 'text-blue-500' :
                                'text-gray-400'),
                            })}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-forge-600 dark:group-hover:text-forge-400 transition-colors">
                              {debate.topic}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                              {prop && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Shield className="h-3 w-3 text-blue-400" />
                                  {prop.model?.displayName ?? prop.name}
                                </span>
                              )}
                              {prop && opp && <span className="font-bold">vs</span>}
                              {opp && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Swords className="h-3 w-3 text-rose-400" />
                                  {opp.model?.displayName ?? opp.name}
                                </span>
                              )}
                              <span>&middot;</span>
                              <span>{debate.turns?.length ?? 0}/{debate.format?.totalTurns ?? 10} turns</span>
                            </div>
                          </div>
                        </button>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <Badge variant={STATUS_VARIANT[debate.status] ?? 'default'} size="sm">{debate.status}</Badge>
                          <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:inline" title={formatDate(debate.createdAt)}>
                            {getRelativeTime(debate.updatedAt || debate.createdAt)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteDebate(debate.id); }}
                            className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100"
                            title="Delete debate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredDebates.length === 0 && (
                  <div className="py-8 text-center">
                    <Search className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No debates found</p>
                    {searchQuery && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>}
                  </div>
                )}
                {filteredDebates.length > 8 && !searchQuery && (
                  <div className="border-t border-gray-100 px-3 py-2.5 text-center dark:border-surface-dark-3">
                    <button
                      onClick={() => setSearchQuery(' ')}
                      className="text-xs font-medium text-forge-600 hover:text-forge-700 dark:text-forge-400 dark:hover:text-forge-300 transition-colors"
                    >
                      View all {debates.length} debates
                    </button>
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* Empty state hero */}
          {debates.length === 0 && (
            <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-forge-50 via-white to-purple-50 p-10 text-center dark:border-surface-dark-3 dark:from-forge-950/30 dark:via-surface-dark-1 dark:to-purple-950/20">
              <div className="relative z-10">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg shadow-forge-500/25">
                  <Swords className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">Your AI Debate Arena Awaits</h3>
                <p className="mx-auto mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
                  Pit the world's most powerful AI models against each other. Watch them argue, cite evidence, and detect each other's logical fallacies in real-time.
                </p>
                <Button size="lg" onClick={handleNewDebate} icon={<Swords className="h-5 w-5" />} className="shadow-lg shadow-forge-500/25">
                  Start Your First Debate
                </Button>
              </div>
              {/* Background decoration */}
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-forge-200/30 blur-3xl dark:bg-forge-800/20" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-800/20" />
            </section>
          )}
        </div>

        {/* Right sidebar column */}
        <div className="space-y-6">
          {/* Topic Suggestions */}
          <Card className="!p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-forge-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Suggested Topics</h3>
            </div>
            <div className="space-y-2">
              {randomTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSuggestion(topic)}
                  className="group flex w-full items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-left text-sm transition-all duration-200 hover:border-forge-200 hover:bg-forge-50 hover:shadow-sm dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:hover:border-forge-800 dark:hover:bg-forge-900/10"
                >
                  <Zap className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-forge-500 transition-colors" />
                  <span className="flex-1 text-gray-700 dark:text-gray-300 group-hover:text-forge-700 dark:group-hover:text-forge-400 transition-colors">{topic}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button
                onClick={() => {
                  const shuffled = [...SUGGESTED_TOPICS].sort(() => Math.random() - 0.5);
                  setRandomTopics(shuffled.slice(0, 3));
                }}
                className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-400 hover:text-forge-500 dark:text-gray-500 dark:hover:text-forge-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> More suggestions
              </button>
            </div>
          </Card>

          {/* Feature Highlights (only if no debates) */}
          {debates.length < 3 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">Features</h3>
              <FeatureCard
                icon={ShieldCheck}
                title="Evidence Verification"
                description="Real-time fact-checking with credibility scoring and source classification."
                color="text-emerald-600 dark:text-emerald-400"
                bgColor="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <FeatureCard
                icon={Users}
                title="Custom Personas"
                description="Create unique debaters with distinct expertise, styles, and strategies."
                color="text-purple-600 dark:text-purple-400"
                bgColor="bg-purple-100 dark:bg-purple-900/30"
              />
              <FeatureCard
                icon={Cpu}
                title="Multi-Model Arena"
                description="Pit Claude, GPT-4, Gemini, and local models against each other."
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-100 dark:bg-blue-900/30"
              />
              <FeatureCard
                icon={AlertTriangle}
                title="Fallacy Detection"
                description="Automatic identification of 14+ logical fallacies with severity levels."
                color="text-amber-600 dark:text-amber-400"
                bgColor="bg-amber-100 dark:bg-amber-900/30"
              />
            </div>
          )}

          {/* Model Leaderboard preview */}
          {debates.length >= 3 && (
            <Card className="!p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Top Models</h3>
                </div>
                <button
                  onClick={() => setCurrentView('leaderboard')}
                  className="text-xs font-medium text-forge-600 hover:text-forge-700 dark:text-forge-400 dark:hover:text-forge-300"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-5 text-center font-bold">#</span>
                  <span className="flex-1">Model</span>
                  <span>Debates</span>
                </div>
                {(() => {
                  const modelStats: Record<string, { name: string; count: number }> = {};
                  debates.forEach((d) => d.debaters.forEach((db) => {
                    if (db.position === 'housemaster') return;
                    const name = db.model?.displayName ?? db.model?.name ?? 'Unknown';
                    if (!modelStats[name]) modelStats[name] = { name, count: 0 };
                    modelStats[name].count++;
                  }));
                  return Object.values(modelStats).sort((a, b) => b.count - a.count).slice(0, 5).map((m, i) => (
                    <div key={m.name} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                      <span className={clsx('w-5 text-center text-xs font-bold', i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400')}>
                        {i + 1}
                      </span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 dark:bg-surface-dark-3 dark:text-gray-400">
                        {m.name.charAt(0)}
                      </div>
                      <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                      <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{m.count}</span>
                    </div>
                  ));
                })()}
              </div>
            </Card>
          )}

          {/* Achievements & Streaks */}
          {debates.length >= 1 && (
            <Card className="!p-4">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Achievements</h3>
              </div>
              <DebateStreakTracker debates={debates} />
            </Card>
          )}

          {/* Activity Heatmap */}
          {debates.length >= 2 && (
            <Card className="!p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Activity</h3>
              </div>
              <ArgumentHeatmap debates={debates} />
            </Card>
          )}

          {/* Format stats */}
          {debates.length > 0 && (
            <Card className="!p-4">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quick Info</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Favorite Format</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{stats.favoriteFormat}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Top Model</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{stats.topModel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Completion Rate</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
