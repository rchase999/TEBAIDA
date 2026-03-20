import React, { useRef, useCallback } from 'react';
import clsx from 'clsx';
import {
  Copy, Download, Share2, Swords, Shield,
  Trophy, MessageSquare, AlertTriangle, Clock,
} from 'lucide-react';
import type { Debate } from '../../types';

export interface DebateShareCardProps {
  debate: Debate;
  className?: string;
}

/**
 * A beautiful shareable card that summarizes a debate.
 * Can be copied as an image or shared as text.
 */
export const DebateShareCard: React.FC<DebateShareCardProps> = ({ debate, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const prop = debate.debaters?.find((d) => d.position === 'proposition');
  const opp = debate.debaters?.find((d) => d.position === 'opposition');
  const turnCount = debate.turns?.length ?? 0;
  const fallacyCount = debate.turns?.reduce((sum, t) => sum + (t.fallacies?.length ?? 0), 0) ?? 0;
  const citationCount = debate.turns?.reduce((sum, t) => sum + (t.citations?.length ?? 0), 0) ?? 0;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  };

  const handleCopyText = useCallback(() => {
    const text = [
      `DebateForge - AI Debate Results`,
      ``,
      `Topic: ${debate.topic}`,
      `Format: ${debate.format?.name ?? 'Unknown'}`,
      `Date: ${formatDate(debate.createdAt)}`,
      ``,
      `${prop?.model?.displayName ?? 'Proposition'} vs ${opp?.model?.displayName ?? 'Opposition'}`,
      ``,
      `${turnCount} turns | ${citationCount} citations | ${fallacyCount} fallacies detected`,
      `Status: ${debate.status}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
  }, [debate, prop, opp, turnCount, citationCount, fallacyCount]);

  return (
    <div className={clsx('space-y-3', className)}>
      {/* The card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forge-600 via-forge-700 to-purple-800 p-6 text-white shadow-xl"
      >
        {/* Background decoration */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5" />

        {/* Header */}
        <div className="relative flex items-center gap-2 mb-4">
          <Swords className="h-5 w-5 text-white/80" />
          <span className="text-sm font-semibold text-white/80">DebateForge</span>
        </div>

        {/* Topic */}
        <h3 className="relative text-lg font-bold leading-tight mb-4">{debate.topic}</h3>

        {/* Matchup */}
        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
            <Shield className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium">{prop?.model?.displayName ?? 'Proposition'}</span>
          </div>
          <span className="text-sm font-bold text-white/60">vs</span>
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
            <Swords className="h-4 w-4 text-rose-300" />
            <span className="text-sm font-medium">{opp?.model?.displayName ?? 'Opposition'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/10 p-2.5 text-center">
            <MessageSquare className="mx-auto h-4 w-4 text-white/60 mb-1" />
            <p className="text-lg font-bold">{turnCount}</p>
            <p className="text-[10px] text-white/60">Turns</p>
          </div>
          <div className="rounded-lg bg-white/10 p-2.5 text-center">
            <AlertTriangle className="mx-auto h-4 w-4 text-white/60 mb-1" />
            <p className="text-lg font-bold">{fallacyCount}</p>
            <p className="text-[10px] text-white/60">Fallacies</p>
          </div>
          <div className="rounded-lg bg-white/10 p-2.5 text-center">
            <Trophy className="mx-auto h-4 w-4 text-white/60 mb-1" />
            <p className="text-lg font-bold capitalize">{debate.status}</p>
            <p className="text-[10px] text-white/60">Status</p>
          </div>
        </div>

        {/* Date */}
        <div className="relative mt-3 flex items-center gap-1.5 text-xs text-white/50">
          <Clock className="h-3 w-3" />
          {formatDate(debate.createdAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyText}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:text-gray-300 dark:hover:bg-surface-dark-2"
        >
          <Copy className="h-3.5 w-3.5" /> Copy Summary
        </button>
      </div>
    </div>
  );
};

export default DebateShareCard;
