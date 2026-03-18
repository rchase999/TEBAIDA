import { describe, it, expect } from 'vitest';
import { PersonaManager } from '../src/core/persona_manager/index';

describe('PersonaManager', () => {
  const manager = new PersonaManager();

  describe('getBuiltInPersonas', () => {
    it('returns 6 built-in personas', () => {
      const personas = manager.getBuiltInPersonas();
      expect(personas).toHaveLength(6);
    });

    it('each persona has all required fields', () => {
      const personas = manager.getBuiltInPersonas();
      for (const p of personas) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.tagline).toBeTruthy();
        expect(p.background).toBeTruthy();
        expect(p.expertise.length).toBeGreaterThan(0);
        expect(p.rhetorical_style).toBeTruthy();
        expect(p.ideological_leanings).toBeTruthy();
        expect(p.argumentation_preferences.evidence_weight).toBeTruthy();
        expect(p.debate_behavior.opening_strategy).toBeTruthy();
        expect(p.debate_behavior.rebuttal_strategy).toBeTruthy();
        expect(p.debate_behavior.closing_strategy).toBeTruthy();
        expect(p.avatar_color).toBeTruthy();
      }
    });

    it('has unique IDs', () => {
      const personas = manager.getBuiltInPersonas();
      const ids = personas.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('personaToSystemPrompt', () => {
    it('generates a system prompt with persona details', () => {
      const personas = manager.getBuiltInPersonas();
      const prompt = manager.personaToSystemPrompt(personas[0], 'proposition', 'AI regulation');
      expect(prompt).toContain(personas[0].name);
      expect(prompt).toContain('Proposition');
      expect(prompt).toContain('AI regulation');
      expect(prompt).toContain(personas[0].rhetorical_style);
    });

    it('handles opposition position', () => {
      const personas = manager.getBuiltInPersonas();
      const prompt = manager.personaToSystemPrompt(personas[0], 'opposition', 'Topic');
      expect(prompt).toContain('AGAINST');
    });

    it('handles housemaster position', () => {
      const personas = manager.getBuiltInPersonas();
      const prompt = manager.personaToSystemPrompt(personas[0], 'housemaster', 'Topic');
      expect(prompt).toContain('HOUSEMASTER');
    });

    it('includes evidence weight instructions', () => {
      const personas = manager.getBuiltInPersonas();
      // The Rational Analyst has heavy evidence weight
      const analyst = personas.find(p => p.id === 'rational-analyst')!;
      const prompt = manager.personaToSystemPrompt(analyst, 'proposition', 'Topic');
      expect(prompt).toContain('MUST cite');
    });

    it('includes format rules about staying in character', () => {
      const personas = manager.getBuiltInPersonas();
      const prompt = manager.personaToSystemPrompt(personas[0], 'proposition', 'Topic');
      expect(prompt).toContain('Stay in character');
      expect(prompt).toContain('Never break the fourth wall');
    });
  });

  describe('validatePersona (via loadPersona)', () => {
    it('rejects non-object', () => {
      expect(() => (manager as any).validatePersona(null)).toThrow();
      expect(() => (manager as any).validatePersona('string')).toThrow();
    });

    it('rejects missing required fields', () => {
      expect(() => (manager as any).validatePersona({ id: 'x' })).toThrow();
    });

    it('rejects empty expertise', () => {
      expect(() => (manager as any).validatePersona({
        id: 'x', name: 'X', tagline: 'T', background: 'B',
        rhetorical_style: 'R', ideological_leanings: 'I',
        expertise: [],
        argumentation_preferences: {},
        debate_behavior: {},
      })).toThrow('non-empty expertise');
    });
  });
});
