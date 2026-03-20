import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  FileText, Shield, Swords, AlertTriangle, BookOpen,
  Trophy, MessageSquare, TrendingUp, BarChart3,
} from 'lucide-react';
import type { Debate } from '../../types';
import { Card } from './Card';

export interface DebateSummaryGeneratorProps {
  debate: Debate;
  className?: string;
}

/**
 * Generates a comprehensive text summary of a completed debate
 * using heuristic analysis (no AI API call needed).
 */
export const DebateSummaryGenerator: React.FC<DebateSummaryGeneratorProps> = ({
  debate,
  className,
}) => {
  const summary = useMemo(() => {
    const turns = debate.turns ?? [];
    const prop = debate.debaters?.find((d) => d.position === 'proposition');
    const opp = debate.debaters?.find((d) => d.position === 'opposition');

    // Word counts
    const propWords = turns
      .filter((t) => t.debaterId === prop?.id)
      .reduce((sum, t) => sum + (t.content?.split(/\s+/).length ?? 0), 0);
    const oppWords = turns
      .filter((t) => t.debaterId === opp?.id)
      .reduce((sum, t) => sum + (t.content?.split(/\s+/).length ?? 0), 0);

    // Citations
    const propCitations = turns
      .filter((t) => t.debaterId === prop?.id)
      .reduce((sum, t) => sum + (t.citations?.length ?? 0), 0);
    const oppCitations = turns
      .filter((t) => t.debaterId === opp?.id)
      .reduce((sum, t) => sum + (t.citations?.length ?? 0), 0);

    // Fallacies
    const propFallacies = turns
      .filter((t) => t.debaterId === prop?.id)
      .reduce((sum, t) => sum + (t.fallacies?.length ?? 0), 0);
    const oppFallacies = turns
      .filter((t) => t.debaterId === opp?.id)
      .reduce((sum, t) => sum + (t.fallacies?.length ?? 0), 0);

    // Scores
    const propScore = debate.scores?.find((s) => s.debaterId === prop?.id);
    const oppScore = debate.scores?.find((s) => s.debaterId === opp?.id);

    // Determine winner
    const propOverall = propScore?.categories?.overall ?? 0;
    const oppOverall = oppScore?.categories?.overall ?? 0;
    let winner = 'Draw';
    let winnerModel = '';
    if (propOverall > oppOverall) {
      winner = 'Proposition';
      winnerModel = prop?.model?.displayName ?? 'Proposition';
    } else if (oppOverall > propOverall) {
      winner = 'Opposition';
      winnerModel = opp?.model?.displayName ?? 'Opposition';
    }

    // Key arguments (first sentence of opening turns)
    const propOpening = turns.find((t) => t.debaterId === prop?.id && t.phase === 'opening');
    const oppOpening = turns.find((t) => t.debaterId === opp?.id && t.phase === 'opening');
    const propKeyArg = propOpening?.content?.split('.')[0]?.trim() ?? '';
    const oppKeyArg = oppOpening?.content?.split('.')[0]?.trim() ?? '';

    // Most common fallacy types
    const fallacyTypes: Record<string, number> = {};
    turns.forEach((t) => t.fallacies?.forEach((f) => {
      fallacyTypes[f.name] = (fallacyTypes[f.name] ?? 0) + 1;
    }));
    const topFallacy = Object.entries(fallacyTypes).sort((a, b) => b[1] - a[1])[0];

    return {
      propName: prop?.model?.displayName ?? 'Proposition',
      oppName: opp?.model?.displayName ?? 'Opposition',
      propWords, oppWords,
      propCitations, oppCitations,
      propFallacies, oppFallacies,
      propOverall, oppOverall,
      winner, winnerModel,
      propKeyArg, oppKeyArg,
      topFallacy,
      totalTurns: turns.length,
      format: debate.format?.name ?? 'Unknown',
    };
  }, [debate]);

  return (
    <Card className={clsx('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-forge-600 dark:text-forge-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Debate Summary</h3>
      </div>

      {/* Matchup */}
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-surface-dark-2">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{summary.propName}</span>
        </div>
        <span className="text-xs font-bold text-gray-400">vs</span>
        <div className="flex items-center gap-1.5">
          <Swords className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">{summary.oppName}</span>
        </div>
      </div>

      {/* Result */}
      {summary.winner !== 'Draw' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/10">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Winner: {summary.winnerModel}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({summary.propOverall} vs {summary.oppOverall})
            </span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Words</p>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{summary.propWords}</span>
            <span className="text-[10px] text-gray-400">vs</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{summary.oppWords}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Citations</p>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{summary.propCitations}</span>
            <span className="text-[10px] text-gray-400">vs</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{summary.oppCitations}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Fallacies</p>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{summary.propFallacies}</span>
            <span className="text-[10px] text-gray-400">vs</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{summary.oppFallacies}</span>
          </div>
        </div>
      </div>

      {/* Key arguments */}
      {(summary.propKeyArg || summary.oppKeyArg) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Key Arguments</p>
          {summary.propKeyArg && (
            <div className="rounded-lg border-l-2 border-blue-400 bg-blue-50/50 px-3 py-2 dark:bg-blue-900/10">
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">{summary.propName}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">&ldquo;{summary.propKeyArg}&rdquo;</p>
            </div>
          )}
          {summary.oppKeyArg && (
            <div className="rounded-lg border-l-2 border-rose-400 bg-rose-50/50 px-3 py-2 dark:bg-rose-900/10">
              <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mb-0.5">{summary.oppName}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">&ldquo;{summary.oppKeyArg}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* Top fallacy */}
      {summary.topFallacy && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/10">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-gray-700 dark:text-gray-300">
            Most common fallacy: <span className="font-semibold">{summary.topFallacy[0]}</span> ({summary.topFallacy[1]}x)
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 pt-1">
        <span>{summary.format} format</span>
        <span>{summary.totalTurns} turns</span>
      </div>
    </Card>
  );
};

export default DebateSummaryGenerator;
