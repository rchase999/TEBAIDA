import { describe, it, expect } from 'vitest';
import {
  DEBATE_FORMATS,
  OXFORD_UNION_FORMAT,
  LINCOLN_DOUGLAS_FORMAT,
  PARLIAMENTARY_FORMAT,
  getFormatConfig,
  TURN_SEQUENCE,
} from '../src/core/debate_engine/formats';
import type { DebateFormat } from '../src/types';

describe('Debate Formats', () => {
  describe('DEBATE_FORMATS registry', () => {
    it('contains all three formats', () => {
      expect(Object.keys(DEBATE_FORMATS)).toHaveLength(3);
      expect(DEBATE_FORMATS['oxford-union']).toBeDefined();
      expect(DEBATE_FORMATS['lincoln-douglas']).toBeDefined();
      expect(DEBATE_FORMATS['parliamentary']).toBeDefined();
    });
  });

  describe('getFormatConfig', () => {
    it('returns Oxford Union by default', () => {
      expect(getFormatConfig().id).toBe('oxford-union');
    });

    it('returns Oxford Union when explicitly requested', () => {
      expect(getFormatConfig('oxford-union').id).toBe('oxford-union');
    });

    it('returns Lincoln-Douglas when requested', () => {
      expect(getFormatConfig('lincoln-douglas').id).toBe('lincoln-douglas');
    });

    it('returns Parliamentary when requested', () => {
      expect(getFormatConfig('parliamentary').id).toBe('parliamentary');
    });

    it('falls back to Oxford Union for undefined format', () => {
      expect(getFormatConfig(undefined).id).toBe('oxford-union');
    });
  });

  describe('Oxford Union Format', () => {
    it('has 10 turns', () => {
      expect(OXFORD_UNION_FORMAT.totalTurns).toBe(10);
      expect(OXFORD_UNION_FORMAT.turnSequence).toHaveLength(10);
    });

    it('starts with housemaster introduction', () => {
      expect(OXFORD_UNION_FORMAT.turnSequence[0]).toEqual({
        phase: 'introduction',
        role: 'housemaster',
      });
    });

    it('ends with housemaster verdict', () => {
      const last = OXFORD_UNION_FORMAT.turnSequence[9];
      expect(last.phase).toBe('verdict');
      expect(last.role).toBe('housemaster');
    });

    it('has housemaster in 4 of 10 turns', () => {
      const hmTurns = OXFORD_UNION_FORMAT.turnSequence.filter((s) => s.role === 'housemaster');
      expect(hmTurns).toHaveLength(4);
    });

    it('has rules array', () => {
      expect(OXFORD_UNION_FORMAT.rules.length).toBeGreaterThan(5);
    });
  });

  describe('Lincoln-Douglas Format', () => {
    it('has 8 turns', () => {
      expect(LINCOLN_DOUGLAS_FORMAT.totalTurns).toBe(8);
      expect(LINCOLN_DOUGLAS_FORMAT.turnSequence).toHaveLength(8);
    });

    it('has no housemaster turns', () => {
      const hmTurns = LINCOLN_DOUGLAS_FORMAT.turnSequence.filter((s) => s.role === 'housemaster');
      expect(hmTurns).toHaveLength(0);
    });

    it('starts with proposition opening', () => {
      expect(LINCOLN_DOUGLAS_FORMAT.turnSequence[0]).toEqual({
        phase: 'opening',
        role: 'proposition',
      });
    });

    it('has cross-examination phases', () => {
      const crossEx = LINCOLN_DOUGLAS_FORMAT.turnSequence.filter((s) => s.phase === 'cross-examination');
      expect(crossEx.length).toBeGreaterThanOrEqual(2);
    });

    it('alternates between proposition and opposition', () => {
      // Each side should have exactly 4 turns
      const propTurns = LINCOLN_DOUGLAS_FORMAT.turnSequence.filter((s) => s.role === 'proposition');
      const oppTurns = LINCOLN_DOUGLAS_FORMAT.turnSequence.filter((s) => s.role === 'opposition');
      expect(propTurns).toHaveLength(4);
      expect(oppTurns).toHaveLength(4);
    });

    it('has required format fields', () => {
      expect(LINCOLN_DOUGLAS_FORMAT.id).toBe('lincoln-douglas');
      expect(LINCOLN_DOUGLAS_FORMAT.name).toBe('Lincoln-Douglas');
      expect(LINCOLN_DOUGLAS_FORMAT.description.length).toBeGreaterThan(20);
      expect(LINCOLN_DOUGLAS_FORMAT.rules.length).toBeGreaterThan(3);
    });
  });

  describe('Parliamentary Format', () => {
    it('has 8 turns', () => {
      expect(PARLIAMENTARY_FORMAT.totalTurns).toBe(8);
      expect(PARLIAMENTARY_FORMAT.turnSequence).toHaveLength(8);
    });

    it('starts with housemaster introduction', () => {
      expect(PARLIAMENTARY_FORMAT.turnSequence[0]).toEqual({
        phase: 'introduction',
        role: 'housemaster',
      });
    });

    it('ends with housemaster verdict', () => {
      const last = PARLIAMENTARY_FORMAT.turnSequence[PARLIAMENTARY_FORMAT.turnSequence.length - 1];
      expect(last.phase).toBe('verdict');
      expect(last.role).toBe('housemaster');
    });

    it('has housemaster in exactly 2 turns', () => {
      const hmTurns = PARLIAMENTARY_FORMAT.turnSequence.filter((s) => s.role === 'housemaster');
      expect(hmTurns).toHaveLength(2);
    });

    it('has opposition closing before proposition closing (whip order)', () => {
      const closings = PARLIAMENTARY_FORMAT.turnSequence.filter((s) => s.phase === 'closing');
      expect(closings).toHaveLength(2);
      expect(closings[0].role).toBe('opposition');
      expect(closings[1].role).toBe('proposition');
    });

    it('has required format fields', () => {
      expect(PARLIAMENTARY_FORMAT.id).toBe('parliamentary');
      expect(PARLIAMENTARY_FORMAT.name).toBe('Parliamentary');
      expect(PARLIAMENTARY_FORMAT.description.length).toBeGreaterThan(20);
      expect(PARLIAMENTARY_FORMAT.rules.length).toBeGreaterThan(3);
    });
  });

  describe('Format consistency', () => {
    const allFormats = [OXFORD_UNION_FORMAT, LINCOLN_DOUGLAS_FORMAT, PARLIAMENTARY_FORMAT];

    it('all formats have unique IDs', () => {
      const ids = allFormats.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all formats have totalTurns matching turnSequence length', () => {
      for (const format of allFormats) {
        expect(format.totalTurns).toBe(format.turnSequence.length);
      }
    });

    it('all formats have valid phases in turnSequence', () => {
      const validPhases = ['introduction', 'opening', 'transition', 'rebuttal', 'cross-examination', 'closing', 'verdict'];
      for (const format of allFormats) {
        for (const step of format.turnSequence) {
          expect(validPhases).toContain(step.phase);
        }
      }
    });

    it('all formats have valid roles in turnSequence', () => {
      const validRoles = ['proposition', 'opposition', 'housemaster'];
      for (const format of allFormats) {
        for (const step of format.turnSequence) {
          expect(validRoles).toContain(step.role);
        }
      }
    });

    it('all formats have non-empty name and description', () => {
      for (const format of allFormats) {
        expect(format.name.length).toBeGreaterThan(0);
        expect(format.description.length).toBeGreaterThan(0);
      }
    });
  });
});
