import React, { useState, useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import {
  ArrowLeft, Share2, Download, Copy, Trash2,
  Calendar, Clock, MessageSquare, Users, Trophy,
  BarChart3, FileText, StickyNote, AlertTriangle,
  ChevronRight, BookOpen, Swords, Tag, ExternalLink,
  CheckCircle, XCircle, Save, Shield, Zap, Target,
  Brain, Eye,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Tabs } from '../components/Tabs';
import { Tooltip } from '../components/Tooltip';
import type {
  Debate, DebateFormat, DebateStatus, DebateTurn,
  DebateScore, DetectedFallacy,
} from '../../types';

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                                */
/* ------------------------------------------------------------------ */

const FORMAT_LABELS: Record<DebateFormat, string> = {
  'oxford-union': 'Oxford Union',
  'lincoln-douglas': 'Lincoln-Douglas',
  'parliamentary': 'Parliamentary',
};

const STATUS_CONFIG: Record<
  DebateStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }
> = {
  setup: { label: 'Setup', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'info' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

function getRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getAvatarColor(id: string): string {
  const colors = [
    'bg-blue-500', 'bg-rose-500', 'bg-emerald-500',
    'bg-purple-500', 'bg-amber-500', 'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ------------------------------------------------------------------ */
/*  Tab: Overview                                                     */
/* ------------------------------------------------------------------ */

interface OverviewTabProps {
  debate: Debate;
}

const ScoreRadar: React.FC<{ label: string; scores: Record<string, number>; color: string }> = ({
  label,
  scores,
  color,
}) => {
  const categories = Object.entries(scores);
  const maxScore = 10;

  return (
    <Card className="flex-1">
      <h4 className={clsx('mb-3 text-sm font-bold', color)}>{label}</h4>
      <div className="space-y-2">
        {categories.map(([cat, score]) => (
          <div key={cat}>
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-xs capitalize text-gray-600 dark:text-gray-400">{cat}</span>
              <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                {score}/{maxScore}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
              <div
                className={clsx('h-full rounded-full transition-all duration-700', color === 'text-blue-600 dark:text-blue-400' ? 'bg-blue-500' : 'bg-rose-500')}
                style={{ width: `${(score / maxScore) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const OverviewTab: React.FC<OverviewTabProps> = ({ debate }) => {
  const debaterStats = useMemo(() => {
    return debate.debaters
      .filter((d) => d.position !== 'housemaster')
      .map((d) => {
        const turns = debate.turns.filter((t) => t.debaterId === d.id);
        const wordCount = turns.reduce((sum, t) => sum + countWords(t.content), 0);
        const score = debate.scores?.find((s) => s.debaterId === d.id);
        return { debater: d, turns: turns.length, wordCount, score };
      });
  }, [debate]);

  const totalDuration = useMemo(() => {
    if (!debate.startedAt) return 'N/A';
    const end = debate.completedAt ?? debate.updatedAt;
    const diff = new Date(end).getTime() - new Date(debate.startedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, [debate]);

  return (
    <div className="space-y-6">
      {/* Score cards */}
      {debate.scores && debate.scores.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row">
          {debaterStats.map((ds, idx) =>
            ds.score ? (
              <ScoreRadar
                key={ds.debater.id}
                label={ds.debater.name}
                scores={ds.score.categories}
                color={idx === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}
              />
            ) : null,
          )}
        </div>
      )}

      {/* Verdict */}
      {debate.scores && debate.scores.length > 0 && (
        <Card variant="gradient">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Final Verdict</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {debate.scores
              .filter((s) => s.notes)
              .map((s) => s.notes)
              .join(' ')}
          </p>
        </Card>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <div className="text-center">
            <MessageSquare className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {debate.turns.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Turns</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalDuration}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
          </div>
        </Card>
        {debaterStats.map((ds) => (
          <Card key={ds.debater.id}>
            <div className="text-center">
              <FileText className="mx-auto mb-1 h-5 w-5 text-gray-400" />
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {ds.wordCount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {ds.debater.name} words
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab: Transcript                                                   */
/* ------------------------------------------------------------------ */

interface TranscriptTabProps {
  debate: Debate;
}

const TurnCard: React.FC<{ turn: DebateTurn; debaterName: string; position: string }> = ({
  turn,
  debaterName,
  position,
}) => {
  const isProposition = position === 'proposition';
  const isHousemaster = position === 'housemaster';

  return (
    <div
      className={clsx(
        'flex gap-3',
        isProposition ? 'flex-row' : 'flex-row-reverse',
        isHousemaster && 'flex-row justify-center',
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
          getAvatarColor(turn.debaterId),
        )}
        title={debaterName}
      >
        {debaterName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl px-4 py-3',
          isHousemaster
            ? 'max-w-[85%] border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            : isProposition
              ? 'rounded-bl-sm border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              : 'rounded-br-sm border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20',
        )}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {debaterName}
          </span>
          <Badge size="sm">{turn.phase}</Badge>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {getRelativeTime(turn.timestamp)}
          </span>
        </div>

        <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {turn.content}
        </p>

        {/* Inline fallacy highlights */}
        {turn.fallacies && turn.fallacies.length > 0 && (
          <div className="mt-2 space-y-1">
            {turn.fallacies.map((f, idx) => (
              <div
                key={idx}
                className={clsx(
                  'flex items-start gap-1.5 rounded-lg px-2 py-1 text-xs',
                  f.severity === 'high'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : f.severity === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                )}
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  <strong>{f.name}:</strong> {f.description}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Inline citations */}
        {turn.citations && turn.citations.length > 0 && (
          <div className="mt-2 space-y-1">
            {turn.citations.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-surface-dark-3 dark:text-gray-400"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate font-medium">{c.title || c.url}</span>
                {c.verified && <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TranscriptTab: React.FC<TranscriptTabProps> = ({ debate }) => {
  const debaterMap = useMemo(() => {
    const map: Record<string, { name: string; position: string }> = {};
    for (const d of debate.debaters) {
      map[d.id] = { name: d.name, position: d.position };
    }
    return map;
  }, [debate.debaters]);

  if (debate.turns.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <MessageSquare className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No turns recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debate.turns.map((turn) => {
        const info = debaterMap[turn.debaterId] ?? {
          name: turn.debaterName,
          position: 'proposition',
        };
        return (
          <TurnCard
            key={turn.id}
            turn={turn}
            debaterName={info.name}
            position={info.position}
          />
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab: Analysis                                                     */
/* ------------------------------------------------------------------ */

interface AnalysisTabProps {
  debate: Debate;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ debate }) => {
  // Fallacy breakdown
  const fallacyBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const turn of debate.turns) {
      if (turn.fallacies) {
        for (const f of turn.fallacies) {
          counts[f.name] = (counts[f.name] ?? 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [debate.turns]);

  const maxFallacy = fallacyBreakdown.length > 0 ? fallacyBreakdown[0][1] : 1;

  // Evidence quality summary
  const evidenceStats = useMemo(() => {
    let total = 0;
    let verified = 0;
    const types: Record<string, number> = {};
    for (const turn of debate.turns) {
      for (const c of turn.citations) {
        total++;
        if (c.verified) verified++;
        const t = c.sourceType ?? 'unknown';
        types[t] = (types[t] ?? 0) + 1;
      }
    }
    return { total, verified, types };
  }, [debate.turns]);

  // Argument strength comparison per debater
  const strengthComparison = useMemo(() => {
    return debate.debaters
      .filter((d) => d.position !== 'housemaster')
      .map((d) => {
        const score = debate.scores?.find((s) => s.debaterId === d.id);
        const overall = score ? score.categories.overall : 0;
        return { name: d.name, overall, position: d.position };
      });
  }, [debate]);

  return (
    <div className="space-y-6">
      {/* Momentum placeholder */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-forge-500" />
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Debate Momentum</h4>
        </div>
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Momentum graph visualization coming soon
          </p>
        </div>
      </Card>

      {/* Fallacy breakdown */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Fallacy Breakdown
          </h4>
        </div>
        {fallacyBreakdown.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No fallacies detected in this debate.
          </p>
        ) : (
          <div className="space-y-2">
            {fallacyBreakdown.map(([name, count]) => (
              <div key={name}>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
                  <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                    {count}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(count / maxFallacy) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Evidence quality */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-emerald-500" />
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Evidence Quality Summary
          </h4>
        </div>
        {evidenceStats.total === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No citations found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-surface-dark-2">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {evidenceStats.total}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Citations</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-surface-dark-2">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {evidenceStats.verified}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
            </div>
            {Object.entries(evidenceStats.types).map(([type, count]) => (
              <div
                key={type}
                className="rounded-lg bg-gray-50 p-3 text-center dark:bg-surface-dark-2"
              >
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{count}</p>
                <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
                  {type.replace(/-/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Argument strength comparison */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-purple-500" />
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Argument Strength Comparison
          </h4>
        </div>
        {strengthComparison.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No scores available.</p>
        ) : (
          <div className="space-y-3">
            {strengthComparison.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {s.name}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                    {s.overall}/10
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-700',
                      s.position === 'proposition' ? 'bg-blue-500' : 'bg-rose-500',
                    )}
                    style={{ width: `${(s.overall / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab: Notes                                                        */
/* ------------------------------------------------------------------ */

interface NotesTabProps {
  debateId: string;
}

const NOTES_STORAGE_KEY = 'debateforge-debate-notes-';

const NotesTab: React.FC<NotesTabProps> = ({ debateId }) => {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY + debateId);
      if (stored) setNotes(stored);
    } catch {
      // ignore
    }
  }, [debateId]);

  // Auto-save
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNotes(val);
      setSaved(false);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(NOTES_STORAGE_KEY + debateId, val);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch {
          // storage full
        }
      }, 800);
    },
    [debateId],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="debate-notes"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Your Notes
        </label>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in">
            <Save className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>
      <textarea
        id="debate-notes"
        value={notes}
        onChange={handleChange}
        placeholder="Write your thoughts, observations, or takeaways from this debate..."
        className={clsx(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors',
          'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forge-500/30 focus:border-forge-500',
          'dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder:text-gray-500',
          'border-gray-300 dark:border-surface-dark-4',
          'resize-y min-h-[200px]',
        )}
      />
      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
        Notes are auto-saved to your browser&apos;s local storage.
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Related Debates                                                   */
/* ------------------------------------------------------------------ */

const RelatedDebates: React.FC<{ currentId: string; topic: string }> = ({ currentId, topic }) => {
  const debates = useStore((s) => s.debates);
  const setCurrentView = useStore((s) => s.setCurrentView);

  const related = useMemo(() => {
    const keywords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    return debates
      .filter((d) => d.id !== currentId)
      .map((d) => {
        const score = keywords.filter((kw) => d.topic.toLowerCase().includes(kw)).length;
        return { debate: d, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r) => r.debate);
  }, [debates, currentId, topic]);

  if (related.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">
        More debates on similar topics
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {related.map((d) => {
          const sc = STATUS_CONFIG[d.status];
          return (
            <Card key={d.id} hover onClick={() => setCurrentView('home')}>
              <Badge variant={sc.variant} size="sm">
                {sc.label}
              </Badge>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {d.topic}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {getRelativeTime(d.createdAt)}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main DebateDetailView                                             */
/* ------------------------------------------------------------------ */

const DebateDetailView: React.FC<{ debateId?: string }> = ({ debateId }) => {
  const debates = useStore((s) => s.debates);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const deleteDebate = useStore((s) => s.deleteDebate);
  const [activeTab, setActiveTab] = useState('overview');

  const debate = useMemo(
    () => debates.find((d) => d.id === debateId) ?? debates[0] ?? null,
    [debates, debateId],
  );

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
      { id: 'transcript', label: 'Transcript', icon: <MessageSquare className="h-4 w-4" /> },
      { id: 'analysis', label: 'Analysis', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'notes', label: 'Notes', icon: <StickyNote className="h-4 w-4" /> },
    ],
    [],
  );

  const handleDelete = useCallback(() => {
    if (debate) {
      deleteDebate(debate.id);
      setCurrentView('home');
    }
  }, [debate, deleteDebate, setCurrentView]);

  if (!debate) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="text-center">
          <Swords className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No debate selected.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setCurrentView('home')}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[debate.status];
  const formatLabel = FORMAT_LABELS[debate.format.id] ?? debate.format.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => setCurrentView('home')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to debates
      </button>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              <Badge>{formatLabel}</Badge>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {getRelativeTime(debate.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {debate.topic}
            </h1>
          </div>

          {/* Action bar */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Tooltip content="Share">
              <Button variant="ghost" size="sm" icon={<Share2 className="h-4 w-4" />}>
                Share
              </Button>
            </Tooltip>
            <Tooltip content="Export">
              <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
                Export
              </Button>
            </Tooltip>
            <Tooltip content="Duplicate">
              <Button variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />}>
                Duplicate
              </Button>
            </Tooltip>
            <Tooltip content="Delete">
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Tooltip>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

          {/* Tab content */}
          <div>
            {activeTab === 'overview' && <OverviewTab debate={debate} />}
            {activeTab === 'transcript' && <TranscriptTab debate={debate} />}
            {activeTab === 'analysis' && <AnalysisTab debate={debate} />}
            {activeTab === 'notes' && <NotesTab debateId={debate.id} />}
          </div>

          {/* Related debates */}
          <RelatedDebates currentId={debate.id} topic={debate.topic} />
        </div>

        {/* Sidebar metadata */}
        <aside className="w-full shrink-0 lg:w-72">
          <Card>
            <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Created
                </dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {formatFullDate(debate.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Format
                </dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Debaters
                </dt>
                <dd className="space-y-2 mt-1">
                  {debate.debaters.map((d) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <div
                        className={clsx(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                          getAvatarColor(d.id),
                        )}
                      >
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {d.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {d.model.displayName} &middot; {d.persona.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </dd>
              </div>
              {debate.language && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Language
                  </dt>
                  <dd className="text-gray-700 dark:text-gray-300">{debate.language}</dd>
                </div>
              )}
            </dl>
          </Card>
        </aside>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default DebateDetailView;
