import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Trophy, Plus, Swords, Crown, ChevronRight,
  Users, Target, Zap, Star, Clock, ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { Select } from '../../components/Select';

/* ------- Types ------- */

interface TournamentParticipant {
  id: string;
  name: string;
  model: string;
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
}

/* ------- Demo bracket data ------- */

const DEMO_PARTICIPANTS: TournamentParticipant[] = [
  { id: '1', name: 'Claude Sonnet', model: 'Anthropic', color: '#D97706', wins: 0, losses: 0 },
  { id: '2', name: 'GPT-4o', model: 'OpenAI', color: '#10B981', wins: 0, losses: 0 },
  { id: '3', name: 'Gemini Pro', model: 'Google', color: '#3B82F6', wins: 0, losses: 0 },
  { id: '4', name: 'Mistral Large', model: 'Mistral', color: '#F97316', wins: 0, losses: 0 },
  { id: '5', name: 'Llama 3 70B', model: 'Groq', color: '#8B5CF6', wins: 0, losses: 0 },
  { id: '6', name: 'Claude Opus', model: 'Anthropic', color: '#EF4444', wins: 0, losses: 0 },
  { id: '7', name: 'GPT-4 Turbo', model: 'OpenAI', color: '#06B6D4', wins: 0, losses: 0 },
  { id: '8', name: 'Gemini Ultra', model: 'Google', color: '#EC4899', wins: 0, losses: 0 },
];

function buildDemoBracket(): BracketMatch[] {
  const matches: BracketMatch[] = [];

  // Round 1: Quarterfinals
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `r1-${i}`,
      round: 1,
      position: i,
      participant1: DEMO_PARTICIPANTS[i * 2] ?? null,
      participant2: DEMO_PARTICIPANTS[i * 2 + 1] ?? null,
      winner: null,
      status: 'pending',
    });
  }

  // Round 2: Semifinals
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `r2-${i}`,
      round: 2,
      position: i,
      participant1: null,
      participant2: null,
      winner: null,
      status: 'pending',
    });
  }

  // Round 3: Finals
  matches.push({
    id: 'r3-0',
    round: 3,
    position: 0,
    participant1: null,
    participant2: null,
    winner: null,
    status: 'pending',
  });

  return matches;
}

/* ------- Match Card ------- */

const MatchCard: React.FC<{
  match: BracketMatch;
  compact?: boolean;
}> = ({ match, compact }) => {
  const statusColors: Record<string, string> = {
    pending: 'border-gray-200 dark:border-surface-dark-3',
    'in-progress': 'border-forge-400 dark:border-forge-600 ring-2 ring-forge-500/20',
    completed: 'border-emerald-300 dark:border-emerald-700',
  };

  return (
    <div className={clsx(
      'rounded-xl border bg-white p-3 transition-all dark:bg-surface-dark-1',
      statusColors[match.status],
      compact ? 'min-w-[180px]' : 'min-w-[220px]',
    )}>
      {/* Slot 1 */}
      <div className={clsx(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
        match.winner?.id === match.participant1?.id && 'bg-emerald-50 dark:bg-emerald-900/20',
      )}>
        {match.participant1 ? (
          <>
            <Avatar name={match.participant1.name} color={match.participant1.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{match.participant1.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{match.participant1.model}</p>
            </div>
            {match.winner?.id === match.participant1.id && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
          </>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">TBD</p>
        )}
      </div>

      {/* Divider */}
      <div className="my-1 flex items-center gap-2 px-2">
        <div className="flex-1 h-px bg-gray-200 dark:bg-surface-dark-3" />
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">VS</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-surface-dark-3" />
      </div>

      {/* Slot 2 */}
      <div className={clsx(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
        match.winner?.id === match.participant2?.id && 'bg-emerald-50 dark:bg-emerald-900/20',
      )}>
        {match.participant2 ? (
          <>
            <Avatar name={match.participant2.name} color={match.participant2.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{match.participant2.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{match.participant2.model}</p>
            </div>
            {match.winner?.id === match.participant2.id && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
          </>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">TBD</p>
        )}
      </div>

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
  const [showCreateUI, setShowCreateUI] = useState(false);
  const [topic, setTopic] = useState('');
  const [bracketType, setBracketType] = useState<'single-elimination' | 'round-robin'>('single-elimination');

  const demoMatches = useMemo(() => buildDemoBracket(), []);

  const roundLabels = ['Quarterfinals', 'Semifinals', 'Finals'];

  // Group matches by round
  const rounds = useMemo(() => {
    const grouped: BracketMatch[][] = [];
    const maxRound = Math.max(...demoMatches.map((m) => m.round));
    for (let r = 1; r <= maxRound; r++) {
      grouped.push(demoMatches.filter((m) => m.round === r));
    }
    return grouped;
  }, [demoMatches]);

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
            <Badge variant="warning">Coming Soon</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Organize multi-round debate tournaments with bracket displays and leaderboards.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowCreateUI(!showCreateUI)}
          icon={<Plus className="h-4 w-4" />}
        >
          Create Tournament
        </Button>
      </div>

      {/* Create Tournament Panel */}
      {showCreateUI && (
        <Card className="mb-8 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">New Tournament</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Topic"
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
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>Add participants by configuring debaters in the Setup Wizard, then assign them here.</span>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateUI(false)}>Cancel</Button>
            <Button disabled icon={<Swords className="h-4 w-4" />}>
              Start Tournament
            </Button>
          </div>
        </Card>
      )}

      {/* Feature preview cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Target, title: 'Single Elimination', desc: 'Classic bracket - lose once and you are out. Fast and decisive.', color: 'text-red-500' },
          { icon: Zap, title: 'Round Robin', desc: 'Every debater faces every other. Most comprehensive ranking.', color: 'text-amber-500' },
          { icon: Star, title: 'Leaderboard', desc: 'Track wins, losses, and overall scores across all matches.', color: 'text-emerald-500' },
        ].map((f) => (
          <Card key={f.title} className="flex items-start gap-3">
            <f.icon className={clsx('mt-0.5 h-5 w-5 shrink-0', f.color)} />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{f.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Bracket Preview */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Example Bracket Preview
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-surface-dark-3 dark:bg-surface-dark-1">
          <div className="flex items-center gap-8 min-w-max">
            {rounds.map((roundMatches, roundIdx) => (
              <div key={roundIdx} className="flex flex-col items-center gap-2">
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {roundLabels[roundIdx] ?? `Round ${roundIdx + 1}`}
                </h3>
                <div className="flex flex-col gap-6" style={{ justifyContent: 'space-around', minHeight: roundIdx === 0 ? 'auto' : `${roundMatches.length * 160}px` }}>
                  {roundMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}

            {/* Champion slot */}
            <div className="flex flex-col items-center gap-2">
              <h3 className="mb-3 text-sm font-semibold text-amber-600 dark:text-amber-400">Champion</h3>
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-900/10">
                <Crown className="h-8 w-8 text-amber-500" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">TBD</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Leaderboard
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-surface-dark-3">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Participant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Model</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">W</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">L</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                {DEMO_PARTICIPANTS.map((p, idx) => (
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
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.model}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">{p.wins}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-red-500 dark:text-red-400">{p.losses}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="default">Waiting</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Roadmap note */}
      <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-800 dark:bg-amber-900/10">
        <Trophy className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <h3 className="mb-1 font-semibold text-amber-800 dark:text-amber-300">Tournament Mode is on the Roadmap</h3>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Full tournament functionality with automated bracket management, scoring, and champion tracking is coming in a future release.
          The bracket UI above shows the planned design and layout.
        </p>
      </div>
    </div>
  );
};

export default TournamentView;
