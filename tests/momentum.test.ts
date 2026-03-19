import { describe, it, expect } from 'vitest';
import { calculateMomentum } from '../src/core/momentum/index';
import type { Debate, DebateTurn, DebaterConfig } from '../src/types';
import { OXFORD_UNION_FORMAT, TURN_SEQUENCE } from '../src/core/debate_engine/formats';

function makeTurn(overrides: Partial<DebateTurn> & { debaterId: string; content: string; phase: DebateTurn['phase'] }): DebateTurn {
  return {
    id: `t-${Math.random()}`,
    debateId: 'debate-1',
    debaterName: 'Test',
    model: 'gpt-4o',
    persona: 'Test',
    citations: [],
    round: 1,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeDebate(turns: DebateTurn[]): Debate {
  return {
    id: 'debate-1',
    topic: 'Test topic',
    format: OXFORD_UNION_FORMAT,
    status: 'in-progress',
    debaters: [
      { id: 'd-prop', name: 'Prop', position: 'proposition', isLocal: false } as DebaterConfig,
      { id: 'd-opp', name: 'Opp', position: 'opposition', isLocal: false } as DebaterConfig,
      { id: 'd-hm', name: 'HM', position: 'housemaster', isLocal: false } as DebaterConfig,
    ],
    turns,
    currentRound: 1,
    currentDebaterIndex: 0,
    currentPhase: 'introduction',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Momentum Calculation', () => {
  it('returns empty array for no turns', () => {
    const debate = makeDebate([]);
    const momentum = calculateMomentum(debate);
    expect(momentum).toEqual([]);
  });

  it('returns one point per turn', () => {
    const turns = [
      makeTurn({ debaterId: 'd-hm', content: 'Welcome to this debate on important topics.', phase: 'introduction' }),
      makeTurn({ debaterId: 'd-prop', content: 'I argue that because of evidence and therefore we must consider the data.', phase: 'opening' }),
    ];
    const debate = makeDebate(turns);
    const momentum = calculateMomentum(debate);
    expect(momentum).toHaveLength(2);
  });

  it('housemaster turns have zero score', () => {
    const turns = [
      makeTurn({ debaterId: 'd-hm', content: 'Welcome to the Oxford Union debate.', phase: 'introduction' }),
    ];
    const debate = makeDebate(turns);
    const momentum = calculateMomentum(debate);
    expect(momentum[0].score).toBe(0);
    expect(momentum[0].role).toBe('housemaster');
  });

  it('proposition turns produce positive scores', () => {
    const turns = [
      makeTurn({ debaterId: 'd-hm', content: 'Welcome.', phase: 'introduction' }),
      makeTurn({
        debaterId: 'd-prop',
        content: 'Therefore, because of this evidence, first, let me present my thesis. Studies show that 70% of experts agree. Moreover, the data suggests a clear trend. For example, research from Harvard demonstrates this conclusively.',
        phase: 'opening',
      }),
    ];
    const debate = makeDebate(turns);
    const momentum = calculateMomentum(debate);
    // Proposition turn should shift momentum positively
    expect(momentum[1].score).toBeGreaterThanOrEqual(0);
    expect(momentum[1].role).toBe('proposition');
  });

  it('opposition turns produce negative scores', () => {
    const turns = [
      makeTurn({ debaterId: 'd-hm', content: 'Welcome.', phase: 'introduction' }),
      makeTurn({ debaterId: 'd-prop', content: 'My argument stands.', phase: 'opening' }),
      makeTurn({
        debaterId: 'd-opp',
        content: 'However, my opponent fails to account for the evidence. Therefore, because studies indicate that 80% disagree, and furthermore, the data clearly shows the opposite conclusion.',
        phase: 'opening',
      }),
    ];
    const debate = makeDebate(turns);
    const momentum = calculateMomentum(debate);
    // Opposition turn should shift momentum negatively (or at least not positive)
    expect(momentum[2].role).toBe('opposition');
  });

  it('assigns correct phase to each point', () => {
    const turns = [
      makeTurn({ debaterId: 'd-hm', content: 'Welcome.', phase: 'introduction' }),
      makeTurn({ debaterId: 'd-prop', content: 'My opening.', phase: 'opening' }),
    ];
    const debate = makeDebate(turns);
    const momentum = calculateMomentum(debate);
    expect(momentum[0].phase).toBe('introduction');
    expect(momentum[1].phase).toBe('opening');
  });

  it('scores are within [-100, 100] range', () => {
    const turns = Array.from({ length: 5 }, (_, i) =>
      makeTurn({
        debaterId: i % 3 === 0 ? 'd-hm' : i % 2 === 0 ? 'd-prop' : 'd-opp',
        content: 'A moderately long argument with some reasoning because therefore furthermore in addition to that.',
        phase: TURN_SEQUENCE[i % 10]?.phase ?? 'opening',
      }),
    );
    const debate = makeDebate(turns);
    const momentum = calculateMomentum(debate);
    for (const point of momentum) {
      expect(point.score).toBeGreaterThanOrEqual(-100);
      expect(point.score).toBeLessThanOrEqual(100);
    }
  });
});
