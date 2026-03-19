import { describe, it, expect } from 'vitest';
import { DebateEngine, LINCOLN_DOUGLAS_FORMAT, PARLIAMENTARY_FORMAT } from '../src/core/debate_engine/index';
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
    debate_behavior: { opening_strategy: 'Present', rebuttal_strategy: 'Counter', closing_strategy: 'Summarize' },
  });

  return [
    { ...base, id: 'd-prop', name: 'Proponent', persona: persona('Advocate'), position: 'proposition' as const },
    { ...base, id: 'd-opp', name: 'Opponent', persona: persona('Critic'), position: 'opposition' as const },
    { ...base, id: 'd-hm', name: 'Speaker', persona: persona('Chair'), position: 'housemaster' as const },
  ];
}

function makeTurn(debaterId: string, phase: string): any {
  return { id: `t-${Math.random()}`, debateId: 'x', debaterName: 'X', debaterId, model: 'm', persona: 'p', content: 'x', citations: [], round: 1, phase, timestamp: '' };
}

async function* mockStream(): AsyncGenerator<StreamChunk> {
  yield { content: 'Test response content.', done: false, type: 'text' };
  yield { content: '', done: true };
}

describe('DebateEngine with Lincoln-Douglas Format', () => {
  const engine = new DebateEngine();

  it('getCurrentTurnInfo returns proposition/opening for step 0 (no housemaster start)', () => {
    // Lincoln-Douglas starts with proposition opening, not housemaster
    const debaters = makeDebaters().filter((d) => d.position !== 'housemaster');
    // Manually build a LD debate
    const debate = {
      id: 'ld-1',
      topic: 'Values test',
      format: LINCOLN_DOUGLAS_FORMAT,
      status: 'in-progress' as const,
      debaters: debaters,
      turns: [],
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'opening' as const,
      createdAt: '',
      updatedAt: '',
    };

    const info = engine.getCurrentTurnInfo(debate);
    expect(info.stepIndex).toBe(0);
    expect(info.phase).toBe('opening');
    expect(info.role).toBe('proposition');
  });

  it('step 1 is opposition cross-examination', () => {
    const debaters = makeDebaters().filter((d) => d.position !== 'housemaster');
    const debate = {
      id: 'ld-2',
      topic: 'Test',
      format: LINCOLN_DOUGLAS_FORMAT,
      status: 'in-progress' as const,
      debaters,
      turns: [makeTurn('d-prop', 'opening')],
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'opening' as const,
      createdAt: '',
      updatedAt: '',
    };

    const info = engine.getCurrentTurnInfo(debate);
    expect(info.stepIndex).toBe(1);
    expect(info.phase).toBe('cross-examination');
    expect(info.role).toBe('opposition');
  });

  it('completes after 8 turns', () => {
    const debaters = makeDebaters().filter((d) => d.position !== 'housemaster');
    const debate = {
      id: 'ld-3',
      topic: 'Test',
      format: LINCOLN_DOUGLAS_FORMAT,
      status: 'in-progress' as const,
      debaters,
      turns: Array.from({ length: 8 }, (_, i) => makeTurn(i % 2 === 0 ? 'd-prop' : 'd-opp', 'opening')),
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'opening' as const,
      createdAt: '',
      updatedAt: '',
    };

    expect(engine.isDebateComplete(debate)).toBe(true);
  });

  it('is not complete after 7 turns', () => {
    const debaters = makeDebaters().filter((d) => d.position !== 'housemaster');
    const debate = {
      id: 'ld-4',
      topic: 'Test',
      format: LINCOLN_DOUGLAS_FORMAT,
      status: 'in-progress' as const,
      debaters,
      turns: Array.from({ length: 7 }, (_, i) => makeTurn(i % 2 === 0 ? 'd-prop' : 'd-opp', 'opening')),
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'opening' as const,
      createdAt: '',
      updatedAt: '',
    };

    expect(engine.isDebateComplete(debate)).toBe(false);
  });
});

describe('DebateEngine with Parliamentary Format', () => {
  const engine = new DebateEngine();

  it('starts with housemaster introduction', () => {
    const debate = {
      id: 'parl-1',
      topic: 'Parliamentary test',
      format: PARLIAMENTARY_FORMAT,
      status: 'in-progress' as const,
      debaters: makeDebaters(),
      turns: [],
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'introduction' as const,
      createdAt: '',
      updatedAt: '',
    };

    const info = engine.getCurrentTurnInfo(debate);
    expect(info.phase).toBe('introduction');
    expect(info.role).toBe('housemaster');
  });

  it('has proposition opening as step 1', () => {
    const debate = {
      id: 'parl-2',
      topic: 'Test',
      format: PARLIAMENTARY_FORMAT,
      status: 'in-progress' as const,
      debaters: makeDebaters(),
      turns: [makeTurn('d-hm', 'introduction')],
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'introduction' as const,
      createdAt: '',
      updatedAt: '',
    };

    const info = engine.getCurrentTurnInfo(debate);
    expect(info.phase).toBe('opening');
    expect(info.role).toBe('proposition');
  });

  it('ends with housemaster verdict', () => {
    const lastStep = PARLIAMENTARY_FORMAT.turnSequence[PARLIAMENTARY_FORMAT.turnSequence.length - 1];
    expect(lastStep.phase).toBe('verdict');
    expect(lastStep.role).toBe('housemaster');
  });

  it('opposition closing comes before proposition closing', () => {
    const closings = PARLIAMENTARY_FORMAT.turnSequence
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => s.phase === 'closing');
    expect(closings[0].role).toBe('opposition');
    expect(closings[1].role).toBe('proposition');
  });

  it('completes after 8 turns', () => {
    const debate = {
      id: 'parl-3',
      topic: 'Test',
      format: PARLIAMENTARY_FORMAT,
      status: 'in-progress' as const,
      debaters: makeDebaters(),
      turns: Array.from({ length: 8 }, () => makeTurn('d-hm', 'introduction')),
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'introduction' as const,
      createdAt: '',
      updatedAt: '',
    };

    expect(engine.isDebateComplete(debate)).toBe(true);
  });

  it('runs a turn with streaming and appends to debate', async () => {
    const debate = {
      id: 'parl-4',
      topic: 'Parliamentary streaming test',
      format: PARLIAMENTARY_FORMAT,
      status: 'in-progress' as const,
      debaters: makeDebaters(),
      turns: [],
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: 'introduction' as const,
      housemasterId: 'd-hm',
      createdAt: '',
      updatedAt: '',
    };

    for await (const _ of engine.runTurn(debate, () => mockStream())) {}

    expect(debate.turns).toHaveLength(1);
    expect(debate.turns[0].content).toBe('Test response content.');
    expect(debate.turns[0].debaterId).toBe('d-hm');
    expect(debate.turns[0].phase).toBe('introduction');
  });
});

describe('Cross-format engine behavior', () => {
  const engine = new DebateEngine();

  it('getPhaseInstructions returns valid content for all formats and roles', () => {
    const phases = ['introduction', 'opening', 'rebuttal', 'cross-examination', 'closing', 'verdict'] as const;
    const roles = ['proposition', 'opposition', 'housemaster'] as const;

    for (const phase of phases) {
      for (const role of roles) {
        const instructions = engine.getPhaseInstructions(phase, role, 0, 'Test topic');
        expect(typeof instructions).toBe('string');
        expect(instructions.length).toBeGreaterThan(0);
      }
    }
  });
});
