import React, { useState, useMemo, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import {
  Trophy, Plus, Swords, Crown, ChevronRight,
  Users, Target, Zap, Star, Clock, ArrowRight,
  Play, Trash2, RotateCcw, RefreshCw, Cpu,
  Download, Check, Hash,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';

/* ------- Types ------- */

interface TournamentParticipant {
  id: string;
  name: string;
  modelId: string;
  modelDisplayName: string;
  provider: string;
  personaName: string;
  color: string;
  wins: number;
  losses: number;
}

interface BracketMatch {
  id: string;
  round: number;
  position: number;
  participant1: TournamentParticipant | null;
  participant2: TournamentParticipant | null;
  winner: TournamentParticipant | null;
  status: 'pending' | 'in-progress' | 'completed';
  topic?: string;
}

interface Tournament {
  id: string;
  name: string;
  topic: string;
  bracketType: 'single-elimination' | 'round-robin';
  participants: TournamentParticipant[];
  matches: BracketMatch[];
  status: 'setup' | 'in-progress' | 'completed';
  champion: TournamentParticipant | null;
  createdAt: string;
}

/* ------- Persistence ------- */
const TOURNAMENTS_KEY = 'debateforge-tournaments';

function loadTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(TOURNAMENTS_KEY);
    if (raw) return JSON.parse(raw) as Tournament[];
  } catch { /* ignore */ }
  return [];
}

function persistTournaments(tournaments: Tournament[]): void {
  try {
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
  } catch { /* ignore */ }
}

/* ------- Bracket generation ------- */

function generateSingleEliminationBracket(
  participants: TournamentParticipant[],
): BracketMatch[] {
  const matches: BracketMatch[] = [];

  // Pad to nearest power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(participants.length, 2))));
  const padded = [...participants];
  while (padded.length < size) padded.push(null as any);

  // Shuffle participants
  const shuffled = [...padded].sort(() => Math.random() - 0.5);

  // Calculate number of rounds
  const numRounds = Math.ceil(Math.log2(size));

  // Round 1: pair up participants
  const firstRoundMatchCount = size / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const p1 = shuffled[i * 2] ?? null;
    const p2 = shuffled[i * 2 + 1] ?? null;

    // If one slot is a bye (null), auto-advance
    const isBye = !p1 || !p2;
    const winner = isBye ? (p1 ?? p2) : null;

    matches.push({
      id: `r1-${i}`,
      round: 1,
      position: i,
      participant1: p1,
      participant2: p2,
      winner,
      status: isBye ? 'completed' : 'pending',
    });
  }

  // Subsequent rounds
  for (let round = 2; round <= numRounds; round++) {
    const prevRoundMatchCount = Math.pow(2, numRounds - round + 1) / 2;
    const thisRoundMatchCount = prevRoundMatchCount / 2;
    for (let i = 0; i < thisRoundMatchCount; i++) {
      matches.push({
        id: `r${round}-${i}`,
        round,
        position: i,
        participant1: null,
        participant2: null,
        winner: null,
        status: 'pending',
      });
    }
  }

  // Propagate byes
  propagateWinners(matches, numRounds);

  return matches;
}

function propagateWinners(matches: BracketMatch[], numRounds: number): void {
  for (let round = 1; round < numRounds; round++) {
    const roundMatches = matches.filter((m) => m.round === round);
    const nextRoundMatches = matches.filter((m) => m.round === round + 1);

    for (let i = 0; i < roundMatches.length; i++) {
      const match = roundMatches[i];
      if (match.winner) {
        const nextMatchIdx = Math.floor(i / 2);
        const nextMatch = nextRoundMatches[nextMatchIdx];
        if (nextMatch) {
          if (i % 2 === 0) {
            nextMatch.participant1 = match.winner;
          } else {
            nextMatch.participant2 = match.winner;
          }
          // If both slots filled with one being null (bye), auto-advance
          if (nextMatch.participant1 && !nextMatch.participant2) {
            // Wait for the other match
          } else if (!nextMatch.participant1 && nextMatch.participant2) {
            // Wait for the other match
          }
        }
      }
    }
  }
}

function generateRoundRobinBracket(
  participants: TournamentParticipant[],
): BracketMatch[] {
  const matches: BracketMatch[] = [];
  let matchNum = 0;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: `rr-${matchNum}`,
        round: 1,
        position: matchNum,
        participant1: participants[i],
        participant2: participants[j],
        winner: null,
        status: 'pending',
      });
      matchNum++;
    }
  }

  return matches;
}

/* ------- Available models (cloud) ------- */
interface TournamentModel {
  id: string;
  name: string;
  provider: string;
  color: string;
  isLocal: boolean;
}

const CLOUD_MODELS: TournamentModel[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic', color: '#D97706', isLocal: false },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10B981', isLocal: false },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', color: '#3B82F6', isLocal: false },
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral', color: '#F97316', isLocal: false },
  { id: 'llama3-groq-70b-8192-tool-use-preview', name: 'Llama 3 70B', provider: 'Groq', color: '#8B5CF6', isLocal: false },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#EF4444', isLocal: false },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', color: '#06B6D4', isLocal: false },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'Anthropic', color: '#7C3AED', isLocal: false },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', color: '#2563EB', isLocal: false },
  { id: 'claude-haiku-4-5-20250514', name: 'Claude Haiku 4.5', provider: 'Anthropic', color: '#F59E0B', isLocal: false },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', color: '#34D399', isLocal: false },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', color: '#60A5FA', isLocal: false },
  { id: 'llama-3.3-70b-groq', name: 'Llama 3.3 70B (Groq)', provider: 'Groq', color: '#A78BFA', isLocal: false },
];

/* ------- Provider colors for pills ------- */
const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  Anthropic: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  OpenAI: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  Google: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  Mistral: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  Groq: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  Ollama: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'LM Studio': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
};

/* ------- Tournament templates ------- */
interface TournamentTemplate {
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  modelIds: string[];
}

const TOURNAMENT_TEMPLATES: TournamentTemplate[] = [
  {
    name: 'The Big Four',
    description: 'Claude Opus 4, GPT-4o, Gemini 2.5 Pro, Mistral Large',
    icon: Crown,
    modelIds: ['claude-opus-4-20250514', 'gpt-4o', 'gemini-2.5-pro', 'mistral-large-latest'],
  },
  {
    name: 'Speed Demons',
    description: 'Claude Haiku 4.5, GPT-4o Mini, Gemini 2.5 Flash, Llama 3.3 70B (Groq)',
    icon: Zap,
    modelIds: ['claude-haiku-4-5-20250514', 'gpt-4o-mini', 'gemini-2.5-flash', 'llama-3.3-70b-groq'],
  },
  {
    name: 'All Stars',
    description: '8 top models from all providers in a grand showdown',
    icon: Star,
    modelIds: [
      'claude-opus-4-20250514', 'claude-sonnet-4-20250514',
      'gpt-4o', 'gpt-4-turbo',
      'gemini-2.5-pro', 'gemini-2.5-flash',
      'mistral-large-latest', 'llama3-groq-70b-8192-tool-use-preview',
    ],
  },
];

/* Random color for local models */
const LOCAL_COLORS = ['#059669', '#7C3AED', '#DC2626', '#0891B2', '#CA8A04', '#BE185D', '#4F46E5', '#15803D'];

/* ------- Match Card ------- */

/* ------- Provider pill helper ------- */
const ProviderPill: React.FC<{ provider: string }> = ({ provider }) => {
  const colors = PROVIDER_COLORS[provider] ?? { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
  return (
    <span className={clsx('inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium leading-none', colors.bg, colors.text)}>
      {provider}
    </span>
  );
};

const MatchCard: React.FC<{
  match: BracketMatch;
  matchNumber?: number;
  compact?: boolean;
  onSetWinner?: (matchId: string, winner: TournamentParticipant) => void;
}> = ({ match, matchNumber, compact, onSetWinner }) => {
  const statusColors: Record<string, string> = {
    pending: 'border-gray-200 dark:border-surface-dark-3',
    'in-progress': 'border-forge-400 dark:border-forge-600 ring-2 ring-forge-500/20',
    completed: 'border-emerald-300 dark:border-emerald-700',
  };

  return (
    <div className={clsx(
      'rounded-xl border bg-white p-3 transition-all dark:bg-surface-dark-1',
      statusColors[match.status],
      compact ? 'min-w-[180px]' : 'min-w-[240px]',
    )}>
      {/* Match number header */}
      {matchNumber != null && (
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <Hash className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Match {matchNumber}
          </span>
        </div>
      )}

      {/* Slot 1 */}
      <button
        disabled={match.status === 'completed' || !match.participant1 || !onSetWinner}
        onClick={() => match.participant1 && onSetWinner?.(match.id, match.participant1)}
        className={clsx(
          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors text-left',
          match.winner?.id === match.participant1?.id && 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800',
          match.status !== 'completed' && match.participant1 && onSetWinner && 'hover:bg-gray-50 dark:hover:bg-surface-dark-2 cursor-pointer',
        )}
      >
        {match.participant1 ? (
          <>
            <Avatar name={match.participant1.name} color={match.participant1.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{match.participant1.name}</p>
              <ProviderPill provider={match.participant1.provider} />
            </div>
            {match.winner?.id === match.participant1.id && (
              <div className="flex items-center gap-1 shrink-0">
                <Check className="h-4 w-4 text-emerald-500" />
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">TBD</p>
        )}
      </button>

      {/* Divider */}
      <div className="my-1 flex items-center gap-2 px-2">
        <div className="flex-1 h-px bg-gray-200 dark:bg-surface-dark-3" />
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">VS</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-surface-dark-3" />
      </div>

      {/* Slot 2 */}
      <button
        disabled={match.status === 'completed' || !match.participant2 || !onSetWinner}
        onClick={() => match.participant2 && onSetWinner?.(match.id, match.participant2)}
        className={clsx(
          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors text-left',
          match.winner?.id === match.participant2?.id && 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800',
          match.status !== 'completed' && match.participant2 && onSetWinner && 'hover:bg-gray-50 dark:hover:bg-surface-dark-2 cursor-pointer',
        )}
      >
        {match.participant2 ? (
          <>
            <Avatar name={match.participant2.name} color={match.participant2.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{match.participant2.name}</p>
              <ProviderPill provider={match.participant2.provider} />
            </div>
            {match.winner?.id === match.participant2.id && (
              <div className="flex items-center gap-1 shrink-0">
                <Check className="h-4 w-4 text-emerald-500" />
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">TBD</p>
        )}
      </button>

      {/* Status */}
      <div className="mt-2 flex justify-center">
        <Badge
          variant={match.status === 'completed' ? 'success' : match.status === 'in-progress' ? 'info' : 'default'}
          size="sm"
        >
          {match.status === 'completed' ? 'Completed' : match.status === 'in-progress' ? 'In Progress' : 'Pending'}
        </Badge>
      </div>
    </div>
  );
};

/* ------- Main component ------- */

const TournamentView: React.FC = () => {
  const setCurrentView = useStore((s) => s.setCurrentView);
  const settings = useStore((s) => s.settings);
  const [tournaments, setTournaments] = useState<Tournament[]>(loadTournaments);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(
    () => tournaments.find((t) => t.status !== 'completed')?.id ?? tournaments[0]?.id ?? null,
  );
  const [showCreateUI, setShowCreateUI] = useState(false);
  const [topic, setTopic] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [bracketType, setBracketType] = useState<'single-elimination' | 'round-robin'>('single-elimination');

  // ── Local model discovery ──
  const [localModels, setLocalModels] = useState<TournamentModel[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const fetchLocalModels = useCallback(async () => {
    setLoadingLocal(true);
    const discovered: TournamentModel[] = [];
    let colorIdx = 0;

    // Ollama
    try {
      const endpoint = (settings as any).localModelEndpoint ?? 'http://localhost:11434';
      const resp = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const data = await resp.json();
        for (const m of (data.models ?? [])) {
          const name = m.name ?? m.model ?? 'unknown';
          discovered.push({
            id: `ollama-${name}`,
            name: `${name}`,
            provider: 'Ollama',
            color: LOCAL_COLORS[colorIdx++ % LOCAL_COLORS.length],
            isLocal: true,
          });
        }
      }
    } catch {
      // Ollama not running
    }

    // LM Studio
    try {
      const endpoint = (settings as any).lmStudioEndpoint ?? 'http://localhost:1234/v1';
      const resp = await fetch(`${endpoint}/models`, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const data = await resp.json();
        for (const m of (data.data ?? [])) {
          const name = m.id ?? 'unknown';
          discovered.push({
            id: `lmstudio-${name}`,
            name: `${name}`,
            provider: 'LM Studio',
            color: LOCAL_COLORS[colorIdx++ % LOCAL_COLORS.length],
            isLocal: true,
          });
        }
      }
    } catch {
      // LM Studio not running
    }

    setLocalModels(discovered);
    setLoadingLocal(false);
  }, [settings]);

  // Scan on mount
  useEffect(() => { fetchLocalModels(); }, [fetchLocalModels]);

  // Merge cloud + local models
  const AVAILABLE_MODELS = useMemo(() => [...CLOUD_MODELS, ...localModels], [localModels]);

  const [selectedModels, setSelectedModels] = useState<string[]>([
    CLOUD_MODELS[0].id,
    CLOUD_MODELS[1].id,
    CLOUD_MODELS[2].id,
    CLOUD_MODELS[3].id,
  ]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const activeTournament = useMemo(
    () => tournaments.find((t) => t.id === activeTournamentId) ?? null,
    [tournaments, activeTournamentId],
  );

  const updateTournament = useCallback((updated: Tournament) => {
    setTournaments((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      persistTournaments(next);
      return next;
    });
  }, []);

  const handleCreateTournament = useCallback(() => {
    if (!topic.trim() || selectedModels.length < 2) return;

    const participants: TournamentParticipant[] = selectedModels.map((modelId) => {
      const model = AVAILABLE_MODELS.find((m) => m.id === modelId) ?? AVAILABLE_MODELS[0];
      return {
        id: uuidv4(),
        name: model.name,
        modelId: model.id,
        modelDisplayName: model.name,
        provider: model.provider,
        personaName: 'Default',
        color: model.color,
        wins: 0,
        losses: 0,
      };
    });

    const matches = bracketType === 'single-elimination'
      ? generateSingleEliminationBracket(participants)
      : generateRoundRobinBracket(participants);

    const tournament: Tournament = {
      id: uuidv4(),
      name: tournamentName.trim() || `Tournament: ${topic.slice(0, 50)}`,
      topic,
      bracketType,
      participants,
      matches,
      status: 'in-progress',
      champion: null,
      createdAt: new Date().toISOString(),
    };

    setTournaments((prev) => {
      const next = [tournament, ...prev];
      persistTournaments(next);
      return next;
    });
    setActiveTournamentId(tournament.id);
    setShowCreateUI(false);
    setTopic('');
    setTournamentName('');
  }, [topic, tournamentName, bracketType, selectedModels, AVAILABLE_MODELS]);

  const handleSetWinner = useCallback((matchId: string, winner: TournamentParticipant) => {
    if (!activeTournament) return;

    const updatedMatches = activeTournament.matches.map((m) => {
      if (m.id === matchId) {
        return { ...m, winner, status: 'completed' as const };
      }
      return m;
    });

    // Update participant records
    const match = updatedMatches.find((m) => m.id === matchId)!;
    const loser = match.participant1?.id === winner.id ? match.participant2 : match.participant1;
    const updatedParticipants = activeTournament.participants.map((p) => {
      if (p.id === winner.id) return { ...p, wins: p.wins + 1 };
      if (p.id === loser?.id) return { ...p, losses: p.losses + 1 };
      return p;
    });

    // For single-elimination, advance winner to next round
    if (activeTournament.bracketType === 'single-elimination') {
      const matchObj = activeTournament.matches.find((m) => m.id === matchId)!;
      const nextRound = matchObj.round + 1;
      const nextPosition = Math.floor(matchObj.position / 2);
      const nextMatch = updatedMatches.find(
        (m) => m.round === nextRound && m.position === nextPosition,
      );
      if (nextMatch) {
        if (matchObj.position % 2 === 0) {
          nextMatch.participant1 = winner;
        } else {
          nextMatch.participant2 = winner;
        }
      }
    }

    // Check if tournament is complete
    const allDone = updatedMatches.every((m) => m.status === 'completed');
    let champion: TournamentParticipant | null = null;
    let status = activeTournament.status;

    if (allDone) {
      status = 'completed';
      if (activeTournament.bracketType === 'single-elimination') {
        const finalMatch = updatedMatches.find(
          (m) => m.round === Math.max(...updatedMatches.map((x) => x.round)),
        );
        champion = finalMatch?.winner ?? null;
      } else {
        // Round robin: most wins
        const sorted = [...updatedParticipants].sort((a, b) => b.wins - a.wins);
        champion = sorted[0] ?? null;
      }
    }

    updateTournament({
      ...activeTournament,
      matches: updatedMatches,
      participants: updatedParticipants,
      status,
      champion,
    });
  }, [activeTournament, updateTournament]);

  const handleDeleteTournament = useCallback(() => {
    if (!activeTournamentId) return;
    setTournaments((prev) => {
      const next = prev.filter((t) => t.id !== activeTournamentId);
      persistTournaments(next);
      return next;
    });
    setActiveTournamentId(null);
    setShowDeleteModal(false);
  }, [activeTournamentId]);

  const handleResetTournament = useCallback(() => {
    if (!activeTournament) return;
    const matches = activeTournament.bracketType === 'single-elimination'
      ? generateSingleEliminationBracket(activeTournament.participants.map((p) => ({ ...p, wins: 0, losses: 0 })))
      : generateRoundRobinBracket(activeTournament.participants.map((p) => ({ ...p, wins: 0, losses: 0 })));

    updateTournament({
      ...activeTournament,
      matches,
      participants: activeTournament.participants.map((p) => ({ ...p, wins: 0, losses: 0 })),
      status: 'in-progress',
      champion: null,
    });
  }, [activeTournament, updateTournament]);

  const toggleModelSelection = useCallback((modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId],
    );
  }, []);

  const handleApplyTemplate = useCallback((template: TournamentTemplate) => {
    setSelectedModels(template.modelIds);
  }, []);

  const handleExportResults = useCallback(() => {
    if (!activeTournament) return;
    const exportData = {
      name: activeTournament.name,
      topic: activeTournament.topic,
      bracketType: activeTournament.bracketType,
      status: activeTournament.status,
      champion: activeTournament.champion ? {
        name: activeTournament.champion.name,
        provider: activeTournament.champion.provider,
        modelId: activeTournament.champion.modelId,
      } : null,
      participants: activeTournament.participants.map((p) => ({
        name: p.name,
        provider: p.provider,
        modelId: p.modelId,
        wins: p.wins,
        losses: p.losses,
      })),
      matches: activeTournament.matches.map((m) => ({
        id: m.id,
        round: m.round,
        position: m.position,
        participant1: m.participant1?.name ?? null,
        participant2: m.participant2?.name ?? null,
        winner: m.winner?.name ?? null,
        status: m.status,
      })),
      createdAt: activeTournament.createdAt,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-${activeTournament.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeTournament]);

  // Group matches by round for display
  const rounds = useMemo(() => {
    if (!activeTournament) return [];
    const matches = activeTournament.matches;
    const maxRound = Math.max(...matches.map((m) => m.round), 0);
    const grouped: BracketMatch[][] = [];
    for (let r = 1; r <= maxRound; r++) {
      grouped.push(matches.filter((m) => m.round === r));
    }
    return grouped;
  }, [activeTournament]);

  const getRoundLabel = (roundIdx: number, totalRounds: number): string => {
    if (activeTournament?.bracketType === 'round-robin') return 'All Matches';
    if (totalRounds === 1) return 'Finals';
    if (roundIdx === totalRounds - 1) return 'Finals';
    if (roundIdx === totalRounds - 2) return 'Semifinals';
    if (roundIdx === totalRounds - 3) return 'Quarterfinals';
    return `Round ${roundIdx + 1}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tournament Mode</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Organize multi-round debate tournaments. Click a participant to declare them the winner.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateUI(!showCreateUI)}
          icon={<Plus className="h-4 w-4" />}
        >
          New Tournament
        </Button>
      </div>

      {/* Create Tournament Panel */}
      {showCreateUI && (
        <Card className="mb-8 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">New Tournament</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Tournament Name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="Optional name..."
            />
            <Input
              label="Debate Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter the debate topic..."
            />
            <Select
              label="Bracket Format"
              options={[
                { value: 'single-elimination', label: 'Single Elimination' },
                { value: 'round-robin', label: 'Round Robin' },
              ]}
              value={bracketType}
              onChange={(e) => setBracketType(e.target.value as any)}
            />
          </div>

          {/* Tournament Templates */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Quick Start Templates</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TOURNAMENT_TEMPLATES.map((template) => {
                const TemplateIcon = template.icon;
                const isActive = template.modelIds.every((id) => selectedModels.includes(id)) && selectedModels.length === template.modelIds.length;
                return (
                  <button
                    key={template.name}
                    onClick={() => handleApplyTemplate(template)}
                    className={clsx(
                      'flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                      isActive
                        ? 'border-forge-500 bg-forge-50 ring-1 ring-forge-500/30 dark:border-forge-500 dark:bg-forge-900/20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-surface-dark-4 dark:hover:border-surface-dark-3 dark:hover:bg-surface-dark-2',
                    )}
                  >
                    <div className={clsx(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      isActive ? 'bg-forge-100 dark:bg-forge-900/40' : 'bg-gray-100 dark:bg-surface-dark-3',
                    )}>
                      <TemplateIcon className={clsx('h-4 w-4', isActive ? 'text-forge-600 dark:text-forge-400' : 'text-gray-500 dark:text-gray-400')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-sm font-semibold', isActive ? 'text-forge-700 dark:text-forge-300' : 'text-gray-900 dark:text-gray-100')}>
                        {template.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{template.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Participants ({selectedModels.length} selected, min 2)
              </p>
              <div className="flex items-center gap-2">
                {localModels.length > 0 && (
                  <Badge variant="success">{localModels.length} local model{localModels.length !== 1 ? 's' : ''}</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={fetchLocalModels} loading={loadingLocal} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Scan Local
                </Button>
              </div>
            </div>

            {/* Cloud Models */}
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Cloud Models</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {CLOUD_MODELS.map((model) => {
                const selected = selectedModels.includes(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModelSelection(model.id)}
                    className={clsx(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                      selected
                        ? 'border-forge-500 bg-forge-50 text-forge-700 ring-1 ring-forge-500/30 dark:border-forge-500 dark:bg-forge-900/20 dark:text-forge-300'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-surface-dark-4 dark:text-gray-300 dark:hover:border-surface-dark-3',
                    )}
                  >
                    <Avatar name={model.name} color={model.color} size="sm" />
                    <div className="text-left">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{model.provider}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Local Models */}
            {localModels.length > 0 && (
              <>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  <Cpu className="mr-1 inline-block h-3 w-3" />
                  Local Models
                </p>
                <div className="flex flex-wrap gap-2">
                  {localModels.map((model) => {
                    const selected = selectedModels.includes(model.id);
                    return (
                      <button
                        key={model.id}
                        onClick={() => toggleModelSelection(model.id)}
                        className={clsx(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                          selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-surface-dark-4 dark:text-gray-300 dark:hover:border-surface-dark-3',
                        )}
                      >
                        <Avatar name={model.name} color={model.color} size="sm" />
                        <div className="text-left">
                          <p className="font-medium">{model.name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">{model.provider}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {localModels.length === 0 && !loadingLocal && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 dark:border-surface-dark-4 dark:bg-surface-dark-2">
                <Cpu className="h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No local models detected. Start Ollama or LM Studio, then click "Scan Local" to discover them.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateUI(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTournament}
              disabled={!topic.trim() || selectedModels.length < 2}
              icon={<Swords className="h-4 w-4" />}
            >
              Start Tournament
            </Button>
          </div>
        </Card>
      )}

      {/* Tournament selector */}
      {tournaments.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTournamentId(t.id)}
              className={clsx(
                'rounded-lg border px-3 py-2 text-sm transition-all',
                activeTournamentId === t.id
                  ? 'border-forge-500 bg-forge-50 text-forge-700 dark:border-forge-500 dark:bg-forge-900/20 dark:text-forge-300'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-surface-dark-4 dark:text-gray-400',
              )}
            >
              <span className="font-medium">{t.name}</span>
              <span className="ml-2">
                <Badge
                  variant={t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'info' : 'default'}
                  size="sm"
                >
                  {t.status}
                </Badge>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Active Tournament */}
      {activeTournament ? (
        <>
          {/* Tournament status badge */}
          <div className="mb-4 flex items-center gap-3">
            <Badge
              variant={activeTournament.status === 'completed' ? 'success' : activeTournament.status === 'in-progress' ? 'info' : 'default'}
              size="md"
            >
              {activeTournament.status === 'completed' ? 'Completed' : activeTournament.status === 'in-progress' ? 'In Progress' : 'Setup'}
            </Badge>
            {activeTournament.status === 'completed' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Finished {new Date(activeTournament.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Tournament info bar */}
          <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-surface-dark-3 dark:bg-surface-dark-1">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{activeTournament.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Topic: {activeTournament.topic} | {activeTournament.bracketType === 'single-elimination' ? 'Single Elimination' : 'Round Robin'} | {activeTournament.participants.length} participants
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTournament.status === 'completed' && activeTournament.champion && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Champion: {activeTournament.champion.name}
                  </span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleExportResults} icon={<Download className="h-4 w-4" />}>
                Export Results
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetTournament} icon={<RotateCcw className="h-4 w-4" />}>
                Reset
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} icon={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
            </div>
          </div>

          {/* Tournament summary stats (shown when completed) */}
          {activeTournament.status === 'completed' && (
            <Card className="mb-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {/* Champion */}
                <div className="flex flex-col items-center gap-2 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/50 p-4 dark:from-amber-900/20 dark:to-amber-900/10">
                  <Crown className="h-6 w-6 text-amber-500" />
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">Champion</p>
                  <p className="text-center text-sm font-bold text-amber-800 dark:text-amber-200">
                    {activeTournament.champion?.name ?? 'N/A'}
                  </p>
                  {activeTournament.champion && (
                    <ProviderPill provider={activeTournament.champion.provider} />
                  )}
                </div>

                {/* Runner-up */}
                <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-4 dark:bg-surface-dark-2">
                  <Star className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Runner-up</p>
                  <p className="text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                    {(() => {
                      const sorted = [...activeTournament.participants].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
                      return sorted[1]?.name ?? 'N/A';
                    })()}
                  </p>
                </div>

                {/* Total matches */}
                <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-4 dark:bg-surface-dark-2">
                  <Swords className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Matches</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {activeTournament.matches.filter((m) => m.participant1 && m.participant2).length}
                  </p>
                </div>

                {/* Total rounds */}
                <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-4 dark:bg-surface-dark-2">
                  <Target className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Rounds</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {Math.max(...activeTournament.matches.map((m) => m.round), 0)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Bracket Display */}
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {activeTournament.bracketType === 'single-elimination' ? 'Bracket' : 'Matches'}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-surface-dark-3 dark:bg-surface-dark-1">
              {activeTournament.bracketType === 'single-elimination' ? (
                <div className="flex items-center min-w-max">
                  {rounds.map((roundMatches, roundIdx) => {
                    // Calculate running match number offset
                    let matchOffset = 0;
                    for (let r = 0; r < roundIdx; r++) matchOffset += rounds[r].length;
                    return (
                      <React.Fragment key={roundIdx}>
                        {/* Connecting lines between rounds */}
                        {roundIdx > 0 && (
                          <div className="flex flex-col items-center justify-around mx-1"
                            style={{ minHeight: roundIdx === 1 ? 'auto' : `${rounds[0].length * 130}px` }}
                          >
                            {roundMatches.map((_, mIdx) => (
                              <div key={mIdx} className="flex items-center">
                                <div className="w-6 h-px bg-gray-300 dark:bg-surface-dark-4" />
                                <ChevronRight className="h-3 w-3 text-gray-300 dark:text-surface-dark-4 -ml-1" />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-2">
                          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {getRoundLabel(roundIdx, rounds.length)}
                          </h3>
                          <div
                            className="flex flex-col gap-6"
                            style={{
                              justifyContent: 'space-around',
                              minHeight: roundIdx === 0 ? 'auto' : `${rounds[0].length * 130}px`,
                            }}
                          >
                            {roundMatches.map((match, mIdx) => (
                              <MatchCard
                                key={match.id}
                                match={match}
                                matchNumber={matchOffset + mIdx + 1}
                                onSetWinner={activeTournament.status !== 'completed' ? handleSetWinner : undefined}
                              />
                            ))}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* Connecting line to champion */}
                  <div className="flex items-center mx-1">
                    <div className="w-6 h-px bg-amber-300 dark:bg-amber-700" />
                    <ChevronRight className="h-3 w-3 text-amber-400 dark:text-amber-600 -ml-1" />
                  </div>

                  {/* Champion slot */}
                  <div className="flex flex-col items-center gap-2">
                    <h3 className="mb-3 text-sm font-semibold text-amber-600 dark:text-amber-400">Champion</h3>
                    <div className={clsx(
                      'flex flex-col items-center gap-3 rounded-xl border-2 p-6',
                      activeTournament.champion
                        ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20'
                        : 'border-dashed border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-900/10',
                    )}>
                      {activeTournament.champion ? (
                        <>
                          <Avatar name={activeTournament.champion.name} color={activeTournament.champion.color} size="lg" />
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{activeTournament.champion.name}</p>
                          <Crown className="h-6 w-6 text-amber-500" />
                        </>
                      ) : (
                        <>
                          <Crown className="h-8 w-8 text-amber-400/50" />
                          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">TBD</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Round Robin — grid of matches */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeTournament.matches.map((match, idx) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      matchNumber={idx + 1}
                      onSetWinner={activeTournament.status !== 'completed' ? handleSetWinner : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Standings */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Standings</h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-surface-dark-3">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Participant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Provider</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">W</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">L</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                    {[...activeTournament.participants]
                      .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
                      .map((p, idx) => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-surface-dark-2 transition-colors">
                          <td className="px-4 py-3">
                            <span className={clsx(
                              'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                              idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              idx === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                              idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                              'text-gray-500 dark:text-gray-400',
                            )}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={p.name} color={p.color} size="sm" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                              {activeTournament.champion?.id === p.id && (
                                <Crown className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.provider}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">{p.wins}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-red-500 dark:text-red-400">{p.losses}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={
                              activeTournament.champion?.id === p.id ? 'success' :
                              p.losses > 0 && activeTournament.bracketType === 'single-elimination' ? 'error' :
                              'default'
                            }>
                              {activeTournament.champion?.id === p.id ? 'Champion' :
                               p.losses > 0 && activeTournament.bracketType === 'single-elimination' ? 'Eliminated' :
                               'Active'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      ) : (
        /* No tournaments yet */
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create a tournament to pit AI models against each other in bracket-style elimination."
          action={{
            label: 'Create Tournament',
            onClick: () => setShowCreateUI(true),
            icon: <Plus className="h-4 w-4" />,
          }}
          className="mt-12"
        />
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Tournament">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>{activeTournament?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteTournament}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TournamentView;
