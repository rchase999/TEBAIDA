import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Cpu, MessageSquare, AlertTriangle, BookOpen, Zap } from 'lucide-react';
import type { Debate } from '../../types';

export interface ModelComparisonChartProps {
  debates: Debate[];
  className?: string;
}

interface ModelStats {
  name: string;
  provider: string;
  debates: number;
  avgWords: number;
  avgCitations: number;
  avgFallacies: number;
  winRate: number;
  wins: number;
  losses: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#f97316',
  openai: '#22c55e',
  google: '#3b82f6',
  mistral: '#a855f7',
  groq: '#06b6d4',
  ollama: '#6b7280',
  lmstudio: '#ec4899',
};

/**
 * A radar-style comparison of model performance across multiple metrics.
 * Shows bars for each metric per model.
 */
export const ModelComparisonChart: React.FC<ModelComparisonChartProps> = ({ debates, className }) => {
  const models = useMemo(() => {
    const stats: Record<string, ModelStats> = {};

    debates.forEach((d) => {
      d.debaters.forEach((debater) => {
        if (debater.position === 'housemaster') return;
        const name = debater.model?.displayName ?? 'Unknown';
        const provider = debater.model?.provider ?? 'unknown';

        if (!stats[name]) {
          stats[name] = { name, provider, debates: 0, avgWords: 0, avgCitations: 0, avgFallacies: 0, winRate: 0, wins: 0, losses: 0 };
        }
        stats[name].debates++;

        // Calc words, citations, fallacies for this debater
        const turns = d.turns?.filter((t) => t.debaterId === debater.id) ?? [];
        const words = turns.reduce((s, t) => s + (t.content?.split(/\s+/).length ?? 0), 0);
        const citations = turns.reduce((s, t) => s + (t.citations?.length ?? 0), 0);
        const fallacies = turns.reduce((s, t) => s + (t.fallacies?.length ?? 0), 0);

        stats[name].avgWords += words;
        stats[name].avgCitations += citations;
        stats[name].avgFallacies += fallacies;

        // Win/loss
        if (d.status === 'completed' && d.scores && d.scores.length >= 2) {
          const myScore = d.scores.find((s) => s.debaterId === debater.id);
          const otherScore = d.scores.find((s) => s.debaterId !== debater.id && s.debaterId !== d.housemasterId);
          if (myScore && otherScore) {
            if ((myScore.categories?.overall ?? 0) > (otherScore.categories?.overall ?? 0)) {
              stats[name].wins++;
            } else if ((myScore.categories?.overall ?? 0) < (otherScore.categories?.overall ?? 0)) {
              stats[name].losses++;
            }
          }
        }
      });
    });

    // Calculate averages
    return Object.values(stats)
      .map((s) => ({
        ...s,
        avgWords: s.debates > 0 ? Math.round(s.avgWords / s.debates) : 0,
        avgCitations: s.debates > 0 ? +(s.avgCitations / s.debates).toFixed(1) : 0,
        avgFallacies: s.debates > 0 ? +(s.avgFallacies / s.debates).toFixed(1) : 0,
        winRate: (s.wins + s.losses) > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
      }))
      .sort((a, b) => b.debates - a.debates)
      .slice(0, 6);
  }, [debates]);

  if (models.length === 0) {
    return (
      <div className={clsx('text-center py-8 text-sm text-gray-400 dark:text-gray-500', className)}>
        Run some debates to see model comparisons.
      </div>
    );
  }

  const maxWords = Math.max(...models.map((m) => m.avgWords), 1);
  const maxCitations = Math.max(...models.map((m) => m.avgCitations), 1);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Model cards */}
      <div className="space-y-3">
        {models.map((model) => (
          <div
            key={model.name}
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-surface-dark-3 dark:bg-surface-dark-1"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PROVIDER_COLORS[model.provider] ?? '#6b7280' }}
                />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{model.name}</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">{model.debates} debates</span>
            </div>

            {/* Metric bars */}
            <div className="space-y-1.5">
              {/* Words */}
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-gray-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-surface-dark-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(model.avgWords / maxWords) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400 w-14 text-right">{model.avgWords} w</span>
              </div>

              {/* Citations */}
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-gray-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-surface-dark-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(model.avgCitations / maxCitations) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400 w-14 text-right">{model.avgCitations} cit</span>
              </div>

              {/* Win rate */}
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-gray-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-surface-dark-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${model.winRate}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400 w-14 text-right">{model.winRate}% win</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelComparisonChart;
