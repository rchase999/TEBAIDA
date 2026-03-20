import React, { useState } from 'react';
import clsx from 'clsx';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  Wrench,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

/* ─── Types ────────────────────────────────────────────────────────────────── */

type ChangeType = 'new' | 'improved' | 'fixed';

interface ChangeEntry {
  type: ChangeType;
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  title?: string;
  changes: ChangeEntry[];
}

/* ─── Constants ────────────────────────────────────────────────────────────── */

const TYPE_CONFIG: Record<ChangeType, { label: string; variant: 'success' | 'info' | 'warning'; icon: React.FC<{ className?: string }> }> = {
  new: { label: 'New', variant: 'success', icon: Plus },
  improved: { label: 'Improved', variant: 'info', icon: Zap },
  fixed: { label: 'Fixed', variant: 'warning', icon: Wrench },
};

const VERSIONS: VersionEntry[] = [
  {
    version: '1.0.0',
    date: 'March 2026',
    title: 'Initial Release',
    changes: [
      { type: 'new', text: 'AI-Powered Debate Arena with multi-model support (Anthropic, OpenAI, Google, Mistral, Groq, Ollama, LM Studio)' },
      { type: 'new', text: 'Oxford Union, Lincoln-Douglas, and Parliamentary debate formats with authentic turn sequences' },
      { type: 'new', text: 'Custom persona system with 8 built-in personas including The Rational Analyst, Passionate Advocate, and Devil\'s Advocate' },
      { type: 'new', text: 'Evidence verification with credibility scoring and source type classification' },
      { type: 'new', text: 'Logical fallacy detection engine with 14+ recognized patterns and severity levels' },
      { type: 'new', text: 'ELO rating system and model leaderboard with win/loss/draw tracking' },
      { type: 'new', text: 'Tournament mode with single-elimination and round-robin bracket styles' },
      { type: 'new', text: 'Command palette (Cmd+K / Ctrl+K) with fuzzy search for quick navigation' },
      { type: 'new', text: 'Achievement system with streaks, milestones, and progress tracking' },
      { type: 'new', text: 'Activity heatmap and debate word cloud for visual analytics' },
      { type: 'new', text: 'Topic generator with 5 categories (Philosophy, Technology, Politics, Science, Society)' },
      { type: 'new', text: 'Multi-format export supporting JSON, Markdown, and TXT output' },
      { type: 'new', text: 'Notification center with milestone tracking and activity alerts' },
      { type: 'new', text: 'Debate format guide with tactical tips and strategy breakdowns for each format' },
      { type: 'new', text: 'Model comparison chart with performance metrics across debate categories' },
      { type: 'new', text: 'User profiles with stats, bio, achievements, and debate history' },
      { type: 'improved', text: 'Dashboard with quick actions, onboarding checklist, and contextual suggestions' },
      { type: 'improved', text: 'Settings with 6-tab layout covering General, API Keys, Appearance, Debate, Data, and About' },
      { type: 'improved', text: 'Leaderboard with podium display and head-to-head comparison view' },
      { type: 'improved', text: 'Markdown renderer with tables, strikethrough, task lists, and code highlighting' },
      { type: 'improved', text: 'Evidence panel with credibility stars and source type badges' },
      { type: 'improved', text: 'Dark mode throughout with system theme auto-detection and smooth transitions' },
    ],
  },
];

/* ─── Version Section ──────────────────────────────────────────────────────── */

interface VersionSectionProps {
  entry: VersionEntry;
  defaultOpen?: boolean;
}

const VersionSection: React.FC<VersionSectionProps> = ({ entry, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  const newCount = entry.changes.filter((c) => c.type === 'new').length;
  const improvedCount = entry.changes.filter((c) => c.type === 'improved').length;
  const fixedCount = entry.changes.filter((c) => c.type === 'fixed').length;

  return (
    <Card className="overflow-hidden">
      {/* Version header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forge-100 dark:bg-forge-900/30">
            <Sparkles className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                v{entry.version}
              </h3>
              {entry.title && (
                <Badge variant="info" size="sm">
                  {entry.title}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{entry.date}</span>
              <span className="mx-1">·</span>
              {newCount > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">{newCount} new</span>
              )}
              {improvedCount > 0 && (
                <>
                  {newCount > 0 && <span className="mx-0.5">·</span>}
                  <span className="text-blue-600 dark:text-blue-400">{improvedCount} improved</span>
                </>
              )}
              {fixedCount > 0 && (
                <>
                  {(newCount > 0 || improvedCount > 0) && <span className="mx-0.5">·</span>}
                  <span className="text-amber-600 dark:text-amber-400">{fixedCount} fixed</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-surface-dark-3">
          {open ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Change list */}
      {open && (
        <div className="mt-5 space-y-2">
          {/* Group by type */}
          {(['new', 'improved', 'fixed'] as ChangeType[]).map((type) => {
            const items = entry.changes.filter((c) => c.type === type);
            if (items.length === 0) return null;
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;

            return (
              <div key={type} className="space-y-1.5">
                {/* Type header */}
                <div className="flex items-center gap-1.5 pt-2 pb-1">
                  <Icon className={clsx('h-3.5 w-3.5', {
                    'text-emerald-500': type === 'new',
                    'text-blue-500': type === 'improved',
                    'text-amber-500': type === 'fixed',
                  })} />
                  <span className={clsx('text-xs font-semibold uppercase tracking-wider', {
                    'text-emerald-600 dark:text-emerald-400': type === 'new',
                    'text-blue-600 dark:text-blue-400': type === 'improved',
                    'text-amber-600 dark:text-amber-400': type === 'fixed',
                  })}>
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">({items.length})</span>
                </div>

                {/* Items */}
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2"
                  >
                    <Badge variant={config.variant} size="sm">
                      {config.label}
                    </Badge>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

/* ─── Main Component ───────────────────────────────────────────────────────── */

const ChangelogView: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* ── Page Header ── */}
      <header className="mb-8">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-forge-100 p-3 dark:bg-forge-900/30">
          <Sparkles className="h-8 w-8 text-forge-600 dark:text-forge-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          Changelog
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          What's new in DebateForge — features, improvements, and fixes.
        </p>
      </header>

      {/* ── Timeline indicator ── */}
      <div className="relative space-y-6">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-200 dark:bg-surface-dark-3" />

        {VERSIONS.map((entry, idx) => (
          <div key={entry.version} className="relative pl-12">
            {/* Timeline dot */}
            <div
              className={clsx(
                'absolute left-2.5 top-5 h-3 w-3 rounded-full border-2 border-white dark:border-surface-dark-1',
                idx === 0
                  ? 'bg-forge-500 shadow-sm shadow-forge-500/50'
                  : 'bg-gray-300 dark:bg-surface-dark-4',
              )}
            />
            <VersionSection entry={entry} defaultOpen={idx === 0} />
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="mt-10 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          You're on the latest version of DebateForge.
        </p>
      </div>
    </div>
  );
};

export default ChangelogView;
