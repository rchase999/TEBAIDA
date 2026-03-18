import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildTurnPrompt, buildJudgePrompt } from '../src/utils/prompt_builder';
import { OXFORD_UNION_FORMAT } from '../src/core/debate_engine/formats';
import type { Persona, Debate } from '../src/types';

const testPersona: Persona = {
  id: 'test',
  name: 'Test Persona',
  tagline: 'Test tagline',
  background: 'Test background with expertise',
  expertise: ['logic', 'rhetoric'],
  rhetorical_style: 'analytical and precise',
  ideological_leanings: 'centrist',
  argumentation_preferences: {
    evidence_weight: 'heavy',
    emotional_appeals: 'minimal',
    concession_willingness: 'high',
    humor: 'dry wit',
  },
  debate_behavior: {
    opening_strategy: 'Lead with evidence',
    rebuttal_strategy: 'Counter with data',
    closing_strategy: 'Summarize key points',
  },
};

function makeDebate(turns: any[] = []): Debate {
  return {
    id: 'd1', topic: 'AI regulation', format: OXFORD_UNION_FORMAT, status: 'in-progress',
    debaters: [
      { id: 'a', name: 'Alice', model: { id: 'm', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true }, persona: testPersona, position: 'proposition', isLocal: false },
      { id: 'b', name: 'Bob', model: { id: 'm', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true }, persona: testPersona, position: 'opposition', isLocal: false },
      { id: 'c', name: 'Chair', model: { id: 'm', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true }, persona: testPersona, position: 'housemaster', isLocal: false },
    ],
    turns, currentRound: 1, currentDebaterIndex: 0, currentPhase: 'introduction',
    housemasterId: 'c', createdAt: '', updatedAt: '',
  };
}

describe('buildSystemPrompt', () => {
  it('includes persona identity for proposition', () => {
    const prompt = buildSystemPrompt(testPersona, 'proposition', 'AI regulation', 'opening');
    expect(prompt).toContain('Test Persona');
    expect(prompt).toContain('IN FAVOR');
  });

  it('includes persona identity for opposition', () => {
    const prompt = buildSystemPrompt(testPersona, 'opposition', 'Topic', 'opening');
    expect(prompt).toContain('AGAINST');
  });

  it('generates housemaster prompt with neutral guidance', () => {
    const prompt = buildSystemPrompt(testPersona, 'housemaster', 'Topic', 'introduction');
    expect(prompt).toContain('Housemaster');
    expect(prompt.toLowerCase()).toContain('impartial');
  });

  it('includes phase instructions', () => {
    const opening = buildSystemPrompt(testPersona, 'proposition', 'Topic', 'opening');
    expect(opening.toLowerCase()).toContain('opening');

    const rebuttal = buildSystemPrompt(testPersona, 'proposition', 'Topic', 'rebuttal');
    expect(rebuttal.toLowerCase()).toContain('rebuttal');
  });

  it('includes Oxford Union format context', () => {
    const prompt = buildSystemPrompt(testPersona, 'proposition', 'Topic', 'opening');
    expect(prompt).toContain('Oxford Union');
  });
});

describe('buildTurnPrompt', () => {
  it('builds prompt for first turn (housemaster introduction)', () => {
    const debate = makeDebate();
    const prompt = buildTurnPrompt(debate, 2); // housemaster is index 2
    expect(prompt).toContain('YOUR TURN');
    expect(prompt).toContain('Chair');
  });

  it('includes debate history when turns exist', () => {
    const debate = makeDebate([{
      id: 't1', debateId: 'd1', debaterName: 'Chair', debaterId: 'c', model: 'gpt-4o', persona: 'Test',
      content: 'Welcome to this debate.', citations: [], round: 1, phase: 'introduction', timestamp: '',
    }]);
    debate.currentDebaterIndex = 0;
    debate.currentPhase = 'opening';

    const prompt = buildTurnPrompt(debate, 0);
    expect(prompt).toContain('DEBATE HISTORY');
    expect(prompt).toContain('Welcome to this debate');
  });
});

describe('buildJudgePrompt', () => {
  it('includes topic and debater info', () => {
    const debate = makeDebate([{
      id: 't1', debateId: 'd1', debaterName: 'Alice', debaterId: 'a', model: 'gpt-4o', persona: 'Test',
      content: 'Argument here', citations: [], round: 1, phase: 'opening', timestamp: '',
    }]);

    const prompt = buildJudgePrompt(debate);
    expect(prompt).toContain('AI regulation');
    expect(prompt).toContain('Alice');
    expect(prompt).toContain('Bob');
    expect(prompt).toContain('ARGUMENTATION');
    expect(prompt).toContain('JSON');
  });
});
