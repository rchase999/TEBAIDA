import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Trophy, Swords, HelpCircle, Zap, Quote,
  ChevronDown, ChevronRight, Sparkles,
  Shield, Crown,
} from 'lucide-react';
import { Badge } from './Badge';
import type { Debate } from '../../types';
import { analyzeHighlights, type DebateHighlight, type HighlightType } from '../../core/highlights/index';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_LABELS: Record<string, string> = {
  introduction: 'Introduction',
  opening: 'Opening Statement',
  transition: 'Transition',
  rebuttal: 'Rebuttal',
  'cross-examination': 'Cross-Examination',
  closing: 'Closing Statement',
  verdict: 'Verdict',
};

const ROLE_COLORS: Record<string, {
  text: string;
  badge: string;
  border: string;
  blockquoteBorder: string;
}> = {
  proposition: {
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    blockquoteBorder: 'border-l-blue-400 dark:border-l-blue-500',
  },
  opposition: {
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    blockquoteBorder: 'border-l-rose-400 dark:border-l-rose-500',
  },
  housemaster: {
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    blockquoteBorder: 'border-l-amber-400 dark:border-l-amber-500',
  },
};

const HIGHLIGHT_CONFIG: Record<HighlightType, {
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  'strongest-argument': {
    icon: Trophy,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Strongest Argument',
  },
  'best-rebuttal': {
    icon: Swords,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Best Rebuttal',
  },
  'most-devastating-question': {
    icon: HelpCircle,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Most Devastating Question',
  },
  'decisive-moment': {
    icon: Zap,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Decisive Moment',
  },
  'key-quote': {
    icon: Quote,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Key Quote',
  },
};

// ---------------------------------------------------------------------------
// Role icon helper
// ---------------------------------------------------------------------------

function getRoleIcon(role: string, className: string = 'h-3.5 w-3.5') {
  switch (role) {
    case 'housemaster':
      return <Crown className={className} />;
    case 'proposition':
      return <Shield className={className} />;
    case 'opposition':
      return <Swords className={className} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Single highlight card
// ---------------------------------------------------------------------------

interface HighlightCardProps {
  highlight: DebateHighlight;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ highlight }) => {
  const config = HIGHLIGHT_CONFIG[highlight.type];
  const roleColors = ROLE_COLORS[highlight.role] ?? ROLE_COLORS.proposition;
  const IconComponent = config.icon;

  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-colors duration-200',
      'bg-white dark:bg-surface-dark-1',
      'border-gray-200 dark:border-surface-dark-3',
      'hover:border-gray-300 dark:hover:border-surface-dark-4',
    )}>
      {/* Header row: type icon + title + phase badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={clsx(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            config.bgColor,
          )}>
            <IconComponent className={clsx('h-4.5 w-4.5', config.color)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {config.label}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                roleColors.badge,
              )}>
                {getRoleIcon(highlight.role, 'h-3 w-3')}
                {highlight.debaterName}
              </span>
            </div>
          </div>
        </div>
        <Badge>{PHASE_LABELS[highlight.phase] ?? highlight.phase}</Badge>
      </div>

      {/* Quote blockquote */}
      <blockquote className={clsx(
        'ml-1 border-l-3 pl-3 text-sm italic text-gray-700 dark:text-gray-300',
        roleColors.blockquoteBorder,
      )}>
        &ldquo;{highlight.quote}&rdquo;
      </blockquote>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface HighlightsPanelProps {
  debate: Debate;
}

export const HighlightsPanel: React.FC<HighlightsPanelProps> = ({ debate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const highlights = useMemo(() => analyzeHighlights(debate), [debate]);

  if (highlights.length === 0) return null;

  return (
    <div className={clsx(
      'rounded-2xl border overflow-hidden transition-all duration-300',
      'border-gray-200 dark:border-surface-dark-3',
      'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-surface-dark-0 dark:to-surface-dark-1',
    )}>
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'flex w-full items-center justify-between px-5 py-4 text-left',
          'transition-colors duration-200',
          'hover:bg-gray-100/50 dark:hover:bg-surface-dark-2/50',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Debate Highlights
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {highlights.length} key moment{highlights.length !== 1 ? 's' : ''} from this debate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">{highlights.length}</Badge>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="space-y-3 px-5 pb-5">
          {highlights.map((highlight, index) => (
            <HighlightCard key={`${highlight.type}-${index}`} highlight={highlight} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HighlightsPanel;
