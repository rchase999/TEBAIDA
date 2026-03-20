import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  Brain, TrendingUp, AlertTriangle, BookOpen,
  Clock, Zap, MessageSquare, Target,
} from 'lucide-react';
import type { Debate } from '../../types';

export interface DebateInsightsProps {
  debates: Debate[];
  className?: string;
}

interface Insight {
  icon: React.FC<{ className?: string }>;
  title: string;
  value: string;
  color: string;
  bgColor: string;
}

/**
 * Generates interesting analytical insights from debate history.
 * Shows non-obvious statistics that make users go "huh, interesting!"
 */
export const DebateInsights: React.FC<DebateInsightsProps> = ({ debates, className }) => {
  const insights = useMemo(() => {
    if (debates.length === 0) return [];

    const results: Insight[] = [];

    // 1. Most debated time of day
    const hourCounts: Record<number, number> = {};
    debates.forEach((d) => {
      try {
        const hour = new Date(d.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
      } catch {}
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (peakHour) {
      const h = parseInt(peakHour[0]);
      const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
      const timeStr = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      results.push({
        icon: Clock,
        title: 'Peak Debate Hour',
        value: `${timeStr} (${period})`,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      });
    }

    // 2. Average debate length in words
    const totalWords = debates.reduce((sum, d) =>
      sum + (d.turns?.reduce((s, t) => s + (t.content?.split(/\s+/).length ?? 0), 0) ?? 0), 0);
    const avgWords = Math.round(totalWords / Math.max(debates.length, 1));
    results.push({
      icon: MessageSquare,
      title: 'Avg Words per Debate',
      value: avgWords.toLocaleString(),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    });

    // 3. Most fallacy-prone model
    const modelFallacies: Record<string, { name: string; count: number }> = {};
    debates.forEach((d) => {
      d.turns?.forEach((t) => {
        if (t.fallacies && t.fallacies.length > 0) {
          const debater = d.debaters.find((db) => db.id === t.debaterId);
          const modelName = debater?.model?.displayName ?? 'Unknown';
          if (!modelFallacies[modelName]) modelFallacies[modelName] = { name: modelName, count: 0 };
          modelFallacies[modelName].count += t.fallacies.length;
        }
      });
    });
    const topFallacyModel = Object.values(modelFallacies).sort((a, b) => b.count - a.count)[0];
    if (topFallacyModel && topFallacyModel.count > 0) {
      results.push({
        icon: AlertTriangle,
        title: 'Most Fallacious Model',
        value: `${topFallacyModel.name} (${topFallacyModel.count})`,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      });
    }

    // 4. Longest debate (by word count)
    let longestDebate = { topic: '', words: 0 };
    debates.forEach((d) => {
      const words = d.turns?.reduce((s, t) => s + (t.content?.split(/\s+/).length ?? 0), 0) ?? 0;
      if (words > longestDebate.words) {
        longestDebate = { topic: d.topic?.slice(0, 30) ?? 'Unknown', words };
      }
    });
    if (longestDebate.words > 0) {
      results.push({
        icon: BookOpen,
        title: 'Longest Debate',
        value: `${longestDebate.words.toLocaleString()} words`,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      });
    }

    // 5. Most cited source type
    const sourceTypes: Record<string, number> = {};
    debates.forEach((d) => {
      d.turns?.forEach((t) => {
        t.citations?.forEach((c) => {
          const st = c.sourceType ?? 'unknown';
          sourceTypes[st] = (sourceTypes[st] ?? 0) + 1;
        });
      });
    });
    const topSource = Object.entries(sourceTypes).sort((a, b) => b[1] - a[1])[0];
    if (topSource) {
      results.push({
        icon: Target,
        title: 'Top Source Type',
        value: topSource[0].replace('-', ' '),
        color: 'text-cyan-600 dark:text-cyan-400',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      });
    }

    // 6. Total reading time (assuming 250 wpm)
    const readingMinutes = Math.round(totalWords / 250);
    if (readingMinutes > 0) {
      const hours = Math.floor(readingMinutes / 60);
      const mins = readingMinutes % 60;
      results.push({
        icon: Brain,
        title: 'Total Reading Time',
        value: hours > 0 ? `${hours}h ${mins}m` : `${mins} min`,
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30',
      });
    }

    return results.slice(0, 6);
  }, [debates]);

  if (insights.length === 0) return null;

  return (
    <div className={clsx('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}>
      {insights.map((insight) => {
        const Icon = insight.icon;
        return (
          <div
            key={insight.title}
            className="group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 transition-all duration-200 hover:border-gray-200 hover:shadow-sm dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4"
          >
            <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110', insight.bgColor)}>
              <Icon className={clsx('h-4 w-4', insight.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate">{insight.title}</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{insight.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DebateInsights;
