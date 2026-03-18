import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  Swords, Plus, ShieldCheck, Users, Cpu,
  AlertTriangle, Clock, BarChart3, Sparkles,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import type { Debate, DebateFormat, DebateStatus } from '../../types';

const FORMAT_LABELS: Record<DebateFormat, string> = {
  'oxford-union': 'Oxford Union',
};

const STATUS_VARIANT: Record<DebateStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  setup: 'default',
  'in-progress': 'info',
  paused: 'warning',
  completed: 'success',
  cancelled: 'error',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

interface Feature {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  { icon: ShieldCheck, title: 'Evidence Verification', description: 'Real-time fact-checking with live web evidence, screenshots, and credibility scoring.', color: 'text-emerald-500' },
  { icon: Users, title: 'Custom Personas', description: 'Create rich debate personas with unique rhetorical styles, expertise, and strategies.', color: 'text-blue-500' },
  { icon: Cpu, title: 'Multi-Model Debates', description: 'Pit GPT-4 against Claude, Gemini, Mistral, or local models in head-to-head clashes.', color: 'text-purple-500' },
  { icon: AlertTriangle, title: 'Fallacy Detection', description: 'Automatic identification of logical fallacies with inline warnings and explanations.', color: 'text-amber-500' },
];

const HomeView: React.FC = () => {
  const debates = useStore((s) => s.debates);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setCurrentDebate = useStore((s) => s.setCurrentDebate);
  const resetSetup = useStore((s) => s.resetSetup);

  const stats = useMemo(() => {
    const total = debates.length;
    const formatCounts: Record<string, number> = {};
    debates.forEach((d) => {
      const fmtName = d.format?.name ?? 'Unknown';
      formatCounts[fmtName] = (formatCounts[fmtName] ?? 0) + 1;
    });
    const favoriteFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '--';

    const modelCounts: Record<string, number> = {};
    debates.forEach((d) => {
      d.debaters.forEach((db) => {
        const name = db.model?.displayName ?? db.model?.name ?? 'Unknown';
        modelCounts[name] = (modelCounts[name] ?? 0) + 1;
      });
    });
    const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '--';
    return { total, favoriteFormat, topModel };
  }, [debates]);

  const handleNewDebate = () => { resetSetup(); setCurrentView('setup'); };
  const handleOpenDebate = (debate: Debate) => { setCurrentDebate(debate); setCurrentView('debate'); };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Hero */}
      <section className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-forge-100 p-4 dark:bg-forge-900/30">
          <Swords className="h-12 w-12 text-forge-600 dark:text-forge-400" />
        </div>
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">DebateForge</h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-gray-500 dark:text-gray-400">
          AI-Powered Debate Arena &mdash; Watch AI models clash on any topic with real-time evidence, custom personas, and logical fallacy detection.
        </p>
        <Button size="lg" onClick={handleNewDebate} icon={<Plus className="h-5 w-5" />}>New Debate</Button>
      </section>

      {/* Quick Stats */}
      {debates.length > 0 && (
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: BarChart3, label: 'Total Debates', value: String(stats.total) },
            { icon: Sparkles, label: 'Favorite Format', value: stats.favoriteFormat },
            { icon: Cpu, label: 'Most-Used Model', value: stats.topModel },
          ].map((stat) => (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-100 dark:bg-forge-900/30">
                <stat.icon className="h-5 w-5 text-forge-600 dark:text-forge-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* Recent Debates */}
      {debates.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Debates</h2>
          <div className="space-y-3">
            {debates.slice(0, 8).map((debate) => (
              <Card key={debate.id} hover onClick={() => handleOpenDebate(debate)} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">{debate.topic}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{FORMAT_LABELS[debate.format?.id] ?? debate.format?.name ?? 'Unknown'}</span>
                    <span className="text-gray-300 dark:text-surface-dark-4">|</span>
                    <span>{debate.debaters?.length ?? 0} debater{(debate.debaters?.length ?? 0) !== 1 ? 's' : ''}</span>
                    <span className="text-gray-300 dark:text-surface-dark-4">|</span>
                    <span>{debate.turns?.length ?? 0} turns</span>
                  </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <Badge variant={STATUS_VARIANT[debate.status] ?? 'default'}>{debate.status}</Badge>
                  <span className="hidden text-sm text-gray-400 dark:text-gray-500 sm:inline">
                    <Clock className="mr-1 inline-block h-3.5 w-3.5" />
                    {formatDate(debate.createdAt)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Feature Cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Features</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="flex flex-col">
              <f.icon className={clsx('mb-3 h-8 w-8', f.color)} />
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Empty state */}
      {debates.length === 0 && (
        <section className="mt-12 rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center dark:border-surface-dark-4">
          <Swords className="mx-auto mb-4 h-10 w-10 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">No debates yet</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Start your first AI debate and watch models argue any topic.</p>
          <Button variant="primary" onClick={handleNewDebate} icon={<Plus className="h-4 w-4" />}>Create Your First Debate</Button>
        </section>
      )}
    </div>
  );
};

export default HomeView;
