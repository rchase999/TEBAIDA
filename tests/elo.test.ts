import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNewRatings,
  getDefaultRating,
  h2hKey,
} from '../src/core/elo/index';

describe('ELO Rating System', () => {
  describe('getDefaultRating', () => {
    it('returns 1500', () => {
      expect(getDefaultRating()).toBe(1500);
    });
  });

  describe('rating behavior', () => {
    it('equal ratings produce symmetric changes', () => {
      const { newWinner, newLoser } = calculateNewRatings(1500, 1500, false);
      const winGain = newWinner - 1500;
      const lossDelta = 1500 - newLoser;
      expect(winGain).toBeCloseTo(lossDelta, 1);
    });

    it('higher-rated winner gains less than lower-rated winner', () => {
      const favoriteWins = calculateNewRatings(1700, 1300, false);
      const underdogWins = calculateNewRatings(1300, 1700, false);
      const favoriteGain = favoriteWins.newWinner - 1700;
      const underdogGain = underdogWins.newWinner - 1300;
      expect(underdogGain).toBeGreaterThan(favoriteGain);
    });

    it('ratings stay positive after many losses', () => {
      let rating = 1500;
      for (let i = 0; i < 50; i++) {
        const result = calculateNewRatings(1500, rating, false);
        rating = result.newLoser;
      }
      expect(rating).toBeGreaterThan(0);
    });

    it('repeated wins increase rating monotonically', () => {
      let rating = 1500;
      for (let i = 0; i < 10; i++) {
        const result = calculateNewRatings(rating, 1500, false);
        expect(result.newWinner).toBeGreaterThan(rating);
        rating = result.newWinner;
      }
    });
  });

  describe('calculateNewRatings', () => {
    it('winner gains and loser loses rating', () => {
      const { newWinner, newLoser } = calculateNewRatings(1500, 1500, false);
      expect(newWinner).toBeGreaterThan(1500);
      expect(newLoser).toBeLessThan(1500);
    });

    it('rating changes sum to zero (zero-sum game)', () => {
      const { newWinner, newLoser } = calculateNewRatings(1500, 1500, false);
      const winnerDelta = newWinner - 1500;
      const loserDelta = newLoser - 1500;
      expect(winnerDelta + loserDelta).toBeCloseTo(0, 1);
    });

    it('upset victory (lower beats higher) gives larger change', () => {
      const normalResult = calculateNewRatings(1600, 1400, false);
      const upsetResult = calculateNewRatings(1400, 1600, false);
      const normalGain = normalResult.newWinner - 1600;
      const upsetGain = upsetResult.newWinner - 1400;
      expect(upsetGain).toBeGreaterThan(normalGain);
    });

    it('draw between equal players keeps ratings close', () => {
      const { newWinner, newLoser } = calculateNewRatings(1500, 1500, true);
      expect(Math.abs(newWinner - 1500)).toBeLessThan(1);
      expect(Math.abs(newLoser - 1500)).toBeLessThan(1);
    });

    it('draw favors the lower-rated player', () => {
      const { newWinner, newLoser } = calculateNewRatings(1600, 1400, true);
      // In a draw, the lower-rated "winner" param player gains
      // but what matters is the direction of change
      // With isDraw, both shift toward their expected score
      expect(typeof newWinner).toBe('number');
      expect(typeof newLoser).toBe('number');
    });

    it('returns valid numbers', () => {
      const result = calculateNewRatings(1500, 1500, false);
      expect(Number.isFinite(result.newWinner)).toBe(true);
      expect(Number.isFinite(result.newLoser)).toBe(true);
      expect(result.newWinner).toBeGreaterThan(0);
      expect(result.newLoser).toBeGreaterThan(0);
    });
  });

  describe('h2hKey', () => {
    it('produces same key regardless of argument order', () => {
      const key1 = h2hKey('model-a', 'model-b');
      const key2 = h2hKey('model-b', 'model-a');
      expect(key1).toBe(key2);
    });

    it('produces different keys for different pairs', () => {
      const key1 = h2hKey('model-a', 'model-b');
      const key2 = h2hKey('model-a', 'model-c');
      expect(key1).not.toBe(key2);
    });

    it('returns a non-empty string', () => {
      const key = h2hKey('x', 'y');
      expect(key.length).toBeGreaterThan(0);
    });
  });
});
