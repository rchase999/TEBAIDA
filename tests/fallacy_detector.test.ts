import { describe, it, expect } from 'vitest';
import { FallacyDetector } from '../src/core/fallacy_detector/index';

describe('FallacyDetector', () => {
  const detector = new FallacyDetector();

  describe('detectFallacies', () => {
    it('detects ad hominem', () => {
      const text = "You're just an idiot who doesn't understand economics.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'ad_hominem')).toBe(true);
    });

    it('detects straw man', () => {
      const text = "So what you're really saying is that we should let everyone do whatever they want with no rules at all.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'straw_man')).toBe(true);
    });

    it('detects false dichotomy', () => {
      const text = "You're either with us on this policy or you're against the welfare of children.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'false_dichotomy')).toBe(true);
    });

    it('detects slippery slope', () => {
      const text = "If we allow this regulation, then next they'll ban all free speech, and eventually we'll live in a totalitarian state.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'slippery_slope')).toBe(true);
    });

    it('detects appeal to emotion', () => {
      const text = "Think of the children! How could you sleep at night knowing innocent children are suffering?";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'appeal_to_emotion')).toBe(true);
    });

    it('detects bandwagon', () => {
      const text = "Everyone knows that this is the right approach. The vast majority of people agree with this position.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'bandwagon')).toBe(true);
    });

    it('returns empty array for clean argument', () => {
      const text = "Based on the evidence from three peer-reviewed studies, the policy reduces emissions by 15%. Therefore, the data supports implementation.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies).toHaveLength(0);
    });

    it('does not duplicate fallacy types', () => {
      const text = "You're an idiot. You clearly don't understand anything. You're too biased to see the truth.";
      const fallacies = detector.detectFallacies(text);
      const types = fallacies.map(f => f.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it('includes passage in detection', () => {
      const text = "So what you're really saying is that nobody should ever pay taxes.";
      const fallacies = detector.detectFallacies(text);
      const strawMan = fallacies.find(f => f.type === 'straw_man');
      expect(strawMan?.passage).toBeTruthy();
      expect(strawMan?.passage.length).toBeGreaterThan(10);
    });

    it('detects hasty generalization', () => {
      const text = "I met one rude person from that country, so all people from there must be rude. One example proves that all of them are like that.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'hasty_generalization')).toBe(true);
    });

    it('detects false cause (post hoc)', () => {
      const text = "Ever since they introduced that policy, crime rates have been rising. This clearly caused the increase in crime.";
      const fallacies = detector.detectFallacies(text);
      expect(fallacies.some(f => f.type === 'false_cause')).toBe(true);
    });
  });

  describe('getSupportedFallacies', () => {
    it('returns all fallacy types including new ones', () => {
      const supported = detector.getSupportedFallacies();
      expect(supported.length).toBeGreaterThanOrEqual(11);
      expect(supported.every(f => f.type && f.name && f.description)).toBe(true);
      expect(supported.some(f => f.type === 'hasty_generalization')).toBe(true);
      expect(supported.some(f => f.type === 'false_cause')).toBe(true);
    });
  });
});
