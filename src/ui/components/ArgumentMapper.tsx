import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  AlertTriangle, ChevronDown, ChevronRight, MessageSquare,
  ArrowRight, User,
} from 'lucide-react';
import type { Debate, DebateTurn } from '../../types';

/* ======================================================================
   ArgumentMapper — Visual argument map showing the logical structure
   of a debate as a grid of connected nodes.

   Each turn becomes a card-node with:
   - Speaker avatar initial + color
   - Brief excerpt (first 50 chars)
   - Turn number + phase
   - Fallacy warning icons
   - Collapse/expand for full content

   Connections:
   - Solid lines between adjacent turns (direct rebuttals)
   - Dashed lines for tangential references (same-phase, non-adjacent)

   Layout uses CSS grid — no external graph library needed.
   ====================================================================== */

export interface ArgumentMapperProps {
  debate: Debate;
  className?: string;
}

interface NodeData {
  index: number;
  turn: DebateTurn;
  role: 'proposition' | 'opposition' | 'housemaster';
  speakerInitial: string;
  speakerName: string;
  excerpt: string;
  hasFallacies: boolean;
  fallacyCount: number;
  phase: string;
}

const PHASE_LABELS: Record<string, string> = {
  introduction: 'Intro',
  opening: 'Opening',
  transition: 'Transition',
  rebuttal: 'Rebuttal',
  'cross-examination': 'Cross-Exam',
  closing: 'Closing',
  verdict: 'Verdict',
};

const ROLE_STYLES: Record<string, {
  border: string;
  bg: string;
  avatar: string;
  avatarText: string;
  badge: string;
  badgeText: string;
  connector: string;
}> = {
  proposition: {
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    avatar: 'bg-blue-500 dark:bg-blue-600',
    avatarText: 'text-white',
    badge: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    connector: 'bg-blue-300 dark:bg-blue-700',
  },
  opposition: {
    border: 'border-rose-300 dark:border-rose-700',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    avatar: 'bg-rose-500 dark:bg-rose-600',
    avatarText: 'text-white',
    badge: 'bg-rose-100 dark:bg-rose-900/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    connector: 'bg-rose-300 dark:bg-rose-700',
  },
  housemaster: {
    border: 'border-amber-300 dark:border-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    avatar: 'bg-amber-500 dark:bg-amber-600',
    avatarText: 'text-white',
    badge: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    connector: 'bg-amber-300 dark:bg-amber-700',
  },
};

export const ArgumentMapper: React.FC<ArgumentMapperProps> = ({ debate, className }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const nodes: NodeData[] = useMemo(() => {
    return debate.turns.map((turn, i) => {
      const debater = debate.debaters.find((d) => d.id === turn.debaterId);
      const role = debater?.position ?? 'proposition';
      return {
        index: i,
        turn,
        role,
        speakerInitial: turn.debaterName.charAt(0).toUpperCase(),
        speakerName: turn.debaterName,
        excerpt: turn.content.slice(0, 50) + (turn.content.length > 50 ? '...' : ''),
        hasFallacies: (turn.fallacies?.length ?? 0) > 0,
        fallacyCount: turn.fallacies?.length ?? 0,
        phase: PHASE_LABELS[turn.phase] ?? turn.phase,
      };
    });
  }, [debate.turns, debate.debaters]);

  const toggleNode = (idx: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Determine connection type between consecutive nodes
  const getConnectionType = (prev: NodeData, curr: NodeData): 'direct' | 'tangential' => {
    // A direct rebuttal: different speakers in the same or adjacent phases
    if (prev.role !== curr.role) return 'direct';
    // Same speaker continuing: tangential
    return 'tangential';
  };

  if (nodes.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500', className)}>
        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No arguments to map yet.</p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 dark:border-surface-dark-3 bg-white dark:bg-surface-dark-1 p-5 overflow-x-auto',
        className,
      )}
      role="region"
      aria-label="Argument map"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-forge-100 dark:bg-forge-900/40 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-forge-600 dark:text-forge-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Argument Map</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{nodes.length} nodes</p>
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-5 h-0.5 bg-gray-400 dark:bg-gray-500 rounded-full inline-block" /> Direct rebuttal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-0.5 border-b border-dashed border-gray-400 dark:border-gray-500 inline-block" /> Tangential
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Fallacy
          </span>
        </div>
      </div>

      {/* ── Argument flow ────────────────────────────────── */}
      <div className="space-y-0">
        {nodes.map((node, i) => {
          const styles = ROLE_STYLES[node.role] ?? ROLE_STYLES.housemaster;
          const isExpanded = expandedNodes.has(node.index);
          const prevNode = i > 0 ? nodes[i - 1] : null;
          const connectionType = prevNode ? getConnectionType(prevNode, node) : null;

          return (
            <React.Fragment key={node.index}>
              {/* ── Connector between nodes ──────────── */}
              {connectionType && (
                <div className="flex justify-center py-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={clsx(
                        'w-0.5 h-6',
                        connectionType === 'direct'
                          ? 'bg-gray-300 dark:bg-gray-600'
                          : 'border-l border-dashed border-gray-300 dark:border-gray-600',
                      )}
                    />
                    <ArrowRight
                      className={clsx(
                        'w-3 h-3 rotate-90',
                        connectionType === 'direct'
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-300 dark:text-gray-600',
                      )}
                    />
                  </div>
                </div>
              )}

              {/* ── Node card ────────────────────────── */}
              <button
                onClick={() => toggleNode(node.index)}
                className={clsx(
                  'w-full text-left rounded-lg border p-3 transition-all duration-200',
                  'hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
                  styles.border,
                  styles.bg,
                  isExpanded && 'shadow-md',
                )}
                aria-expanded={isExpanded}
                aria-label={`Turn ${node.index + 1} by ${node.speakerName}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={clsx(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      styles.avatar,
                      styles.avatarText,
                    )}
                  >
                    {node.speakerInitial}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                        {node.speakerName}
                      </span>
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase',
                          styles.badge,
                          styles.badgeText,
                        )}
                      >
                        {node.role}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        Turn {node.index + 1} &middot; {node.phase}
                      </span>

                      {/* Fallacy indicator */}
                      {node.hasFallacies && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          {node.fallacyCount}
                        </span>
                      )}

                      {/* Expand chevron */}
                      <span className="ml-auto">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </span>
                    </div>

                    {/* Excerpt or full content */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {isExpanded ? node.turn.content : node.excerpt}
                    </p>

                    {/* Expanded fallacy details */}
                    {isExpanded && node.hasFallacies && (
                      <div className="mt-2 space-y-1">
                        {node.turn.fallacies!.map((f, fi) => (
                          <div
                            key={fi}
                            className="flex items-start gap-1.5 p-1.5 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                {f.name}
                              </span>
                              <span className={clsx(
                                'ml-1.5 text-[9px] px-1 py-0.5 rounded-full font-medium uppercase',
                                f.severity === 'high'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : f.severity === 'medium'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-surface-dark-2 dark:text-gray-400',
                              )}>
                                {f.severity}
                              </span>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {f.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expanded citation list */}
                    {isExpanded && node.turn.citations.length > 0 && (
                      <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="font-medium">Citations:</span>{' '}
                        {node.turn.citations.map((c) => c.title || c.url).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ArgumentMapper;
