import { describe, it, expect } from 'vitest';
import { DebateEngine, OXFORD_UNION_FORMAT, TURN_SEQUENCE } from '../src/core/debate_engine/index';
import type { DebaterConfig, StreamChunk } from '../src/types';

function makeDebaters(): DebaterConfig[] {
  const base = {
    model: { id: 'test', provider: 'openai' as const, name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true },
    isLocal: false,
  };
  const persona = (name: string) => ({
    id: `p-${name}`, name, tagline: 'Test', background: 'Test', expertise: ['logic'],
    rhetorical_style: 'analytical', ideological_leanings: 'neutral',
    argumentation_preferences: { evidence_weight: 'moderate' as const, emotional_appeals: 'moderate' as const, concession_willingness: 'moderate' as const, humor: 'none' },
    debate_behavior: { opening_strategy: 'Present thesis', rebuttal_strategy: 'Counter', closing_strategy: 'Summarize' },
  });

  return [
    { ...base, id: 'd-prop', name: 'Proponent', persona: persona('Advocate'), position: 'proposition' as const },
    { ...base, id: 'd-opp', name: 'Opponent', persona: persona('Critic'), position: 'opposition' as const },
    { ...base, id: 'd-hm', name: 'Housemaster', persona: persona('Chair'), position: 'housemaster' as const },
  ];
}

describe('DebateEngine (Oxford Union)', () => {
  const engine = new DebateEngine();

  describe('startDebate', () => {
    it('creates a debate with 3 debaters and correct initial state', () => {
      const debate = engine.startDebate('AI regulation', makeDebaters());
      expect(debate.topic).toBe('AI regulation');
      expect(debate.status).toBe('in-progress');
      expect(debate.turns).toEqual([]);
      expect(debate.debaters).toHaveLength(3);
      expect(debate.format.id).toBe('oxford-union');
      expect(debate.housemasterId).toBe('d-hm');
      expect(debate.currentPhase).toBe('introduction');
    });

    it('throws with fewer than 3 debaters', () => {
      const debaters = makeDebaters().slice(0, 2);
      expect(() => engine.startDebate('Topic', debaters)).toThrow();
    });

    it('throws if roles are missing', () => {
      const debaters = makeDebaters();
      debaters[2] = { ...debaters[2], position: 'proposition' };
      expect(() => engine.startDebate('Topic', debaters)).toThrow();
    });
  });

  describe('getCurrentTurnInfo', () => {
    it('returns introduction/housemaster for step 0', () => {
      const debate = engine.startDebate('Topic', makeDebaters());
      const info = engine.getCurrentTurnInfo(debate);
      expect(info.stepIndex).toBe(0);
      expect(info.phase).toBe('introduction');
      expect(info.role).toBe('housemaster');
      expect(info.debaterId).toBe('d-hm');
    });

    it('returns proposition/opening for step 1', () => {
      const debate = engine.startDebate('Topic', makeDebaters());
      // Simulate one completed turn
      debate.turns.push({ id: 't0', debateId: debate.id, debaterName: 'HM', debaterId: 'd-hm', model: 'gpt-4o', persona: 'Chair', content: 'Intro', citations: [], round: 1, phase: 'introduction', timestamp: '' });
      const info = engine.getCurrentTurnInfo(debate);
      expect(info.stepIndex).toBe(1);
      expect(info.phase).toBe('opening');
      expect(info.role).toBe('proposition');
    });
  });

  describe('runTurn', () => {
    it('streams chunks and appends turn', async () => {
      const debate = engine.startDebate('AI regulation', makeDebaters());

      async function* mockStream(): AsyncGenerator<StreamChunk> {
        yield { content: 'Welcome ', done: false, type: 'text' };
        yield { content: 'to the debate', done: false, type: 'text' };
        yield { content: '', done: true };
      }

      const chunks: StreamChunk[] = [];
      for await (const chunk of engine.runTurn(debate, () => mockStream())) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(debate.turns).toHaveLength(1);
      expect(debate.turns[0].content).toBe('Welcome to the debate');
      expect(debate.turns[0].phase).toBe('introduction');
      expect(debate.turns[0].debaterId).toBe('d-hm');
    });

    it('captures thinking content separately', async () => {
      const debate = engine.startDebate('Topic', makeDebaters());

      async function* mockStream(): AsyncGenerator<StreamChunk> {
        yield { content: 'Planning introduction...', done: false, type: 'thinking' };
        yield { content: 'Welcome everyone.', done: false, type: 'text' };
        yield { content: '', done: true };
      }

      for await (const _ of engine.runTurn(debate, () => mockStream())) {}

      expect(debate.turns[0].content).toBe('Welcome everyone.');
      expect(debate.turns[0].thinking).toBe('Planning introduction...');
    });

    it('throws when debate is complete', async () => {
      const debate = engine.startDebate('Topic', makeDebaters());
      // Simulate all 10 turns
      for (let i = 0; i < 10; i++) {
        debate.turns.push({ id: `t${i}`, debateId: debate.id, debaterName: 'X', debaterId: 'd-hm', model: 'm', persona: 'p', content: 'x', citations: [], round: 1, phase: 'introduction', timestamp: '' });
      }

      async function* mockStream(): AsyncGenerator<StreamChunk> {
        yield { content: '', done: true };
      }

      await expect(async () => {
        for await (const _ of engine.runTurn(debate, () => mockStream())) {}
      }).rejects.toThrow('already complete');
    });
  });

  describe('nextTurn', () => {
    it('advances through the 10-step cycle', () => {
      const debate = engine.startDebate('Topic', makeDebaters());

      // Add one turn and advance
      debate.turns.push({ id: 't0', debateId: debate.id, debaterName: 'HM', debaterId: 'd-hm', model: 'm', persona: 'p', content: 'x', citations: [], round: 1, phase: 'introduction', timestamp: '' });
      engine.nextTurn(debate);

      expect(debate.currentPhase).toBe('opening');
    });

    it('marks debate complete after 10 turns', () => {
      const debate = engine.startDebate('Topic', makeDebaters());
      for (let i = 0; i < 10; i++) {
        debate.turns.push({ id: `t${i}`, debateId: debate.id, debaterName: 'X', debaterId: 'd-hm', model: 'm', persona: 'p', content: 'x', citations: [], round: 1, phase: 'introduction', timestamp: '' });
      }
      engine.nextTurn(debate);
      expect(debate.status).toBe('completed');
    });
  });

  describe('isDebateComplete', () => {
    it('returns false when turns < 10', () => {
      const debate = engine.startDebate('Topic', makeDebaters());
      expect(engine.isDebateComplete(debate)).toBe(false);
    });

    it('returns true when turns >= 10', () => {
      const debate = engine.startDebate('Topic', makeDebaters());
      for (let i = 0; i < 10; i++) {
        debate.turns.push({ id: `t${i}`, debateId: debate.id, debaterName: 'X', debaterId: 'd-hm', model: 'm', persona: 'p', content: 'x', citations: [], round: 1, phase: 'introduction', timestamp: '' });
      }
      expect(engine.isDebateComplete(debate)).toBe(true);
    });

    it('returns true when status is completed', () => {
      const debate = engine.startDebate('Topic', makeDebaters());
      debate.status = 'completed';
      expect(engine.isDebateComplete(debate)).toBe(true);
    });
  });
});

describe('Oxford Union Format', () => {
  it('has exactly 10 steps in the turn sequence', () => {
    expect(TURN_SEQUENCE).toHaveLength(10);
  });

  it('follows the correct role order', () => {
    const roles = TURN_SEQUENCE.map(s => s.role);
    expect(roles).toEqual([
      'housemaster', 'proposition', 'opposition',
      'housemaster', 'proposition', 'opposition',
      'housemaster', 'proposition', 'opposition',
      'housemaster',
    ]);
  });

  it('follows the correct phase order', () => {
    const phases = TURN_SEQUENCE.map(s => s.phase);
    expect(phases).toEqual([
      'introduction', 'opening', 'opening',
      'transition', 'rebuttal', 'rebuttal',
      'cross-examination', 'closing', 'closing',
      'verdict',
    ]);
  });

  it('format config has required fields', () => {
    expect(OXFORD_UNION_FORMAT.id).toBe('oxford-union');
    expect(OXFORD_UNION_FORMAT.name).toBe('Oxford Union');
    expect(OXFORD_UNION_FORMAT.totalTurns).toBe(10);
    expect(OXFORD_UNION_FORMAT.rules.length).toBeGreaterThan(0);
    expect(OXFORD_UNION_FORMAT.description.length).toBeGreaterThan(20);
  });
});
