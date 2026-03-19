import { describe, it, expect } from 'vitest';
import { UPPEngine } from '../src/core/upp_engine/index';
import type { Persona, DebateTurn } from '../src/types';

function makePersona(overrides?: Partial<Persona>): Persona {
  return {
    id: 'p-test',
    name: 'Test Debater',
    tagline: 'Logic above all',
    background: 'PhD in Philosophy with 20 years of debate experience.',
    expertise: ['logic', 'ethics', 'policy analysis'],
    rhetorical_style: 'Methodical and precise.',
    ideological_leanings: 'Pragmatic centrist.',
    argumentation_preferences: {
      evidence_weight: 'heavy',
      emotional_appeals: 'minimal',
      concession_willingness: 'high',
      humor: 'Dry wit.',
    },
    debate_behavior: {
      opening_strategy: 'Lead with evidence.',
      rebuttal_strategy: 'Target logical gaps.',
      closing_strategy: 'Summarize evidence.',
    },
    ...overrides,
  };
}

function makeTurns(): DebateTurn[] {
  return [
    {
      id: 't1', debateId: 'debate-1', debaterName: 'Test', debaterId: 'p-test',
      model: 'gpt-4o', persona: 'Test Debater',
      content: 'The evidence clearly shows that artificial intelligence regulation is necessary to prevent misuse. Studies from MIT indicate that 78% of AI systems lack adequate safety measures.',
      citations: [], round: 1, phase: 'opening', timestamp: new Date().toISOString(),
    },
    {
      id: 't2', debateId: 'debate-1', debaterName: 'Test', debaterId: 'p-test',
      model: 'gpt-4o', persona: 'Test Debater',
      content: 'In response to the opposition, the data speaks for itself. The Stanford AI Index Report demonstrates a clear correlation between regulation and innovation outcomes.',
      citations: [], round: 2, phase: 'rebuttal', timestamp: new Date().toISOString(),
    },
  ];
}

const userProfile = {
  preferredTopics: ['AI', 'ethics', 'technology policy'],
  expertiseLevel: 'expert',
  debatePreferences: 'Structured Oxford Union format with evidence focus.',
  interactionStyle: 'analytical',
};

describe('UPP Engine', () => {
  const engine = new UPPEngine();

  describe('generateUPP', () => {
    it('produces a valid UPP object', () => {
      const persona = makePersona();
      const turns = makeTurns();
      const upp = engine.generateUPP(persona, turns, userProfile);

      expect(upp.upp_version).toBe('1.0.0');
      expect(upp.generated_at).toBeTruthy();
      expect(upp.user_profile).toBeDefined();
      expect(upp.persona_state).toBeDefined();
      expect(upp.instructions_for_any_model).toBeTruthy();
    });

    it('includes persona name in state', () => {
      const persona = makePersona({ name: 'Dr. Empirica' });
      const upp = engine.generateUPP(persona, [], userProfile);
      expect(upp.persona_state.name).toBe('Dr. Empirica');
    });

    it('includes user profile data', () => {
      const upp = engine.generateUPP(makePersona(), [], userProfile);
      expect(upp.user_profile.preferred_topics).toEqual(['AI', 'ethics', 'technology policy']);
      expect(upp.user_profile.expertise_level).toBe('expert');
    });

    it('extracts accumulated positions from debate history', () => {
      const upp = engine.generateUPP(makePersona(), makeTurns(), userProfile);
      expect(upp.persona_state.accumulated_positions.length).toBeGreaterThan(0);
    });

    it('produces empty positions when no debate history', () => {
      const upp = engine.generateUPP(makePersona(), [], userProfile);
      expect(upp.persona_state.accumulated_positions).toEqual([]);
    });

    it('generates non-empty instructions', () => {
      const upp = engine.generateUPP(makePersona(), [], userProfile);
      expect(upp.instructions_for_any_model.length).toBeGreaterThan(100);
    });
  });

  describe('generateInstructions', () => {
    it('includes persona name in instructions', () => {
      const persona = makePersona({ name: 'The Rational Analyst' });
      const instructions = engine.generateInstructions(persona, userProfile);
      expect(instructions).toContain('The Rational Analyst');
    });

    it('includes background', () => {
      const instructions = engine.generateInstructions(makePersona(), userProfile);
      expect(instructions).toContain('PhD in Philosophy');
    });

    it('includes expertise areas', () => {
      const instructions = engine.generateInstructions(makePersona(), userProfile);
      expect(instructions).toContain('logic');
      expect(instructions).toContain('ethics');
    });

    it('includes evidence weight guidance for heavy', () => {
      const persona = makePersona({ argumentation_preferences: { ...makePersona().argumentation_preferences, evidence_weight: 'heavy' } });
      const instructions = engine.generateInstructions(persona, userProfile);
      expect(instructions.toLowerCase()).toContain('evidence');
    });

    it('adapts to expert user level', () => {
      const instructions = engine.generateInstructions(makePersona(), { ...userProfile, expertiseLevel: 'expert' });
      expect(instructions).toContain('technical language');
    });

    it('adapts to beginner user level', () => {
      const instructions = engine.generateInstructions(makePersona(), { ...userProfile, expertiseLevel: 'beginner' });
      expect(instructions).toContain('jargon');
    });

    it('includes debate strategy', () => {
      const instructions = engine.generateInstructions(makePersona(), userProfile);
      expect(instructions).toContain('Lead with evidence');
      expect(instructions).toContain('Target logical gaps');
    });

    it('includes important rules', () => {
      const instructions = engine.generateInstructions(makePersona(), userProfile);
      expect(instructions).toContain('Stay in character');
      expect(instructions).toContain('Never reference being an AI');
    });
  });

  describe('importUPP', () => {
    it('extracts persona name from UPP', () => {
      const upp = engine.generateUPP(makePersona({ name: 'Imported Persona' }), [], userProfile);
      const result = engine.importUPP(upp);
      expect(result.name).toBe('Imported Persona');
    });

    it('attaches full UPP as meta', () => {
      const upp = engine.generateUPP(makePersona(), [], userProfile);
      const result = engine.importUPP(upp);
      expect(result._uppMeta).toBeDefined();
      expect(result._uppMeta.upp_version).toBe('1.0.0');
    });
  });

  describe('UPP round-trip', () => {
    it('maintains persona name through generate → import', () => {
      const original = makePersona({ name: 'Round Trip Test' });
      const upp = engine.generateUPP(original, [], userProfile);
      const imported = engine.importUPP(upp);
      expect(imported.name).toBe(original.name);
    });

    it('maintains user profile through generation', () => {
      const upp = engine.generateUPP(makePersona(), [], userProfile);
      expect(upp.user_profile.expertise_level).toBe(userProfile.expertiseLevel);
      expect(upp.user_profile.interaction_style).toBe(userProfile.interactionStyle);
    });
  });
});
