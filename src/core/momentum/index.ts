import type { Debate, DebateTurn, MomentumPoint } from '../../types';

/**
 * Calculate live argument momentum for a debate.
 *
 * Returns an array of MomentumPoint values, one per completed turn.
 * The score ranges from -100 (opposition dominating) to +100 (proposition dominating).
 * Housemaster turns are scored at 0 (neutral) since they moderate rather than argue.
 *
 * The momentum is cumulative — each debater turn shifts the running score
 * based on the quality of that turn's argumentation.
 */
export function calculateMomentum(debate: Debate): MomentumPoint[] {
  const points: MomentumPoint[] = [];
  let runningScore = 0;

  for (let i = 0; i < debate.turns.length; i++) {
    const turn = debate.turns[i];
    const seq = debate.format.turnSequence[i];
    if (!seq) break;

    const role = seq.role;
    const phase = seq.phase;

    if (role === 'housemaster') {
      // Housemaster turns are neutral — they moderate, not argue
      points.push({
        turnIndex: i,
        score: runningScore,
        role: 'housemaster',
        phase,
      });
      continue;
    }

    // Calculate the quality score for this turn
    const turnStrength = scoreTurnStrength(turn, debate, i);

    // Proposition pushes positive, opposition pushes negative
    const direction = role === 'proposition' ? 1 : -1;
    const shift = turnStrength * direction;

    // Apply the shift with dampening to keep within bounds
    runningScore = clampMomentum(runningScore + shift);

    points.push({
      turnIndex: i,
      score: Math.round(runningScore * 10) / 10,
      role,
      phase,
    });
  }

  return points;
}

/**
 * Score the strength of a single turn on a 0-30 scale.
 * Higher = stronger argument. This feeds into the momentum shift.
 */
function scoreTurnStrength(turn: DebateTurn, debate: Debate, turnIndex: number): number {
  const text = turn.content;
  if (!text || text.trim().length === 0) return 0;

  let strength = 0;

  // ── Word count / depth (0-6 points) ──
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 500) strength += 6;
  else if (wordCount >= 300) strength += 5;
  else if (wordCount >= 200) strength += 4;
  else if (wordCount >= 100) strength += 3;
  else if (wordCount >= 50) strength += 1.5;

  // ── Reasoning indicators (0-6 points) ──
  const reasoningWords = [
    'because', 'therefore', 'thus', 'consequently', 'as a result',
    'this means', 'it follows', 'given that', 'since', 'hence',
    'for this reason', 'accordingly', 'this implies', 'the evidence suggests',
    'we can conclude', 'logically', 'by extension',
  ];
  const reasoningCount = countIndicators(text, reasoningWords);
  strength += Math.min(6, reasoningCount * 1.2);

  // ── Evidence citations (0-5 points) ──
  const citationCount = turn.citations?.length ?? 0;
  strength += Math.min(5, citationCount * 1.5);

  // ── Textual evidence indicators (0-4 points) ──
  const evidenceIndicators = [
    'according to', 'research shows', 'studies indicate', 'data suggests',
    'a study by', 'percent', '%', 'statistics', 'survey found',
    'published in', 'researchers found', 'analysis reveals',
  ];
  const evidenceHits = countIndicators(text, evidenceIndicators);
  strength += Math.min(4, evidenceHits * 0.8);

  // ── Engagement with opponent (0-5 points) ──
  const engagementIndicators = [
    'my opponent', 'you claim', 'you argue', 'you said', 'you suggest',
    'their argument', 'the opposing', 'counterpoint', 'in response',
    'i disagree', 'this overlooks', 'this ignores', 'fails to account',
    'however,', 'on the contrary', 'that said',
  ];
  const engagementCount = countIndicators(text, engagementIndicators);
  strength += Math.min(5, engagementCount * 1.0);

  // ── Structural quality (0-3 points) ──
  const structureWords = [
    'first', 'second', 'third', 'finally', 'moreover', 'furthermore',
    'in addition', 'in contrast', 'specifically', 'for example',
    'for instance', 'in particular',
  ];
  const structureCount = countIndicators(text, structureWords);
  strength += Math.min(3, structureCount * 0.6);

  // ── Rhetorical sophistication (0-3 points) ──
  const rhetoricalWords = [
    'imagine', 'consider', 'picture this', 'ask yourself',
    'the question is', 'what if', 'let me be clear',
    'make no mistake', 'the truth is', 'the reality is',
    'crucial', 'essential', 'fundamental', 'undeniable',
  ];
  const rhetoricalCount = countIndicators(text, rhetoricalWords);
  strength += Math.min(3, rhetoricalCount * 0.6);

  // ── Fallacy penalty (0 to -8 points) ──
  if (turn.fallacies && turn.fallacies.length > 0) {
    const fallacyPenalty = turn.fallacies.reduce((sum, f) => {
      return sum + (f.severity === 'high' ? 4 : f.severity === 'medium' ? 2.5 : 1);
    }, 0);
    strength -= Math.min(8, fallacyPenalty);
  }

  // ── Concession bonus (0-2 points) — shows intellectual honesty ──
  const concessionIndicators = [
    'i concede', 'you make a fair point', 'granted', 'i agree that',
    'you are right that', 'valid concern', 'legitimate point',
    'i acknowledge', 'fair enough',
  ];
  const concessionCount = countIndicators(text, concessionIndicators);
  if (concessionCount > 0) strength += Math.min(2, concessionCount * 0.8);

  // ── Phase bonus — rebuttals and closings that engage strongly get extra credit ──
  if (turn.phase === 'rebuttal' && engagementCount >= 2) {
    strength += 2;
  }
  if (turn.phase === 'closing' && structureCount >= 2) {
    strength += 1.5;
  }

  // Clamp to a reasonable range
  return Math.max(0, Math.min(30, strength));
}

/**
 * Count how many indicator phrases appear in the text (case-insensitive).
 */
function countIndicators(text: string, indicators: string[]): number {
  const lower = text.toLowerCase();
  return indicators.filter((w) => lower.includes(w)).length;
}

/**
 * Clamp momentum score to the -100 to +100 range with soft boundaries.
 * As the score approaches the extremes, further changes are dampened.
 */
function clampMomentum(score: number): number {
  // Soft clamp using a tanh-like curve for values beyond +/-80
  if (score > 80) {
    return 80 + (score - 80) * 0.3;
  }
  if (score < -80) {
    return -80 + (score + 80) * 0.3;
  }
  return Math.max(-100, Math.min(100, score));
}
