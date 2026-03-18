import { describe, it, expect } from 'vitest';
import { calculateScores, formatScorecard } from '../src/utils/scoring';
import type { Debate, DebateTurn, DebaterConfig } from '../src/types';

function makeTurn(debaterId: string, content: string, overrides: Partial<DebateTurn> = {}): DebateTurn {
  return {
    id: `turn-${Math.random()}`,
    debateId: 'debate-1',
    debaterName: debaterId === 'd1' ? 'Proponent' : 'Opponent',
    debaterId,
    model: 'gpt-4o',
    persona: 'Test',
    content,
    citations: [],
    round: 1,
    phase: 'constructive',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeDebate(turns: DebateTurn[]): Debate {
  return {
    id: 'debate-1',
    topic: 'Test topic',
    format: { id: 'oxford-union', name: 'Oxford Union', description: 'Test', totalTurns: 10, turnSequence: [], rules: ['Be nice'] },
    status: 'completed',
    debaters: [
      { id: 'd1', name: 'Proponent', model: { id: 'm', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true }, persona: { id: 'p1', name: 'Advocate', tagline: '', background: '', expertise: [], rhetorical_style: '', ideological_leanings: '', argumentation_preferences: { evidence_weight: 'moderate', emotional_appeals: 'moderate', concession_willingness: 'moderate', humor: '' }, debate_behavior: { opening_strategy: '', rebuttal_strategy: '', closing_strategy: '' } }, position: 'proposition', isLocal: false },
      { id: 'd2', name: 'Opponent', model: { id: 'm', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true }, persona: { id: 'p2', name: 'Critic', tagline: '', background: '', expertise: [], rhetorical_style: '', ideological_leanings: '', argumentation_preferences: { evidence_weight: 'moderate', emotional_appeals: 'moderate', concession_willingness: 'moderate', humor: '' }, debate_behavior: { opening_strategy: '', rebuttal_strategy: '', closing_strategy: '' } }, position: 'opposition', isLocal: false },
    ],
    turns,
    currentRound: 1,
    currentDebaterIndex: 0,
    currentPhase: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('calculateScores', () => {
  it('returns scores for each debater', () => {
    const debate = makeDebate([
      makeTurn('d1', 'First, I argue that because of the evidence, therefore we should act. Moreover, the data suggests this is the right course. Furthermore, research shows significant benefits. According to studies, the results are clear.'),
      makeTurn('d2', 'I disagree. However, my opponent fails to account for the counterevidence. The opposing argument overlooks critical data points. In contrast, a different approach yields better results.'),
    ]);

    const scores = calculateScores(debate);
    expect(scores).toHaveLength(2);
    expect(scores[0].debaterId).toBe('d1');
    expect(scores[1].debaterId).toBe('d2');

    for (const score of scores) {
      expect(score.categories.argumentation).toBeGreaterThanOrEqual(1);
      expect(score.categories.argumentation).toBeLessThanOrEqual(10);
      expect(score.categories.overall).toBeGreaterThanOrEqual(1);
      expect(score.categories.overall).toBeLessThanOrEqual(10);
      expect(score.notes).toBeTruthy();
    }
  });

  it('penalizes very short responses', () => {
    const shortDebate = makeDebate([makeTurn('d1', 'Yes.'), makeTurn('d2', 'No.')]);
    const longDebate = makeDebate([
      makeTurn('d1', 'This is a comprehensive argument. Because of the evidence gathered from multiple peer-reviewed studies, we can conclude that this policy is effective. Therefore, the data suggests implementation would be beneficial. Furthermore, historical precedents support this conclusion. According to research, the outcomes have been consistently positive across different contexts and demographics.'),
      makeTurn('d2', 'While I appreciate the argument, I must point out several flaws. However, the evidence presented overlooks critical counterexamples. The opposing view fails to account for long-term consequences. In contrast, alternative approaches have shown more promising results in comparable situations.'),
    ]);

    const shortScores = calculateScores(shortDebate);
    const longScores = calculateScores(longDebate);

    expect(shortScores[0].categories.argumentation).toBeLessThan(longScores[0].categories.argumentation);
  });

  it('handles empty turns', () => {
    const debate = makeDebate([]);
    const scores = calculateScores(debate);
    expect(scores).toHaveLength(2);
    expect(scores[0].categories.overall).toBe(1);
  });
});

describe('formatScorecard', () => {
  it('returns message for empty scores', () => {
    expect(formatScorecard([])).toBe('No scores available.');
  });

  it('formats scores with bars and winner', () => {
    const scores = [
      { debaterId: 'd1', debaterName: 'Alice', categories: { argumentation: 8, evidence: 7, rebuttal: 8, rhetoric: 7, overall: 7.5 }, notes: 'Good performance.' },
      { debaterId: 'd2', debaterName: 'Bob', categories: { argumentation: 6, evidence: 5, rebuttal: 5, rhetoric: 6, overall: 5.5 }, notes: 'Average performance.' },
    ];
    const result = formatScorecard(scores);
    expect(result).toContain('DEBATE SCORECARD');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('WINNER');
  });
});
