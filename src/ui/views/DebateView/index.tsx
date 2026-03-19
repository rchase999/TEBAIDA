import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  Play, Pause, Square, PanelRightOpen, PanelRightClose,
  ExternalLink, AlertTriangle, ChevronRight, RotateCcw,
  Gavel, Crown, Shield, Swords, ChevronDown, ChevronUp, MessageSquare,
  Download, Copy, CheckCheck,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { TypingIndicator } from '../../components/TypingIndicator';
import { ThinkingBlock } from '../../components/ThinkingBlock';
import { Tooltip } from '../../components/Tooltip';
import ReactionBar, { ReactionSummary } from '../../components/ReactionBar';
import type { ReactionsMap, ReactionCounts } from '../../components/ReactionBar';
import FloatingReaction from '../../components/FloatingReaction';
import CommentaryInput, { CommentBubble } from '../../components/CommentaryInput';
import EvidencePanel from '../EvidencePanel/index';
import { MomentumGraph } from '../../components/MomentumGraph';
import { HighlightsPanel } from '../../components/HighlightsPanel';
import { ShareCardButtons } from '../../components/ShareCard';
import { DebateEngine } from '../../../core/debate_engine/index';
import { ModelRouter } from '../../../services/model-router';
import { EvidenceVerifier } from '../../../core/evidence_verifier/index';
import { FallacyDetector } from '../../../core/fallacy_detector/index';
import { calculateMomentum } from '../../../core/momentum/index';
import { calculateScores } from '../../../utils/scoring';
import { VoiceSynthesisControls, SpeakButton, useVoiceSynthesis } from '../../components/VoiceSynthesis';
import type { DebateScore } from '../../../types';
import type { DebateTurn, DebaterConfig, DetectedFallacy, Citation, Debate, DebatePhase, UserComment, OpinionValue, MomentumPoint } from '../../../types';

/* ======================================================================
   Oxford Union Debate Cycle (10 fixed turns)
   ======================================================================
   1.  Housemaster:  Introduction
   2.  Proposition:  Opening Statement
   3.  Opposition:   Opening Statement
   4.  Housemaster:  Transition
   5.  Proposition:  Rebuttal
   6.  Opposition:   Rebuttal
   7.  Housemaster:  Cross-Examination
   8.  Proposition:  Closing Statement
   9.  Opposition:   Closing Statement
   10. Housemaster:  Verdict
   ====================================================================== */

/* ------- Role types ------- */
type DebateRole = 'proposition' | 'opposition' | 'housemaster';

/* ------- Phase labels ------- */
const PHASE_LABELS: Record<string, string> = {
  introduction: 'Introduction',
  opening: 'Opening Statement',
  transition: 'Transition',
  rebuttal: 'Rebuttal',
  'cross-examination': 'Cross-Examination',
  closing: 'Closing Statement',
  verdict: 'Verdict',
};

/* ------- Role labels ------- */
const ROLE_LABELS: Record<DebateRole, string> = {
  housemaster: 'Housemaster',
  proposition: 'Proposition',
  opposition: 'Opposition',
};

/* ------- Color palettes per role ------- */
const ROLE_COLORS: Record<DebateRole, {
  bg: string;
  border: string;
  text: string;
  accent: string;
  badge: string;
  gradient: string;
}> = {
  housemaster: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-300',
    accent: '#D97706',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20',
  },
  proposition: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    accent: '#3B82F6',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20',
  },
  opposition: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    accent: '#F43F5E',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    gradient: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20',
  },
};

/* ------- Role icon ------- */
function getRoleIcon(role: DebateRole, className: string = 'h-4 w-4') {
  switch (role) {
    case 'housemaster':
      return <Crown className={className} />;
    case 'proposition':
      return <Shield className={className} />;
    case 'opposition':
      return <Swords className={className} />;
  }
}

/* ------- Helper: resolve role from debater position ------- */
function resolveRole(position: string | undefined): DebateRole {
  if (position === 'proposition') return 'proposition';
  if (position === 'opposition') return 'opposition';
  if (position === 'housemaster') return 'housemaster';
  return 'proposition';
}

/* ------- Helper: get the current step from debate state ------- */
function getCurrentStep(debate: Debate): number {
  return debate.turns.length;
}

function getTotalSteps(debate: Debate): number {
  return debate.format.totalTurns ?? debate.format.turnSequence?.length ?? 10;
}

/* ------- Helper: look up the debater for a given turn-sequence step ------- */
function getDebaterForStep(debate: Debate, stepIndex: number): DebaterConfig | undefined {
  const seq = debate.format.turnSequence;
  if (!seq || stepIndex >= seq.length) return undefined;
  const stepRole = seq[stepIndex].role;
  return debate.debaters.find((d) => d.position === stepRole);
}

function getPhaseForStep(debate: Debate, stepIndex: number): DebatePhase | undefined {
  const seq = debate.format.turnSequence;
  if (!seq || stepIndex >= seq.length) return undefined;
  return seq[stepIndex].phase;
}

function getRoleForStep(debate: Debate, stepIndex: number): DebateRole | undefined {
  const seq = debate.format.turnSequence;
  if (!seq || stepIndex >= seq.length) return undefined;
  return seq[stepIndex].role;
}

/* ------- Fallacy inline badge ------- */
const FallacyBadge: React.FC<{ fallacy: DetectedFallacy }> = ({ fallacy }) => (
  <Tooltip content={fallacy.description} position="top">
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium cursor-help',
      fallacy.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
      fallacy.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    )}>
      <AlertTriangle className="h-3 w-3" />
      {fallacy.name}
    </span>
  </Tooltip>
);

/* ======================================================================
   CitationList — reusable citation rendering
   ====================================================================== */
interface CitationListProps {
  citations: Citation[];
  onCitationClick: (url: string, passage: string) => void;
  centered?: boolean;
}

const CitationList: React.FC<CitationListProps> = ({ citations, onCitationClick, centered = false }) => (
  <div className="mt-3 border-t border-gray-200/50 pt-3 dark:border-gray-700/50">
    <p className={clsx('mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400', centered && 'text-center')}>Citations</p>
    <div className={clsx('flex flex-wrap gap-1.5', centered && 'justify-center')}>
      {citations.map((cite) => (
        <button
          key={cite.id}
          onClick={() => onCitationClick(cite.url, cite.passage)}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-forge-600 transition-colors hover:bg-forge-50 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-forge-400 dark:hover:bg-surface-dark-3"
        >
          <ExternalLink className="h-3 w-3" />
          {cite.title || new URL(cite.url).hostname}
        </button>
      ))}
    </div>
  </div>
);

/* ======================================================================
   FallacyList — reusable fallacy rendering
   ====================================================================== */
interface FallacyListProps {
  fallacies: DetectedFallacy[];
  centered?: boolean;
}

const FallacyList: React.FC<FallacyListProps> = ({ fallacies, centered = false }) => (
  <div className={clsx('mt-3 flex flex-wrap gap-1.5 border-t border-gray-200/50 pt-3 dark:border-gray-700/50', centered && 'justify-center')}>
    {fallacies.map((f, i) => (
      <FallacyBadge key={i} fallacy={f} />
    ))}
  </div>
);

/* ======================================================================
   TurnBubble — renders a single completed turn
   ====================================================================== */
interface TurnBubbleProps {
  turn: DebateTurn;
  role: DebateRole;
  stepNumber: number;
  totalSteps: number;
  debater?: DebaterConfig;
  onCitationClick: (url: string, passage: string) => void;
  reactionCounts: ReactionCounts;
  onReact: (turnId: string, emoji: string, event: React.MouseEvent) => void;
  ttsEnabled?: boolean;
  voiceAssignment?: import('../../components/VoiceSynthesis').VoiceAssignment;
}

const TurnBubble: React.FC<TurnBubbleProps> = ({ turn, role, stepNumber, totalSteps, debater, onCitationClick, reactionCounts, onReact, ttsEnabled, voiceAssignment }) => {
  const colors = ROLE_COLORS[role];
  const isHousemaster = role === 'housemaster';
  const isVerdict = turn.phase === 'verdict';

  /* ---- Verdict card: special rendering for the final Housemaster verdict ---- */
  if (isVerdict) {
    return (
      <div className="animate-fade-in">
        <div className={clsx(
          'mx-auto max-w-3xl rounded-2xl border-2 p-6 shadow-lg',
          'border-amber-400 dark:border-amber-600',
          'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
          'dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20',
        )}>
          {/* Verdict header */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <Gavel className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">
              Housemaster's Verdict
            </h3>
            <Gavel className="h-6 w-6 text-amber-600 dark:text-amber-400" style={{ transform: 'scaleX(-1)' }} />
          </div>

          <div className="mb-3 flex items-center justify-center gap-2">
            <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', colors.badge)}>
              <Crown className="h-3.5 w-3.5" />
              {turn.debaterName}
            </span>
            <Badge variant="info">{turn.model}</Badge>
            <Badge>Step {stepNumber} of {totalSteps}</Badge>
            <ReactionSummary counts={reactionCounts} />
          </div>

          {/* Thinking */}
          {turn.thinking && (
            <ThinkingBlock content={turn.thinking} className="mb-3" />
          )}

          {/* Verdict content */}
          <div className="rounded-xl border border-amber-200 bg-white/80 p-5 dark:border-amber-800/50 dark:bg-surface-dark-1/80">
            <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 dark:prose-invert whitespace-pre-wrap">
              {turn.content}
            </div>
          </div>

          {/* Fallacies */}
          {turn.fallacies && turn.fallacies.length > 0 && (
            <FallacyList fallacies={turn.fallacies} centered />
          )}

          {/* Citations */}
          {turn.citations && turn.citations.length > 0 && (
            <CitationList citations={turn.citations} onCitationClick={onCitationClick} centered />
          )}

          {/* Reactions */}
          <div className="mt-2 flex justify-center">
            <ReactionBar turnId={turn.id} counts={reactionCounts} onReact={onReact} />
          </div>

          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
            {new Date(turn.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  }

  /* ---- Housemaster turns (introduction, transition, cross-examination) ---- */
  if (isHousemaster) {
    return (
      <div className="animate-fade-in">
        <div className={clsx(
          'mx-auto max-w-3xl rounded-xl border p-5',
          'bg-gradient-to-r',
          colors.gradient,
          colors.border,
        )}>
          {/* Centered header */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', colors.badge)}>
              <Crown className="h-3.5 w-3.5" />
              Housemaster
            </span>
            <Badge variant="warning">{PHASE_LABELS[turn.phase] ?? turn.phase}</Badge>
            <Badge variant="info">{turn.model}</Badge>
            <Badge>Step {stepNumber} of {totalSteps}</Badge>
            <ReactionSummary counts={reactionCounts} />
          </div>

          {/* Thinking */}
          {turn.thinking && (
            <ThinkingBlock content={turn.thinking} className="mb-2" />
          )}

          {/* Content */}
          <div className="rounded-lg border border-amber-200/60 bg-white/70 p-4 dark:border-amber-800/40 dark:bg-surface-dark-1/70">
            <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 dark:prose-invert whitespace-pre-wrap text-center">
              {turn.content}
            </div>
          </div>

          {/* Fallacies */}
          {turn.fallacies && turn.fallacies.length > 0 && (
            <FallacyList fallacies={turn.fallacies} centered />
          )}

          {/* Citations */}
          {turn.citations && turn.citations.length > 0 && (
            <CitationList citations={turn.citations} onCitationClick={onCitationClick} centered />
          )}

          {/* Reactions */}
          <div className="mt-2 flex justify-center">
            <ReactionBar turnId={turn.id} counts={reactionCounts} onReact={onReact} />
          </div>

          <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            {new Date(turn.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  }

  /* ---- Proposition / Opposition turns ---- */
  const isProposition = role === 'proposition';

  return (
    <div className={clsx('flex gap-3 animate-fade-in', isProposition ? 'justify-start' : 'justify-end')}>
      {/* Avatar on left for proposition */}
      {isProposition && (
        <Avatar
          name={turn.debaterName}
          color={debater?.persona?.avatar_color ?? colors.accent}
          size="md"
          icon={getRoleIcon(role, 'h-5 w-5')}
        />
      )}

      <div className={clsx('min-w-0 max-w-[85%]')}>
        {/* Header */}
        <div className={clsx('mb-1.5 flex flex-wrap items-center gap-2', !isProposition && 'justify-end')}>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{turn.debaterName}</span>
          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', colors.badge)}>
            {getRoleIcon(role, 'h-3 w-3')}
            {ROLE_LABELS[role]}
          </span>
          <Badge>{PHASE_LABELS[turn.phase] ?? turn.phase}</Badge>
          <Badge variant="info">{turn.model}</Badge>
          <Badge variant="default">Step {stepNumber} of {totalSteps}</Badge>
          <ReactionSummary counts={reactionCounts} />
        </div>

        {/* Thinking (collapsible) */}
        {turn.thinking && (
          <ThinkingBlock content={turn.thinking} className="mb-2" />
        )}

        {/* Content */}
        <div className={clsx(
          'rounded-xl border p-4',
          colors.bg, colors.border,
        )}>
          <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 dark:prose-invert whitespace-pre-wrap">
            {turn.content}
          </div>

          {/* Fallacies */}
          {turn.fallacies && turn.fallacies.length > 0 && (
            <FallacyList fallacies={turn.fallacies} />
          )}

          {/* Citations */}
          {turn.citations && turn.citations.length > 0 && (
            <CitationList citations={turn.citations} onCitationClick={onCitationClick} />
          )}
        </div>

        {/* Reactions + TTS */}
        <div className="flex items-center gap-2">
          <ReactionBar turnId={turn.id} counts={reactionCounts} onReact={onReact} />
          <SpeakButton text={turn.content} voiceAssignment={voiceAssignment} enabled={!!ttsEnabled} />
        </div>

        <p className={clsx('mt-1 text-xs text-gray-400 dark:text-gray-500', !isProposition && 'text-right')}>
          {new Date(turn.timestamp).toLocaleTimeString()}
        </p>
      </div>

      {/* Avatar on right for opposition */}
      {!isProposition && (
        <Avatar
          name={turn.debaterName}
          color={debater?.persona?.avatar_color ?? colors.accent}
          size="md"
          icon={getRoleIcon(role, 'h-5 w-5')}
        />
      )}
    </div>
  );
};

/* ======================================================================
   StepProgressIndicator — shows progress through the 10-step cycle
   ====================================================================== */
interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  debate: Debate;
}

const StepProgressIndicator: React.FC<StepProgressProps> = ({ currentStep, totalSteps, debate }) => {
  const seq = debate.format.turnSequence ?? [];

  return (
    <div className="flex items-center gap-1">
      {seq.map((step, i) => {
        const role = step.role as DebateRole;
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <Tooltip
            key={i}
            content={`Step ${i + 1}: ${ROLE_LABELS[role]} — ${PHASE_LABELS[step.phase] ?? step.phase}`}
            position="top"
          >
            <div
              className={clsx(
                'h-2.5 rounded-full transition-all duration-300',
                totalSteps <= 10 ? 'w-8' : 'w-6',
                isCompleted
                  ? role === 'housemaster'
                    ? 'bg-amber-400 dark:bg-amber-500'
                    : role === 'proposition'
                    ? 'bg-blue-400 dark:bg-blue-500'
                    : 'bg-rose-400 dark:bg-rose-500'
                  : isCurrent
                  ? clsx(
                      'ring-2 ring-offset-1 dark:ring-offset-surface-dark-0',
                      role === 'housemaster'
                        ? 'bg-amber-200 ring-amber-400 dark:bg-amber-800 dark:ring-amber-500'
                        : role === 'proposition'
                        ? 'bg-blue-200 ring-blue-400 dark:bg-blue-800 dark:ring-blue-500'
                        : 'bg-rose-200 ring-rose-400 dark:bg-rose-800 dark:ring-rose-500',
                    )
                  : 'bg-gray-200 dark:bg-surface-dark-3',
              )}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

/* ------- Shared instances ------- */
const debateEngine = new DebateEngine();
const evidenceVerifier = new EvidenceVerifier();
const fallacyDetector = new FallacyDetector();

/* ======================================================================
   Main DebateView
   ====================================================================== */
const DebateView: React.FC = () => {
  const currentDebate = useStore((s) => s.currentDebate);
  const setCurrentDebate = useStore((s) => s.setCurrentDebate);
  const isDebating = useStore((s) => s.isDebating);
  const streamingContent = useStore((s) => s.streamingContent);
  const streamingThinking = useStore((s) => s.streamingThinking);
  const setStreamingContent = useStore((s) => s.setStreamingContent);
  const setStreamingThinking = useStore((s) => s.setStreamingThinking);
  const clearStreamingContent = useStore((s) => s.clearStreamingContent);
  const addTurn = useStore((s) => s.addTurn);
  const apiKeys = useStore((s) => s.apiKeys);
  const settings = useStore((s) => s.settings);
  const showEvidencePanel = useStore((s) => s.showEvidencePanel);
  const toggleEvidencePanel = useStore((s) => s.toggleEvidencePanel);
  const setEvidence = useStore((s) => s.setEvidence);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const recordDebateResult = useStore((s) => s.recordDebateResult);

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Feature 1: User Question Injection state ── */
  const [userQuestions, setUserQuestions] = useState<string[]>([]);
  const [questionDraft, setQuestionDraft] = useState('');
  const [questionPanelOpen, setQuestionPanelOpen] = useState(false);

  /* ── Feature 2: Reaction Buttons state ── */
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; emoji: string; x: number; y: number }[]
  >([]);
  const floatingIdRef = useRef(0);

  /* ── Feature 3: Live Commentary state ── */
  const [comments, setComments] = useState<UserComment[]>(currentDebate?.comments ?? []);

  /* ── Feature 4: Post-Debate Opinion Poll state ── */
  const [postOpinion, setPostOpinion] = useState<OpinionValue | null>(currentDebate?.userPostOpinion ?? null);
  const [showPostPoll, setShowPostPoll] = useState(false);

  /* ── Feature 5: Live Momentum Graph state ── */
  const [showMomentumGraph, setShowMomentumGraph] = useState(true);

  /* ── Feature 6: Transcript Export ── */
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const generateTranscriptMarkdown = useCallback((): string => {
    if (!currentDebate) return '';
    const lines: string[] = [];
    lines.push(`# Debate: ${currentDebate.topic}`);
    lines.push(`**Format:** ${currentDebate.format.name}`);
    lines.push(`**Date:** ${new Date(currentDebate.createdAt).toLocaleDateString()}`);
    lines.push(`**Status:** ${currentDebate.status}`);
    lines.push('');
    lines.push('## Participants');
    for (const d of currentDebate.debaters) {
      lines.push(`- **${d.name}** (${d.position}) — ${d.model.displayName} / ${d.persona.name}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const [i, turn] of currentDebate.turns.entries()) {
      const debater = currentDebate.debaters.find((d) => d.id === turn.debaterId);
      const role = debater?.position ?? 'unknown';
      const phaseLabel = PHASE_LABELS[turn.phase] ?? turn.phase;
      lines.push(`### Step ${i + 1}: ${phaseLabel} — ${turn.debaterName} [${role.toUpperCase()}]`);
      lines.push(`*Model: ${turn.model} | Persona: ${turn.persona}*`);
      lines.push('');
      lines.push(turn.content);
      lines.push('');
      if (turn.citations && turn.citations.length > 0) {
        lines.push('**Citations:**');
        for (const c of turn.citations) {
          lines.push(`- [${c.title || c.url}](${c.url})`);
        }
        lines.push('');
      }
      if (turn.fallacies && turn.fallacies.length > 0) {
        lines.push('**Detected Fallacies:**');
        for (const f of turn.fallacies) {
          lines.push(`- ${f.name} (${f.severity}): ${f.description}`);
        }
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }, [currentDebate]);

  const handleExportTranscript = useCallback(() => {
    const markdown = generateTranscriptMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-${currentDebate?.topic?.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '-') ?? 'transcript'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateTranscriptMarkdown, currentDebate]);

  const handleCopyTranscript = useCallback(async () => {
    const markdown = generateTranscriptMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = markdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  }, [generateTranscriptMarkdown]);

  // Calculate momentum data from current turns
  const momentumData: MomentumPoint[] = useMemo(() => {
    if (!currentDebate || currentDebate.turns.length === 0) return [];
    return calculateMomentum(currentDebate);
  }, [currentDebate?.turns?.length, currentDebate]);

  // Calculate scores when debate completes
  const debateScores: DebateScore[] = useMemo(() => {
    if (!currentDebate || currentDebate.status !== 'completed') return [];
    return calculateScores(currentDebate).filter((s) => {
      // Only score proposition and opposition, not housemaster
      const debater = currentDebate.debaters.find((d) => d.id === s.debaterId);
      return debater?.position !== 'housemaster';
    });
  }, [currentDebate?.status, currentDebate]);

  // ── Voice Synthesis (TTS) ──
  const tts = useVoiceSynthesis();

  // Initialize TTS voices when debaters are available
  useEffect(() => {
    if (currentDebate?.debaters) {
      // Voices may load asynchronously, retry after a short delay
      const init = () => tts.initVoices(currentDebate.debaters);
      init();
      // Chrome loads voices asynchronously
      window.speechSynthesis?.addEventListener?.('voiceschanged', init);
      return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', init);
    }
  }, [currentDebate?.debaters, tts.initVoices]);

  // Auto-speak new turns when TTS is enabled
  useEffect(() => {
    if (tts.enabled && currentDebate?.turns && currentDebate.turns.length > 0) {
      const lastTurn = currentDebate.turns[currentDebate.turns.length - 1];
      if (lastTurn && !isGenerating) {
        tts.speak(lastTurn.content, lastTurn.debaterId);
      }
    }
  }, [currentDebate?.turns?.length, isGenerating, tts.enabled]);

  // ── Keyboard Shortcuts ── (defined before handleContinue, uses refs for late-bound values)
  const handleContinueRef = useRef<(() => void) | undefined>(undefined);
  // The ref is updated later when handleContinue is defined

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (!currentDebate) return;

      const debateIsPaused = currentDebate.status === 'paused';
      const debateIsCompleted = currentDebate.status === 'completed' || currentDebate.status === 'cancelled';
      const debateCurrentStep = currentDebate.turns?.length ?? 0;
      const debateTotalSteps = currentDebate.format?.totalTurns ?? 10;

      switch (e.key) {
        case ' ': // Space: pause/resume
          e.preventDefault();
          if (currentDebate.status === 'in-progress' || debateIsPaused) {
            if (debateIsPaused) {
              autoRunRef.current = true;
              setCurrentDebate({ ...currentDebate, status: 'in-progress', updatedAt: new Date().toISOString() });
            } else {
              autoRunRef.current = false;
              setCurrentDebate({ ...currentDebate, status: 'paused', updatedAt: new Date().toISOString() });
            }
          }
          break;
        case 'Enter': // Enter: continue to next turn
          e.preventDefault();
          if (!isGenerating && !debateIsPaused && debateCurrentStep < debateTotalSteps) {
            handleContinueRef.current?.();
          }
          break;
        case 'Escape': // Escape: stop debate
          e.preventDefault();
          if (!debateIsCompleted) {
            autoRunRef.current = false;
            setCurrentDebate({ ...currentDebate, status: 'completed', updatedAt: new Date().toISOString() });
          }
          break;
        case 'v': // V: toggle voice
          if (!e.ctrlKey && !e.metaKey) {
            tts.toggle();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDebate, isGenerating, setCurrentDebate, tts]);

  // Show the post-debate poll when the debate completes and user hasn't voted yet
  useEffect(() => {
    if (
      currentDebate?.status === 'completed' &&
      currentDebate?.userPreOpinion &&
      !currentDebate?.userPostOpinion &&
      !postOpinion
    ) {
      // Slight delay to let the verdict render first
      const timer = setTimeout(() => setShowPostPoll(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentDebate?.status, currentDebate?.userPreOpinion, currentDebate?.userPostOpinion, postOpinion]);

  // Handle post-debate opinion submission
  const handlePostOpinionSubmit = useCallback((opinion: OpinionValue) => {
    setPostOpinion(opinion);
    setShowPostPoll(false);
    if (currentDebate) {
      setCurrentDebate({
        ...currentDebate,
        userPostOpinion: opinion,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [currentDebate, setCurrentDebate]);

  // Auto-scroll to bottom when new turns appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentDebate?.turns?.length, streamingContent, comments.length]);

  // Build lookup maps
  const debaterMap = useMemo(() => {
    const map = new Map<string, DebaterConfig>();
    currentDebate?.debaters?.forEach((d) => map.set(d.id, d));
    return map;
  }, [currentDebate?.debaters]);

  // Compute current step information
  const stepInfo = useMemo(() => {
    if (!currentDebate) return null;
    const current = getCurrentStep(currentDebate);
    const total = getTotalSteps(currentDebate);
    const nextDebater = getDebaterForStep(currentDebate, current);
    const nextPhase = getPhaseForStep(currentDebate, current);
    const nextRole = getRoleForStep(currentDebate, current);

    return { current, total, nextDebater, nextPhase, nextRole };
  }, [currentDebate]);

  if (!currentDebate) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg text-gray-500 dark:text-gray-400">No active debate.</p>
          <Button onClick={() => setCurrentView('setup')}>Start New Debate</Button>
        </div>
      </div>
    );
  }

  const turns = currentDebate.turns ?? [];
  const totalSteps = getTotalSteps(currentDebate);
  const currentStep = getCurrentStep(currentDebate);
  const isPaused = currentDebate.status === 'paused';
  const isCompleted = currentDebate.status === 'completed';

  const handlePause = () => {
    if (isPaused) {
      autoRunRef.current = true;
    } else {
      autoRunRef.current = false;
    }
    setCurrentDebate({ ...currentDebate, status: isPaused ? 'in-progress' : 'paused', updatedAt: new Date().toISOString() });
  };

  const handleStop = () => {
    autoRunRef.current = false;
    setCurrentDebate({ ...currentDebate, status: 'completed', updatedAt: new Date().toISOString() });
  };

  const handleCitationClick = (url: string, passage: string) => {
    setEvidence(url, passage);
  };

  /* ── Feature 1: Question submission handler ── */
  const handleSubmitQuestion = useCallback(() => {
    const trimmed = questionDraft.trim();
    if (!trimmed) return;
    setUserQuestions((prev) => [...prev, trimmed]);
    setQuestionDraft('');
  }, [questionDraft]);

  const handleRemoveQuestion = useCallback((index: number) => {
    setUserQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── Feature 2: Reaction handler ── */
  const handleReact = useCallback((turnId: string, emoji: string, event: React.MouseEvent) => {
    // Increment the count
    setReactions((prev) => {
      const turnReactions = { ...(prev[turnId] ?? {}) };
      turnReactions[emoji] = (turnReactions[emoji] ?? 0) + 1;
      return { ...prev, [turnId]: turnReactions };
    });

    // Spawn a floating reaction at the click position
    const id = ++floatingIdRef.current;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setFloatingReactions((prev) => [
      ...prev,
      { id, emoji, x: rect.left + rect.width / 2, y: rect.top },
    ]);
  }, []);

  const handleFloatingComplete = useCallback((id: number) => {
    setFloatingReactions((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /* ── Feature 3: Commentary handler ── */
  const handleCommentSubmit = useCallback((comment: UserComment) => {
    setComments((prev) => [...prev, comment]);
    // Also persist to debate object
    if (currentDebate) {
      const updatedComments = [...(currentDebate.comments ?? []), comment];
      setCurrentDebate({
        ...currentDebate,
        comments: updatedComments,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [currentDebate, setCurrentDebate]);

  const handleContinue = useCallback(async () => {
    if (!currentDebate || isGenerating) return;

    // Determine the debater for the current step from the turn sequence
    const step = currentStep;
    const debater = getDebaterForStep(currentDebate, step);
    if (!debater) return;

    setError(null);
    setIsGenerating(true);
    clearStreamingContent();

    // Set the currentDebaterIndex and currentPhase to match this step
    const debaterIndex = currentDebate.debaters.findIndex((d) => d.id === debater.id);
    const phase = getPhaseForStep(currentDebate, step) ?? currentDebate.currentPhase;

    // Mark debate as actively generating
    setCurrentDebate({
      ...currentDebate,
      status: 'in-progress',
      currentDebaterIndex: debaterIndex,
      currentPhase: phase,
      updatedAt: new Date().toISOString(),
    });

    try {
      const router = new ModelRouter(apiKeys, {
        ollama: settings.localModelEndpoint,
        lmstudio: settings.lmStudioEndpoint,
      });

      // Build a mutable copy for the engine
      const debateCopy: Debate = JSON.parse(JSON.stringify(currentDebate));
      // Ensure the copy reflects the correct debater index and phase for this step
      debateCopy.currentDebaterIndex = debaterIndex;
      debateCopy.currentPhase = phase;

      // Create the stream function for this debater's model
      const streamFn = (messages: any[]) =>
        router.stream(debater.model.provider, messages, debater.model.name, debater.model.maxTokens);

      let fullContent = '';
      let thinkingContent = '';

      // Pass user questions to the engine when entering cross-examination (step index 6)
      const questionsForEngine = (step === 6 && userQuestions.length > 0) ? userQuestions : undefined;

      for await (const chunk of debateEngine.runTurn(debateCopy, streamFn, undefined, questionsForEngine)) {
        if (chunk.content) {
          if (chunk.type === 'thinking') {
            thinkingContent += chunk.content;
            setStreamingThinking(thinkingContent);
          } else {
            fullContent += chunk.content;
            setStreamingContent(fullContent);
          }
        }
      }

      // Clear user questions after they've been used in cross-examination
      if (step === 6 && userQuestions.length > 0) {
        setUserQuestions([]);
      }

      // The engine has appended the turn to debateCopy.turns
      const newTurn = debateCopy.turns[debateCopy.turns.length - 1];

      // Post-process: classify citations and detect fallacies
      if (newTurn.citations && newTurn.citations.length > 0) {
        await evidenceVerifier.verifyAndScoreAll(newTurn.citations);
      }
      // Run fallacy detection on debater turns (skip housemaster)
      if (debater.position !== 'housemaster' && newTurn.content) {
        newTurn.fallacies = fallacyDetector.detectFallacies(newTurn.content);
      }

      clearStreamingContent();

      // Determine next step
      const nextStep = step + 1;
      const isNowComplete = nextStep >= totalSteps;

      // Prepare the next debater index and phase for the following step
      const nextDebater = isNowComplete ? undefined : getDebaterForStep(currentDebate, nextStep);
      const nextPhase = isNowComplete ? undefined : getPhaseForStep(currentDebate, nextStep);
      const nextDebaterIndex = nextDebater
        ? currentDebate.debaters.findIndex((d) => d.id === nextDebater.id)
        : debateCopy.currentDebaterIndex;

      // Update the store with the new turn and advanced state
      setCurrentDebate({
        ...currentDebate,
        turns: [...currentDebate.turns, newTurn],
        currentDebaterIndex: nextDebaterIndex,
        currentPhase: nextPhase ?? currentDebate.currentPhase,
        currentRound: nextStep + 1, // 1-based step number for display
        status: isNowComplete ? 'completed' : 'in-progress',
        updatedAt: new Date().toISOString(),
      });

      // ── ELO: Record debate result when verdict is delivered ──
      if (isNowComplete && newTurn.phase === 'verdict' && newTurn.content) {
        try {
          const proposition = currentDebate.debaters.find((d) => d.position === 'proposition');
          const opposition = currentDebate.debaters.find((d) => d.position === 'opposition');

          if (proposition && opposition) {
            const verdictText = newTurn.content.toLowerCase();
            const propName = proposition.name.toLowerCase();
            const oppName = opposition.name.toLowerCase();
            const propModelName = proposition.model.displayName.toLowerCase();
            const oppModelName = opposition.model.displayName.toLowerCase();

            // Check for draw indicators
            const drawPatterns = [
              'draw', 'tie', 'no clear winner', 'both sides equally',
              'evenly matched', 'neither side', 'inconclusive',
            ];
            const isDraw = drawPatterns.some((p) => verdictText.includes(p));

            // Build regex patterns to detect winner
            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const propWinPatterns = [
              /winner[^.]{0,40}?proposition/i,
              /proposition[^.]{0,40}?win/i,
              /proposition[^.]{0,40}?prevail/i,
              /victory[^.]{0,40}?proposition/i,
              /declare[^.]{0,40}?proposition/i,
              new RegExp(`winner[^.]{0,40}?${escapeRegex(propName)}`, 'i'),
              new RegExp(`${escapeRegex(propName)}[^.]{0,40}?win`, 'i'),
              new RegExp(`${escapeRegex(propName)}[^.]{0,40}?prevail`, 'i'),
              new RegExp(`declare[^.]{0,40}?${escapeRegex(propName)}`, 'i'),
              new RegExp(`winner[^.]{0,40}?${escapeRegex(propModelName)}`, 'i'),
              new RegExp(`${escapeRegex(propModelName)}[^.]{0,40}?win`, 'i'),
            ];

            const oppWinPatterns = [
              /winner[^.]{0,40}?opposition/i,
              /opposition[^.]{0,40}?win/i,
              /opposition[^.]{0,40}?prevail/i,
              /victory[^.]{0,40}?opposition/i,
              /declare[^.]{0,40}?opposition/i,
              new RegExp(`winner[^.]{0,40}?${escapeRegex(oppName)}`, 'i'),
              new RegExp(`${escapeRegex(oppName)}[^.]{0,40}?win`, 'i'),
              new RegExp(`${escapeRegex(oppName)}[^.]{0,40}?prevail`, 'i'),
              new RegExp(`declare[^.]{0,40}?${escapeRegex(oppName)}`, 'i'),
              new RegExp(`winner[^.]{0,40}?${escapeRegex(oppModelName)}`, 'i'),
              new RegExp(`${escapeRegex(oppModelName)}[^.]{0,40}?win`, 'i'),
            ];

            const propWins = propWinPatterns.some((p) => p.test(newTurn.content));
            const oppWins = oppWinPatterns.some((p) => p.test(newTurn.content));

            const propModel = {
              id: proposition.model.id,
              name: proposition.model.name,
              displayName: proposition.model.displayName,
              provider: proposition.model.provider,
            };
            const oppModel = {
              id: opposition.model.id,
              name: opposition.model.name,
              displayName: opposition.model.displayName,
              provider: opposition.model.provider,
            };

            if (isDraw) {
              recordDebateResult(proposition.model.id, opposition.model.id, true, propModel, oppModel);
            } else if (propWins && !oppWins) {
              recordDebateResult(proposition.model.id, opposition.model.id, false, propModel, oppModel);
            } else if (oppWins && !propWins) {
              recordDebateResult(opposition.model.id, proposition.model.id, false, oppModel, propModel);
            } else {
              // Ambiguous verdict — skip ELO update to avoid incorrect ratings
              console.warn('[ELO] Could not determine a clear winner from the verdict. No ELO update recorded.');
            }
          }
        } catch (eloErr) {
          console.error('[ELO] Failed to record debate result:', eloErr);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('[DebateView] Turn generation failed:', err);
    } finally {
      setIsGenerating(false);
      clearStreamingContent();
    }
  }, [currentDebate, isGenerating, currentStep, totalSteps, apiKeys, settings, setCurrentDebate, setStreamingContent, setStreamingThinking, clearStreamingContent, userQuestions]);

  // Keep keyboard shortcut ref in sync with handleContinue
  handleContinueRef.current = handleContinue;

  // Auto-run: automatically trigger the next turn after the previous one completes
  const autoRunRef = useRef(true);

  // Track agent transitions for visual indicators
  const [agentTransition, setAgentTransition] = useState<{
    from: string | null;
    to: string;
    toRole: DebateRole;
  } | null>(null);

  useEffect(() => {
    if (
      !currentDebate ||
      isGenerating ||
      currentDebate.status === 'completed' ||
      currentDebate.status === 'paused' ||
      currentDebate.status === 'cancelled' ||
      currentStep >= totalSteps ||
      !autoRunRef.current
    ) {
      return;
    }

    // Determine if we're switching agents — use longer delay for agent switches
    const prevStep = currentStep - 1;
    const prevRole = prevStep >= 0 ? getRoleForStep(currentDebate, prevStep) : undefined;
    const nextRole = getRoleForStep(currentDebate, currentStep);
    const nextDebater = getDebaterForStep(currentDebate, currentStep);
    const isAgentSwitch = prevRole !== nextRole;

    // Show agent transition indicator when switching agents
    if (isAgentSwitch && nextDebater && nextRole) {
      const prevDebater = prevStep >= 0 ? getDebaterForStep(currentDebate, prevStep) : undefined;
      setAgentTransition({
        from: prevDebater?.name ?? null,
        to: nextDebater.name,
        toRole: nextRole,
      });
    }

    // Use longer delay when switching between different agents
    const delay = isAgentSwitch ? 2500 : 1000;

    const timer = setTimeout(() => {
      setAgentTransition(null);
      handleContinue();
    }, delay);

    return () => clearTimeout(timer);
  }, [currentDebate?.turns?.length, isGenerating, currentStep, totalSteps, currentDebate?.status, handleContinue]);

  /* ---- Compute info about the currently-generating or next turn ---- */
  const activeDebater = stepInfo?.nextDebater;
  const activeRole: DebateRole = stepInfo?.nextRole ?? 'proposition';
  const activePhase: DebatePhase = stepInfo?.nextPhase ?? 'opening';
  const activeColors = ROLE_COLORS[activeRole];

  /* ---- Button label: show what comes next ---- */
  const getButtonLabel = (): string => {
    if (isGenerating) return 'Generating...';
    if (!activeDebater || currentStep >= totalSteps) return 'Debate Complete';
    const phaseLabel = PHASE_LABELS[activePhase] ?? activePhase;
    return `Continue: ${ROLE_LABELS[activeRole]} — ${phaseLabel}`;
  };

  return (
    <div className="flex h-full">
      {/* Transcript pane */}
      <div className={clsx('flex flex-1 flex-col', showEvidencePanel ? 'w-[60%]' : 'w-full')}>
        {/* Top bar */}
        <div className="flex flex-col border-b border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-0">
          {/* Title row */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="truncate font-semibold text-gray-900 dark:text-gray-100">{currentDebate.topic}</h2>
              <Badge variant="info">{currentDebate.format.name}</Badge>
              <Badge variant={isCompleted ? 'success' : isPaused ? 'warning' : 'info'}>
                {currentDebate.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <VoiceSynthesisControls
                enabled={tts.enabled}
                onToggle={tts.toggle}
                isSpeaking={tts.isSpeaking}
                onPauseResume={tts.pauseResume}
                onStop={tts.stop}
              />
              <Tooltip content={showEvidencePanel ? 'Hide evidence panel' : 'Show evidence panel'}>
                <Button variant="ghost" size="sm" onClick={toggleEvidencePanel}>
                  {showEvidencePanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>
              </Tooltip>

              {!isCompleted && (
                <>
                  <Button variant="ghost" size="sm" onClick={handlePause} icon={isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleStop} icon={<Square className="h-4 w-4" />}>
                    Stop
                  </Button>
                </>
              )}

              {isCompleted && (
                <Button variant="outline" size="sm" onClick={() => { setCurrentView('setup'); }} icon={<RotateCcw className="h-4 w-4" />}>
                  New Debate
                </Button>
              )}
            </div>
          </div>

          {/* Progress row */}
          <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-2 dark:border-surface-dark-2">
            <StepProgressIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              debate={currentDebate}
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
              </span>
              {currentStep < totalSteps && (
                <span className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  ROLE_COLORS[activeRole].badge,
                )}>
                  {getRoleIcon(activeRole, 'h-3 w-3')}
                  {PHASE_LABELS[activePhase] ?? activePhase} Phase
                </span>
              )}
              {currentStep >= totalSteps && (
                <Badge variant="success">Complete</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Live Argument Momentum Graph */}
        {showMomentumGraph && turns.length > 0 && (
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-2 dark:border-surface-dark-3 dark:bg-surface-dark-0/50">
            <MomentumGraph
              points={momentumData}
              totalSteps={totalSteps}
            />
          </div>
        )}

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-auto px-5 py-6 space-y-6">
          {turns.length === 0 && !streamingContent && (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
                    <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">Oxford Union Debate Ready</p>
                <p className="mb-1 text-sm text-gray-400 dark:text-gray-500">
                  10 structured turns: Introduction, Opening, Transition, Rebuttal, Cross-Examination, Closing, Verdict
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Click "Continue" to have the Housemaster introduce the motion.
                </p>
              </div>
            </div>
          )}

          {turns.map((turn, index) => {
            const debater = debaterMap.get(turn.debaterId);
            const role = resolveRole(debater?.position);
            const turnComments = comments.filter((c) => c.afterTurn === index + 1);

            return (
              <React.Fragment key={turn.id}>
                <TurnBubble
                  turn={turn}
                  role={role}
                  stepNumber={index + 1}
                  totalSteps={totalSteps}
                  debater={debater}
                  onCitationClick={handleCitationClick}
                  reactionCounts={reactions[turn.id] ?? {}}
                  onReact={handleReact}
                  ttsEnabled={tts.enabled}
                  voiceAssignment={tts.voiceAssignments[turn.debaterId]}
                />
                {/* Inline user comments that were added after this turn */}
                {turnComments.map((comment, ci) => (
                  <CommentBubble key={`comment-${index}-${ci}`} comment={comment} />
                ))}
              </React.Fragment>
            );
          })}

          {/* Agent Transition Banner — shown when switching between agents */}
          {agentTransition && !isGenerating && (
            <div className="animate-fade-in mx-auto flex max-w-md items-center justify-center gap-3 rounded-full border border-gray-200 bg-white/90 px-5 py-2.5 shadow-sm backdrop-blur dark:border-surface-dark-3 dark:bg-surface-dark-1/90">
              <div className={clsx(
                'h-2 w-2 animate-pulse rounded-full',
                agentTransition.toRole === 'housemaster' ? 'bg-amber-400' :
                agentTransition.toRole === 'proposition' ? 'bg-blue-400' : 'bg-rose-400',
              )} />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {agentTransition.from
                  ? `Switching to ${agentTransition.to}`
                  : `${agentTransition.to} is preparing`
                }
              </span>
              <span className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                ROLE_COLORS[agentTransition.toRole].badge,
              )}>
                {getRoleIcon(agentTransition.toRole, 'h-3 w-3')}
                {ROLE_LABELS[agentTransition.toRole]}
              </span>
            </div>
          )}

          {/* Streaming content — while generating */}
          {isGenerating && (streamingContent || streamingThinking) && activeDebater && (
            <div className={clsx('animate-fade-in', activeRole === 'housemaster' ? '' : 'flex gap-3')}>
              {activeRole === 'housemaster' ? (
                /* Housemaster streaming — centered layout */
                <div className={clsx(
                  'mx-auto max-w-3xl rounded-xl border p-5',
                  'bg-gradient-to-r',
                  activeColors.gradient,
                  activeColors.border,
                )}>
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', activeColors.badge)}>
                      <Crown className="h-3.5 w-3.5" />
                      Housemaster
                    </span>
                    <Badge variant="warning">{PHASE_LABELS[activePhase] ?? activePhase}</Badge>
                    <Badge variant="info">{activeDebater.model?.displayName}</Badge>
                  </div>

                  {streamingThinking && (
                    <ThinkingBlock
                      content={streamingThinking}
                      isStreaming={!streamingContent}
                      color={activeColors.accent}
                      className="mb-2"
                    />
                  )}

                  {streamingContent && (
                    <div className="rounded-lg border border-amber-200/60 bg-white/70 p-4 dark:border-amber-800/40 dark:bg-surface-dark-1/70">
                      <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 dark:prose-invert whitespace-pre-wrap text-center">
                        {streamingContent}
                      </div>
                      <div className="mt-2 flex justify-center">
                        <TypingIndicator color={activeColors.accent} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Proposition/Opposition streaming — side-aligned layout */
                <>
                  {activeRole === 'proposition' && (
                    <Avatar
                      name={activeDebater.name}
                      color={activeDebater.persona?.avatar_color ?? activeColors.accent}
                      size="md"
                      icon={getRoleIcon(activeRole, 'h-5 w-5')}
                    />
                  )}
                  <div className={clsx('flex-1 min-w-0 max-w-[85%]')}>
                    <div className={clsx('mb-1.5 flex items-center gap-2', activeRole === 'opposition' && 'justify-end')}>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{activeDebater.name}</span>
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', activeColors.badge)}>
                        {getRoleIcon(activeRole, 'h-3 w-3')}
                        {ROLE_LABELS[activeRole]}
                      </span>
                      <Badge variant="info">{activeDebater.model?.displayName}</Badge>
                    </div>

                    {streamingThinking && (
                      <ThinkingBlock
                        content={streamingThinking}
                        isStreaming={!streamingContent}
                        color={activeDebater.persona?.avatar_color ?? activeColors.accent}
                        className="mb-2"
                      />
                    )}

                    {streamingContent && (
                      <div className={clsx(
                        'rounded-xl border p-4',
                        activeColors.bg, activeColors.border,
                      )}>
                        <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 dark:prose-invert whitespace-pre-wrap">
                          {streamingContent}
                        </div>
                        <TypingIndicator className="mt-2" color={activeColors.accent} />
                      </div>
                    )}
                  </div>
                  {activeRole === 'opposition' && (
                    <Avatar
                      name={activeDebater.name}
                      color={activeDebater.persona?.avatar_color ?? activeColors.accent}
                      size="md"
                      icon={getRoleIcon(activeRole, 'h-5 w-5')}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Typing indicator when generating but no streaming content yet */}
          {isGenerating && !streamingContent && !streamingThinking && activeDebater && (
            <div className={clsx('animate-fade-in', activeRole === 'housemaster' ? 'flex justify-center' : 'flex gap-3')}>
              {activeRole === 'housemaster' ? (
                <div className="flex flex-col items-center gap-2">
                  <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', activeColors.badge)}>
                    <Crown className="h-3.5 w-3.5" />
                    Housemaster
                  </span>
                  <TypingIndicator
                    name={activeDebater.name}
                    color={activeColors.accent}
                  />
                </div>
              ) : (
                <>
                  {activeRole === 'proposition' && (
                    <Avatar
                      name={activeDebater.name}
                      color={activeDebater.persona?.avatar_color ?? activeColors.accent}
                      size="md"
                      icon={getRoleIcon(activeRole, 'h-5 w-5')}
                    />
                  )}
                  <div className="flex-1">
                    <TypingIndicator
                      name={activeDebater.name}
                      color={activeDebater.persona?.avatar_color ?? activeColors.accent}
                    />
                  </div>
                  {activeRole === 'opposition' && (
                    <Avatar
                      name={activeDebater.name}
                      color={activeDebater.persona?.avatar_color ?? activeColors.accent}
                      size="md"
                      icon={getRoleIcon(activeRole, 'h-5 w-5')}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">Turn generation failed</p>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Debate Highlights — shown after debate completes */}
          {isCompleted && currentDebate && (
            <div className="mx-auto max-w-3xl">
              <HighlightsPanel debate={currentDebate} />
            </div>
          )}

          {/* Scorecard — shown after debate completes */}
          {isCompleted && debateScores.length > 0 && (
            <div className="mx-auto max-w-3xl animate-fade-in">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-surface-dark-3 dark:bg-surface-dark-1">
                <div className="mb-5 flex items-center justify-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm">
                    <Gavel className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Debate Scorecard</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {debateScores.map((score) => {
                    const debater = currentDebate.debaters.find((d) => d.id === score.debaterId);
                    const role = debater?.position === 'proposition' ? 'proposition' : 'opposition';
                    const colors = ROLE_COLORS[role];
                    const categories = [
                      { label: 'Argumentation', value: score.categories.argumentation },
                      { label: 'Evidence', value: score.categories.evidence },
                      { label: 'Rebuttal', value: score.categories.rebuttal },
                      { label: 'Rhetoric', value: score.categories.rhetoric },
                    ];
                    return (
                      <div key={score.debaterId} className={clsx('rounded-xl border p-4', colors.border)}>
                        <div className="mb-3 flex items-center gap-2">
                          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', colors.badge)}>
                            {getRoleIcon(role, 'h-3 w-3')}
                            {score.debaterName}
                          </span>
                          <span className="ml-auto text-lg font-bold text-gray-900 dark:text-gray-100">
                            {score.categories.overall}/10
                          </span>
                        </div>
                        <div className="space-y-2">
                          {categories.map((cat) => (
                            <div key={cat.label} className="flex items-center gap-2">
                              <span className="w-28 text-xs text-gray-500 dark:text-gray-400">{cat.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-surface-dark-3 overflow-hidden">
                                <div
                                  className={clsx(
                                    'h-full rounded-full transition-all duration-500',
                                    role === 'proposition' ? 'bg-blue-400' : 'bg-rose-400',
                                  )}
                                  style={{ width: `${(cat.value / 10) * 100}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                                {cat.value}
                              </span>
                            </div>
                          ))}
                        </div>
                        {score.notes && (
                          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{score.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Winner announcement */}
                {debateScores.length >= 2 && (() => {
                  const sorted = [...debateScores].sort((a, b) => b.categories.overall - a.categories.overall);
                  const margin = sorted[0].categories.overall - sorted[1].categories.overall;
                  const winner = sorted[0];
                  const winnerDebater = currentDebate.debaters.find((d) => d.id === winner.debaterId);
                  const winnerRole = winnerDebater?.position === 'proposition' ? 'proposition' : 'opposition';
                  if (margin > 0) {
                    return (
                      <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 dark:from-amber-950/20 dark:to-yellow-950/10">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {margin > 0.5 ? 'Winner' : 'Narrow Winner'}: {winner.debaterName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (by {margin.toFixed(1)} points)
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 dark:bg-surface-dark-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Draw</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Post-Debate Opinion Poll */}
          {isCompleted && showPostPoll && currentDebate?.userPreOpinion && (
            <div className="mx-auto max-w-2xl animate-fade-in">
              <div className="rounded-2xl border-2 border-forge-400 bg-gradient-to-br from-forge-50 via-white to-blue-50 p-6 shadow-lg dark:border-forge-600 dark:from-forge-950/30 dark:via-surface-dark-1 dark:to-blue-950/20">
                <h3 className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-gray-100">
                  Now that the debate is over...
                </h3>
                <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Do you support this motion?
                </p>
                <div className="mb-3 rounded-lg bg-gray-50 p-3 text-center dark:bg-surface-dark-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentDebate.topic}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['for', 'against', 'undecided'] as OpinionValue[]).map((value) => {
                    const config = {
                      for: { emoji: '\u{1F44D}', label: 'For', active: 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300', idle: 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-600 dark:hover:bg-blue-900/20' },
                      against: { emoji: '\u{1F44E}', label: 'Against', active: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/30 dark:border-rose-500 dark:bg-rose-900/30 dark:text-rose-300', idle: 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300 hover:border-rose-400 hover:bg-rose-50 dark:hover:border-rose-600 dark:hover:bg-rose-900/20' },
                      undecided: { emoji: '\u{1F914}', label: 'Undecided', active: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/30 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300', idle: 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:border-amber-600 dark:hover:bg-amber-900/20' },
                    }[value];
                    return (
                      <button
                        key={value}
                        onClick={() => handlePostOpinionSubmit(value)}
                        className={clsx(
                          'flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all',
                          config.idle,
                        )}
                      >
                        <span className="text-2xl">{config.emoji}</span>
                        <span className="text-sm font-semibold">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                  Your pre-debate position: <span className="font-semibold capitalize">{currentDebate.userPreOpinion}</span>
                </p>
              </div>
            </div>
          )}

          {/* Opinion Shift Result — shown after post-debate vote */}
          {isCompleted && currentDebate?.userPreOpinion && (postOpinion || currentDebate?.userPostOpinion) && !showPostPoll && (
            <div className="mx-auto max-w-2xl animate-fade-in">
              <div className={clsx(
                'rounded-2xl border p-5 shadow-sm',
                currentDebate.userPreOpinion === (postOpinion ?? currentDebate.userPostOpinion)
                  ? 'border-gray-200 bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-2'
                  : 'border-forge-300 bg-gradient-to-r from-forge-50 to-blue-50 dark:border-forge-700 dark:from-forge-950/30 dark:to-blue-950/20',
              )}>
                <div className="text-center">
                  {currentDebate.userPreOpinion === (postOpinion ?? currentDebate.userPostOpinion) ? (
                    <>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Your opinion remained: <span className="capitalize">{currentDebate.userPreOpinion}</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        The debate did not change your position on this motion.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        This debate shifted your position!
                      </p>
                      <div className="mt-2 flex items-center justify-center gap-3">
                        <span className={clsx(
                          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
                          currentDebate.userPreOpinion === 'for' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                          currentDebate.userPreOpinion === 'against' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                        )}>
                          <span className="capitalize">{currentDebate.userPreOpinion}</span>
                        </span>
                        <span className="text-xl text-gray-400 dark:text-gray-500">{'\u2192'}</span>
                        <span className={clsx(
                          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
                          (postOpinion ?? currentDebate.userPostOpinion) === 'for' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                          (postOpinion ?? currentDebate.userPostOpinion) === 'against' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                        )}>
                          <span className="capitalize">{postOpinion ?? currentDebate.userPostOpinion}</span>
                        </span>
                      </div>
                      <div className="mt-3 flex justify-center">
                        <div className="h-1 w-24 rounded-full bg-gradient-to-r from-forge-400 to-blue-400" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar — active debate */}
        {!isCompleted && (
          <div className="border-t border-gray-200 bg-white px-5 py-3 dark:border-surface-dark-3 dark:bg-surface-dark-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                {activeDebater && currentStep < totalSteps && (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">Next:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', activeColors.badge)}>
                        {getRoleIcon(activeRole, 'h-3 w-3')}
                        {ROLE_LABELS[activeRole]}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {activeDebater.name}
                      </span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {PHASE_LABELS[activePhase] ?? activePhase}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="tabular-nums text-gray-400 dark:text-gray-500">
                      Step {currentStep + 1} of {totalSteps}
                    </span>
                  </>
                )}
              </div>
              <Button
                onClick={handleContinue}
                disabled={isGenerating || isPaused || currentStep >= totalSteps}
                icon={isGenerating ? undefined : <ChevronRight className="h-4 w-4" />}
                loading={isGenerating}
              >
                {getButtonLabel()}
              </Button>
            </div>
          </div>
        )}

        {/* Completed bar */}
        {isCompleted && (
          <div className="border-t border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 dark:border-surface-dark-3 dark:from-amber-950/20 dark:to-yellow-950/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gavel className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Debate Complete</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {turns.length} turns completed across {totalSteps} steps
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="Copy transcript to clipboard">
                  <Button variant="ghost" size="sm" onClick={handleCopyTranscript} icon={copiedTranscript ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}>
                    {copiedTranscript ? 'Copied' : 'Copy'}
                  </Button>
                </Tooltip>
                <Tooltip content="Download transcript as Markdown">
                  <Button variant="ghost" size="sm" onClick={handleExportTranscript} icon={<Download className="h-4 w-4" />}>
                    Export
                  </Button>
                </Tooltip>
                {currentDebate && <ShareCardButtons debate={currentDebate} />}
                <Button variant="outline" size="sm" onClick={() => { setCurrentView('setup'); }} icon={<RotateCcw className="h-4 w-4" />}>
                  New Debate
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Panel */}
      {showEvidencePanel && (
        <div className="w-[40%] border-l border-gray-200 dark:border-surface-dark-3">
          <EvidencePanel />
        </div>
      )}
    </div>
  );
};

export default DebateView;
