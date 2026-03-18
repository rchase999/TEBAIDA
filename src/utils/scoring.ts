import type { Debate, DebateScore, DebateTurn } from '../types';

/**
 * Analyze a completed debate and produce scores for each debater.
 *
 * This is a heuristic scoring system based on textual analysis of debate turns.
 * For AI-powered judging, use the judge prompt from prompt_builder.ts.
 */
export function calculateScores(debate: Debate): DebateScore[] {
  return debate.debaters.map((debater) => {
    const turns = debate.turns.filter((t) => t.debaterId === debater.id);

    const argumentation = scoreArgumentation(turns);
    const evidence = scoreEvidence(turns);
    const rebuttal = scoreRebuttal(turns, debate);
    const rhetoric = scoreRhetoric(turns);
    const overall = Math.round(
      (argumentation * 0.3 + evidence * 0.2 + rebuttal * 0.25 + rhetoric * 0.25) * 10
    ) / 10;

    const notes = generateNotes(debater.name, turns, {
      argumentation,
      evidence,
      rebuttal,
      rhetoric,
      overall,
    });

    return {
      debaterId: debater.id,
      debaterName: debater.name,
      categories: {
        argumentation,
        evidence,
        rebuttal,
        rhetoric,
        overall,
      },
      notes,
    };
  });
}

/**
 * Format a scorecard for display.
 */
export function formatScorecard(scores: DebateScore[]): string {
  if (scores.length === 0) return 'No scores available.';

  const lines: string[] = [];

  lines.push('========================================');
  lines.push('           DEBATE SCORECARD');
  lines.push('========================================');
  lines.push('');

  // Determine winner
  const sorted = [...scores].sort(
    (a, b) => b.categories.overall - a.categories.overall
  );

  for (const score of sorted) {
    lines.push(`  ${score.debaterName}`);
    lines.push(`  ${'─'.repeat(36)}`);
    lines.push(`  Argumentation:  ${formatBar(score.categories.argumentation)}  ${score.categories.argumentation}/10`);
    lines.push(`  Evidence:       ${formatBar(score.categories.evidence)}  ${score.categories.evidence}/10`);
    lines.push(`  Rebuttal:       ${formatBar(score.categories.rebuttal)}  ${score.categories.rebuttal}/10`);
    lines.push(`  Rhetoric:       ${formatBar(score.categories.rhetoric)}  ${score.categories.rhetoric}/10`);
    lines.push(`  ${'─'.repeat(36)}`);
    lines.push(`  OVERALL:        ${formatBar(score.categories.overall)}  ${score.categories.overall}/10`);
    lines.push('');
    lines.push(`  Notes: ${score.notes}`);
    lines.push('');
  }

  // Winner announcement
  if (sorted.length >= 2) {
    const margin = sorted[0].categories.overall - sorted[1].categories.overall;
    if (margin > 0.5) {
      lines.push(`  WINNER: ${sorted[0].debaterName} (by ${margin.toFixed(1)} points)`);
    } else if (margin > 0) {
      lines.push(`  NARROW WINNER: ${sorted[0].debaterName} (by ${margin.toFixed(1)} points)`);
    } else {
      lines.push('  RESULT: Draw — both debaters performed equally.');
    }
  }

  lines.push('');
  lines.push('========================================');

  return lines.join('\n');
}

// ── Scoring Functions ──────────────────────────────────────────────────

/**
 * Score argumentation quality (1-10).
 * Looks at: argument structure, claim count, use of reasoning indicators,
 * logical connectors, and response length as a proxy for depth.
 */
function scoreArgumentation(turns: DebateTurn[]): number {
  if (turns.length === 0) return 1;

  let totalScore = 0;
  let turnCount = 0;

  for (const turn of turns) {
    const text = turn.content;
    let turnScore = 5; // baseline

    // Structural indicators — paragraphs show organization
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
    if (paragraphs.length >= 4) turnScore += 1;
    else if (paragraphs.length >= 2) turnScore += 0.5;

    // Reasoning indicators
    const reasoningWords = [
      'because', 'therefore', 'thus', 'consequently', 'as a result',
      'this means', 'it follows', 'given that', 'since', 'hence',
      'for this reason', 'accordingly', 'this implies', 'the evidence suggests',
    ];
    const reasoningCount = reasoningWords.filter((w) =>
      text.toLowerCase().includes(w)
    ).length;
    turnScore += Math.min(2, reasoningCount * 0.4);

    // Logical structure words
    const structureWords = [
      'first', 'second', 'third', 'finally', 'moreover', 'furthermore',
      'in addition', 'however', 'on the other hand', 'in contrast',
      'specifically', 'for example', 'for instance', 'in particular',
    ];
    const structureCount = structureWords.filter((w) =>
      text.toLowerCase().includes(w)
    ).length;
    turnScore += Math.min(1.5, structureCount * 0.3);

    // Depth — very short responses penalized
    if (text.length < 200) turnScore -= 1.5;
    else if (text.length < 400) turnScore -= 0.5;
    else if (text.length > 1500) turnScore += 0.5;

    // Fallacy penalty
    if (turn.fallacies && turn.fallacies.length > 0) {
      const fallacyPenalty = turn.fallacies.reduce((sum, f) => {
        return sum + (f.severity === 'high' ? 1.5 : f.severity === 'medium' ? 1 : 0.5);
      }, 0);
      turnScore -= Math.min(3, fallacyPenalty);
    }

    totalScore += Math.max(1, Math.min(10, turnScore));
    turnCount++;
  }

  return Math.round((totalScore / turnCount) * 10) / 10;
}

/**
 * Score evidence quality (1-10).
 * Looks at: citation count, citation diversity, source quality.
 */
function scoreEvidence(turns: DebateTurn[]): number {
  if (turns.length === 0) return 1;

  let totalScore = 0;
  let turnCount = 0;

  for (const turn of turns) {
    let turnScore = 4; // baseline

    const citations = turn.citations ?? [];

    // Citation count
    if (citations.length >= 3) turnScore += 2;
    else if (citations.length >= 1) turnScore += 1;
    else turnScore -= 1;

    // Source quality
    for (const citation of citations) {
      switch (citation.sourceType) {
        case 'peer-reviewed':
          turnScore += 0.8;
          break;
        case 'government':
          turnScore += 0.7;
          break;
        case 'news':
          turnScore += 0.3;
          break;
        case 'blog':
          turnScore += 0.1;
          break;
        case 'social-media':
          turnScore -= 0.2;
          break;
      }

      // Verified bonus
      if (citation.verified) turnScore += 0.3;
    }

    // Text-level evidence indicators (even without formal citations)
    const evidenceIndicators = [
      'according to', 'research shows', 'studies indicate', 'data suggests',
      'a study by', 'percent', '%', 'statistics', 'survey found',
      'published in', 'researchers found', 'analysis reveals',
    ];
    const evidenceHits = evidenceIndicators.filter((w) =>
      turn.content.toLowerCase().includes(w)
    ).length;
    turnScore += Math.min(1.5, evidenceHits * 0.3);

    totalScore += Math.max(1, Math.min(10, turnScore));
    turnCount++;
  }

  return Math.round((totalScore / turnCount) * 10) / 10;
}

/**
 * Score rebuttal quality (1-10).
 * Looks at: direct engagement with opponent's arguments, counter-argument indicators.
 */
function scoreRebuttal(turns: DebateTurn[], debate: Debate): number {
  if (turns.length === 0) return 1;

  let totalScore = 0;
  let turnCount = 0;

  // Find the debater's opponent turns for reference
  const debaterId = turns[0]?.debaterId;
  const opponentTurns = debate.turns.filter((t) => t.debaterId !== debaterId);

  for (const turn of turns) {
    let turnScore = 5; // baseline

    const text = turn.content.toLowerCase();

    // Engagement indicators — signs of responding to opponent
    const engagementIndicators = [
      'my opponent', 'you claim', 'you argue', 'you said', 'you suggest',
      'their argument', 'the opposing', 'counterpoint', 'in response',
      'i disagree', 'this overlooks', 'this ignores', 'fails to account',
      'however,', 'but this', 'while this may', 'granted,', 'although',
      'on the contrary', 'that said', 'not quite', 'not so',
    ];
    const engagementCount = engagementIndicators.filter((w) =>
      text.includes(w)
    ).length;
    turnScore += Math.min(2.5, engagementCount * 0.5);

    // Check if they reference specific content from opponent turns
    let contentOverlap = 0;
    for (const oppTurn of opponentTurns) {
      // Extract key phrases (3+ word sequences) from opponent turns
      const oppWords = oppTurn.content.toLowerCase().split(/\s+/);
      for (let i = 0; i < oppWords.length - 2; i++) {
        const trigram = `${oppWords[i]} ${oppWords[i + 1]} ${oppWords[i + 2]}`;
        if (trigram.length > 10 && text.includes(trigram)) {
          contentOverlap++;
          if (contentOverlap >= 3) break;
        }
      }
      if (contentOverlap >= 3) break;
    }
    turnScore += Math.min(1.5, contentOverlap * 0.5);

    // Concession indicators (positive for rebuttal quality — shows sophistication)
    const concessionIndicators = [
      'i concede', 'you make a fair point', 'granted', 'i agree that',
      'you are right that', 'valid concern', 'legitimate point',
      'i acknowledge', 'fair enough',
    ];
    const concessionCount = concessionIndicators.filter((w) =>
      text.includes(w)
    ).length;
    if (concessionCount > 0) turnScore += 0.5;

    // Phase-appropriate scoring — rebuttals in rebuttal phases get a bonus for being on-topic
    if (turn.phase === 'rebuttal' && engagementCount >= 2) {
      turnScore += 0.5;
    }

    totalScore += Math.max(1, Math.min(10, turnScore));
    turnCount++;
  }

  return Math.round((totalScore / turnCount) * 10) / 10;
}

/**
 * Score rhetoric quality (1-10).
 * Looks at: vocabulary diversity, sentence variation, rhetorical devices,
 * readability, and persuasive techniques.
 */
function scoreRhetoric(turns: DebateTurn[]): number {
  if (turns.length === 0) return 1;

  let totalScore = 0;
  let turnCount = 0;

  for (const turn of turns) {
    const text = turn.content;
    let turnScore = 5; // baseline

    // Vocabulary diversity (type-token ratio on a sample)
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
    if (words.length > 20) {
      const uniqueWords = new Set(words);
      const ttr = uniqueWords.size / words.length;
      if (ttr > 0.7) turnScore += 1;
      else if (ttr > 0.55) turnScore += 0.5;
      else if (ttr < 0.35) turnScore -= 0.5;
    }

    // Sentence length variation
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
    if (sentences.length >= 3) {
      const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
      const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance =
        lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) /
        lengths.length;
      const stdDev = Math.sqrt(variance);

      // Good variation is desirable
      if (stdDev > 8) turnScore += 0.5;
      else if (stdDev < 2) turnScore -= 0.5; // monotonous sentence length
    }

    // Rhetorical device indicators
    const rhetoricalDevices = [
      // Rhetorical questions
      { pattern: /(?:^|\.\s+)[A-Z][^.?]*\?/g, weight: 0.4 },
      // Parallel structure (repetition at start of sentences)
      { pattern: /(?:^|\n)(\w+\s+\w+).*\n\1/gm, weight: 0.5 },
      // Emphatic language
      { pattern: /\b(crucial|essential|fundamental|vital|critical|paramount|undeniable)\b/gi, weight: 0.3 },
      // Transition mastery
      { pattern: /\b(nevertheless|nonetheless|notwithstanding|conversely|paradoxically|remarkably)\b/gi, weight: 0.3 },
      // Tricolon / list of three
      { pattern: /\b\w+,\s+\w+,\s+and\s+\w+\b/g, weight: 0.3 },
    ];

    for (const device of rhetoricalDevices) {
      const matches = text.match(device.pattern);
      if (matches && matches.length > 0) {
        turnScore += Math.min(0.8, matches.length * device.weight);
      }
    }

    // Persuasive framing
    const persuasiveIndicators = [
      'imagine', 'consider', 'picture this', 'ask yourself',
      'the question is', 'what if', 'let me be clear',
      'make no mistake', 'the truth is', 'the reality is',
    ];
    const persuasiveCount = persuasiveIndicators.filter((w) =>
      text.toLowerCase().includes(w)
    ).length;
    turnScore += Math.min(1, persuasiveCount * 0.3);

    totalScore += Math.max(1, Math.min(10, turnScore));
    turnCount++;
  }

  return Math.round((totalScore / turnCount) * 10) / 10;
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Generate human-readable notes summarizing a debater's performance.
 */
function generateNotes(
  name: string,
  turns: DebateTurn[],
  categories: { argumentation: number; evidence: number; rebuttal: number; rhetoric: number; overall: number }
): string {
  const notes: string[] = [];

  if (turns.length === 0) {
    return `${name} did not participate in the debate.`;
  }

  // Find strongest and weakest categories
  const catEntries = [
    { label: 'argumentation', score: categories.argumentation },
    { label: 'evidence', score: categories.evidence },
    { label: 'rebuttal', score: categories.rebuttal },
    { label: 'rhetoric', score: categories.rhetoric },
  ].sort((a, b) => b.score - a.score);

  const strongest = catEntries[0];
  const weakest = catEntries[catEntries.length - 1];

  // Overall assessment
  if (categories.overall >= 8) {
    notes.push(`${name} delivered an exceptional performance.`);
  } else if (categories.overall >= 6.5) {
    notes.push(`${name} performed well overall.`);
  } else if (categories.overall >= 5) {
    notes.push(`${name} delivered a solid but unremarkable performance.`);
  } else {
    notes.push(`${name} had room for improvement.`);
  }

  // Strength
  if (strongest.score >= 6) {
    notes.push(`Strongest area was ${strongest.label} (${strongest.score}/10).`);
  }

  // Weakness
  if (weakest.score < strongest.score - 1.5) {
    notes.push(`Weakest area was ${weakest.label} (${weakest.score}/10).`);
  }

  // Fallacy count
  const totalFallacies = turns.reduce(
    (sum, t) => sum + (t.fallacies?.length ?? 0),
    0
  );
  if (totalFallacies > 0) {
    notes.push(
      `${totalFallacies} logical fallac${totalFallacies === 1 ? 'y' : 'ies'} detected.`
    );
  }

  return notes.join(' ');
}

/**
 * Render a simple text bar for a 1-10 score.
 */
function formatBar(score: number): string {
  const filled = Math.round(score);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
