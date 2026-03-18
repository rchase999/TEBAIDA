import type { Debate, DebateTurn, DebatePhase } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HighlightType =
  | 'strongest-argument'
  | 'best-rebuttal'
  | 'most-devastating-question'
  | 'decisive-moment'
  | 'key-quote';

export interface DebateHighlight {
  type: HighlightType;
  title: string;
  debaterName: string;
  role: 'proposition' | 'opposition' | 'housemaster';
  quote: string;
  phase: DebatePhase;
  turnIndex: number;
}

// ---------------------------------------------------------------------------
// Scoring helpers (aligned with utils/scoring.ts heuristics)
// ---------------------------------------------------------------------------

/** Score how strong the argumentation is in a single turn (higher = better). */
function scoreArgumentStrength(turn: DebateTurn): number {
  const text = turn.content;
  let score = 0;

  // Reasoning indicators
  const reasoningWords = [
    'because', 'therefore', 'thus', 'consequently', 'as a result',
    'this means', 'it follows', 'given that', 'since', 'hence',
    'for this reason', 'accordingly', 'this implies', 'the evidence suggests',
  ];
  score += reasoningWords.filter((w) => text.toLowerCase().includes(w)).length * 0.5;

  // Structural depth
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
  score += Math.min(3, paragraphs.length * 0.5);

  // Evidence indicators
  const evidenceIndicators = [
    'according to', 'research shows', 'studies indicate', 'data suggests',
    'a study by', 'percent', '%', 'statistics', 'published in',
  ];
  score += evidenceIndicators.filter((w) => text.toLowerCase().includes(w)).length * 0.4;

  // Logical structure
  const structureWords = [
    'first', 'second', 'third', 'finally', 'moreover', 'furthermore',
    'in addition', 'specifically', 'for example',
  ];
  score += structureWords.filter((w) => text.toLowerCase().includes(w)).length * 0.3;

  // Depth bonus
  if (text.length > 1500) score += 1;
  else if (text.length > 800) score += 0.5;

  // Fallacy penalty
  if (turn.fallacies) {
    score -= turn.fallacies.length * 0.8;
  }

  return score;
}

/** Score how well a turn engages as a rebuttal (higher = better). */
function scoreRebuttalStrength(turn: DebateTurn, opponentTurns: DebateTurn[]): number {
  const text = turn.content.toLowerCase();
  let score = 0;

  // Direct engagement indicators
  const engagementIndicators = [
    'my opponent', 'you claim', 'you argue', 'you said', 'you suggest',
    'their argument', 'the opposing', 'counterpoint', 'in response',
    'i disagree', 'this overlooks', 'this ignores', 'fails to account',
    'however,', 'but this', 'while this may', 'granted,', 'although',
    'on the contrary', 'that said', 'not quite', 'not so',
  ];
  score += engagementIndicators.filter((w) => text.includes(w)).length * 0.6;

  // Check content overlap with opponent turns (quoting / engaging specific points)
  for (const oppTurn of opponentTurns) {
    const oppWords = oppTurn.content.toLowerCase().split(/\s+/);
    let overlap = 0;
    for (let i = 0; i < oppWords.length - 2; i++) {
      const trigram = `${oppWords[i]} ${oppWords[i + 1]} ${oppWords[i + 2]}`;
      if (trigram.length > 10 && text.includes(trigram)) {
        overlap++;
        if (overlap >= 5) break;
      }
    }
    score += Math.min(3, overlap * 0.6);
  }

  // Concession indicators (shows sophistication)
  const concessionIndicators = [
    'i concede', 'you make a fair point', 'granted', 'i agree that',
    'valid concern', 'legitimate point', 'i acknowledge',
  ];
  if (concessionIndicators.some((w) => text.includes(w))) {
    score += 1;
  }

  // Phase relevance bonus
  if (turn.phase === 'rebuttal') score += 1;

  return score;
}

/** Score how much momentum shifted at a particular turn. */
function scoreMomentumShift(turn: DebateTurn, turnIndex: number, allTurns: DebateTurn[]): number {
  let score = 0;
  const text = turn.content.toLowerCase();

  // Dramatic rhetorical devices
  const dramaticIndicators = [
    'make no mistake', 'the truth is', 'the reality is', 'let me be clear',
    'fundamentally', 'crucial', 'undeniable', 'devastating', 'critical',
    'game-changing', 'transformative', 'irrefutable',
  ];
  score += dramaticIndicators.filter((w) => text.includes(w)).length * 0.5;

  // Rhetorical questions
  const questions = text.match(/[^.!?]*\?/g);
  if (questions && questions.length > 0) {
    score += Math.min(2, questions.length * 0.4);
  }

  // Length and depth as proxy for substantial contribution
  if (turn.content.length > 1200) score += 1;

  // Later turns get a slight bonus (closing/rebuttal phases matter more for momentum)
  if (turn.phase === 'rebuttal') score += 1;
  if (turn.phase === 'closing') score += 1.5;

  // Evidence-backed arguments shift momentum more
  if (turn.citations && turn.citations.length > 0) {
    score += Math.min(2, turn.citations.length * 0.5);
  }

  // Opponent fallacies in prior turn suggest a momentum opportunity
  if (turnIndex > 0) {
    const prevTurn = allTurns[turnIndex - 1];
    if (prevTurn?.fallacies && prevTurn.fallacies.length > 0) {
      score += 1;
    }
  }

  return score;
}

/** Extract the best single sentence from a turn's content. */
function extractBestSentence(text: string, maxLength: number): string {
  // Split into sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length <= maxLength);

  if (sentences.length === 0) {
    // Fallback: truncate the content
    return text.length > maxLength
      ? text.slice(0, maxLength - 3).replace(/\s+\S*$/, '') + '...'
      : text;
  }

  // Score each sentence for impact
  let bestSentence = sentences[0];
  let bestScore = -1;

  for (const sentence of sentences) {
    let score = 0;
    const lower = sentence.toLowerCase();

    // Emphatic language
    const emphaticWords = [
      'crucial', 'essential', 'fundamental', 'vital', 'critical', 'undeniable',
      'must', 'cannot', 'unacceptable', 'remarkable', 'devastating', 'powerful',
      'transformative', 'irrefutable', 'clear', 'obvious', 'indisputable',
    ];
    score += emphaticWords.filter((w) => lower.includes(w)).length * 1.5;

    // Reasoning connectors
    const reasoning = ['because', 'therefore', 'thus', 'consequently', 'this means'];
    score += reasoning.filter((w) => lower.includes(w)).length * 1;

    // Persuasive framing
    const persuasive = ['imagine', 'consider', 'the truth is', 'make no mistake', 'the reality'];
    score += persuasive.filter((w) => lower.includes(w)).length * 1.2;

    // Rhetorical questions get a boost
    if (sentence.endsWith('?')) score += 0.8;

    // Moderate length preferred (not too short, not too long)
    if (sentence.length > 40 && sentence.length < 150) score += 0.5;

    // Avoid meta-sentences
    const metaPhrases = ['in this debate', 'i will argue', 'let me begin', 'as i mentioned', 'i would like to'];
    if (metaPhrases.some((m) => lower.includes(m))) score -= 2;

    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  }

  return bestSentence;
}

/** Extract the sharpest question from a cross-examination turn. */
function extractSharpestQuestion(text: string, maxLength: number): string {
  const questions = text
    .split(/(?<=[?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.endsWith('?') && s.length > 15 && s.length <= maxLength);

  if (questions.length === 0) {
    // Fallback: return best sentence
    return extractBestSentence(text, maxLength);
  }

  let bestQuestion = questions[0];
  let bestScore = -1;

  for (const q of questions) {
    let score = 0;
    const lower = q.toLowerCase();

    // Probing starters
    const probing = ['how', 'why', 'what', 'can you', 'could you', 'do you', 'would you'];
    score += probing.filter((w) => lower.startsWith(w)).length * 1.5;

    // Challenge language
    const challenge = [
      'explain', 'justify', 'reconcile', 'account for', 'evidence',
      'contradiction', 'inconsistency', 'ignore', 'overlook', 'fail',
    ];
    score += challenge.filter((w) => lower.includes(w)).length * 1;

    // Moderate length preferred
    if (q.length > 30 && q.length < 160) score += 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestQuestion = q;
    }
  }

  return bestQuestion;
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Analyze a completed debate and extract the most notable highlights.
 *
 * Returns an array of 3-5 `DebateHighlight` entries covering the strongest
 * argument, best rebuttal, most devastating question, decisive moment,
 * and key quote from the entire debate.
 */
export function analyzeHighlights(debate: Debate): DebateHighlight[] {
  const highlights: DebateHighlight[] = [];
  const turns = debate.turns ?? [];

  if (turns.length === 0) return highlights;

  // Build lookup: debaterId -> position
  const positionMap = new Map<string, 'proposition' | 'opposition' | 'housemaster'>();
  for (const d of debate.debaters) {
    positionMap.set(d.id, d.position);
  }

  // Filter to only debater turns (exclude housemaster for argument scoring)
  const debaterTurns = turns.filter((t) => {
    const pos = positionMap.get(t.debaterId);
    return pos === 'proposition' || pos === 'opposition';
  });

  // ── 1. Strongest Argument ──────────────────────────────────────────────
  if (debaterTurns.length > 0) {
    let bestTurn: DebateTurn | null = null;
    let bestScore = -Infinity;
    let bestIndex = 0;

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const pos = positionMap.get(turn.debaterId);
      if (pos !== 'proposition' && pos !== 'opposition') continue;

      const score = scoreArgumentStrength(turn);
      if (score > bestScore) {
        bestScore = score;
        bestTurn = turn;
        bestIndex = i;
      }
    }

    if (bestTurn) {
      highlights.push({
        type: 'strongest-argument',
        title: 'Strongest Argument',
        debaterName: bestTurn.debaterName,
        role: positionMap.get(bestTurn.debaterId) ?? 'proposition',
        quote: extractBestSentence(bestTurn.content, 200),
        phase: bestTurn.phase,
        turnIndex: bestIndex,
      });
    }
  }

  // ── 2. Best Rebuttal ──────────────────────────────────────────────────
  const rebuttalTurns = debaterTurns.filter(
    (t) => t.phase === 'rebuttal' || t.phase === 'closing',
  );

  if (rebuttalTurns.length > 0) {
    let bestTurn: DebateTurn | null = null;
    let bestScore = -Infinity;
    let bestIndex = 0;

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const pos = positionMap.get(turn.debaterId);
      if (pos !== 'proposition' && pos !== 'opposition') continue;
      if (turn.phase !== 'rebuttal' && turn.phase !== 'closing') continue;

      // Get opponent turns that happened before this one
      const opponentTurns = turns.slice(0, i).filter((t) => {
        const tPos = positionMap.get(t.debaterId);
        return tPos && tPos !== pos && tPos !== 'housemaster';
      });

      const score = scoreRebuttalStrength(turn, opponentTurns);
      if (score > bestScore) {
        bestScore = score;
        bestTurn = turn;
        bestIndex = i;
      }
    }

    if (bestTurn) {
      highlights.push({
        type: 'best-rebuttal',
        title: 'Best Rebuttal',
        debaterName: bestTurn.debaterName,
        role: positionMap.get(bestTurn.debaterId) ?? 'proposition',
        quote: extractBestSentence(bestTurn.content, 200),
        phase: bestTurn.phase,
        turnIndex: bestIndex,
      });
    }
  }

  // ── 3. Most Devastating Question ──────────────────────────────────────
  // The cross-examination phase is run by the housemaster
  const crossExamTurns = turns.filter((t) => t.phase === 'cross-examination');

  if (crossExamTurns.length > 0) {
    // Pick the cross-examination turn with the most probing questions
    let bestTurn = crossExamTurns[0];
    let bestIndex = turns.indexOf(bestTurn);

    // If there are multiple cross-exam turns, pick the one with the most questions
    for (const ceTurn of crossExamTurns) {
      const qCount = (ceTurn.content.match(/\?/g) ?? []).length;
      const bestQCount = (bestTurn.content.match(/\?/g) ?? []).length;
      if (qCount > bestQCount) {
        bestTurn = ceTurn;
        bestIndex = turns.indexOf(ceTurn);
      }
    }

    highlights.push({
      type: 'most-devastating-question',
      title: 'Most Devastating Question',
      debaterName: bestTurn.debaterName,
      role: positionMap.get(bestTurn.debaterId) ?? 'housemaster',
      quote: extractSharpestQuestion(bestTurn.content, 200),
      phase: bestTurn.phase,
      turnIndex: bestIndex,
    });
  }

  // ── 4. Decisive Moment ────────────────────────────────────────────────
  if (debaterTurns.length > 0) {
    let bestTurn: DebateTurn | null = null;
    let bestScore = -Infinity;
    let bestIndex = 0;

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const pos = positionMap.get(turn.debaterId);
      if (pos !== 'proposition' && pos !== 'opposition') continue;

      const score = scoreMomentumShift(turn, i, turns);
      if (score > bestScore) {
        bestScore = score;
        bestTurn = turn;
        bestIndex = i;
      }
    }

    if (bestTurn) {
      // Avoid duplicate with strongest argument (if same turn index)
      const alreadyUsed = highlights.some(
        (h) => h.turnIndex === bestIndex && h.type === 'strongest-argument',
      );

      if (!alreadyUsed) {
        highlights.push({
          type: 'decisive-moment',
          title: 'Decisive Moment',
          debaterName: bestTurn.debaterName,
          role: positionMap.get(bestTurn.debaterId) ?? 'proposition',
          quote: extractBestSentence(bestTurn.content, 200),
          phase: bestTurn.phase,
          turnIndex: bestIndex,
        });
      } else {
        // Fall back to the second-best momentum turn
        let secondBestTurn: DebateTurn | null = null;
        let secondBestScore = -Infinity;
        let secondBestIndex = 0;

        for (let i = 0; i < turns.length; i++) {
          if (i === bestIndex) continue;
          const turn = turns[i];
          const pos = positionMap.get(turn.debaterId);
          if (pos !== 'proposition' && pos !== 'opposition') continue;

          const score = scoreMomentumShift(turn, i, turns);
          if (score > secondBestScore) {
            secondBestScore = score;
            secondBestTurn = turn;
            secondBestIndex = i;
          }
        }

        if (secondBestTurn) {
          highlights.push({
            type: 'decisive-moment',
            title: 'Decisive Moment',
            debaterName: secondBestTurn.debaterName,
            role: positionMap.get(secondBestTurn.debaterId) ?? 'proposition',
            quote: extractBestSentence(secondBestTurn.content, 200),
            phase: secondBestTurn.phase,
            turnIndex: secondBestIndex,
          });
        }
      }
    }
  }

  // ── 5. Key Quote ──────────────────────────────────────────────────────
  // Find the single most impactful sentence across all debater turns
  if (debaterTurns.length > 0) {
    let bestQuote = '';
    let bestQuoteScore = -Infinity;
    let bestTurn: DebateTurn | null = null;
    let bestIndex = 0;

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const pos = positionMap.get(turn.debaterId);
      if (pos !== 'proposition' && pos !== 'opposition') continue;

      const sentences = turn.content
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20 && s.length <= 200);

      for (const sentence of sentences) {
        let score = 0;
        const lower = sentence.toLowerCase();

        // Impact words
        const impactWords = [
          'crucial', 'essential', 'fundamental', 'undeniable', 'powerful',
          'devastating', 'transformative', 'irrefutable', 'remarkable', 'compelling',
          'truth', 'justice', 'freedom', 'dignity', 'rights', 'humanity',
        ];
        score += impactWords.filter((w) => lower.includes(w)).length * 1.5;

        // Persuasive framing
        const persuasive = [
          'imagine', 'consider', 'the truth is', 'make no mistake',
          'the question is', 'the reality is', 'let me be clear',
        ];
        score += persuasive.filter((w) => lower.includes(w)).length * 1.2;

        // Rhetorical questions
        if (sentence.endsWith('?')) score += 0.8;

        // Ideal length (punchy but substantive)
        if (sentence.length >= 40 && sentence.length <= 150) score += 1;

        // Bonus for quotable phrasing (short sentences with strong language)
        if (sentence.length <= 100 && score >= 1.5) score += 0.5;

        // Avoid meta-sentences
        const meta = ['in this debate', 'i will argue', 'let me begin', 'i would like to'];
        if (meta.some((m) => lower.includes(m))) score -= 3;

        // Avoid sentences that are already used as quotes in other highlights
        const alreadyUsed = highlights.some((h) => h.quote === sentence);
        if (alreadyUsed) score -= 5;

        if (score > bestQuoteScore) {
          bestQuoteScore = score;
          bestQuote = sentence;
          bestTurn = turn;
          bestIndex = i;
        }
      }
    }

    if (bestTurn && bestQuote) {
      highlights.push({
        type: 'key-quote',
        title: 'Key Quote',
        debaterName: bestTurn.debaterName,
        role: positionMap.get(bestTurn.debaterId) ?? 'proposition',
        quote: bestQuote,
        phase: bestTurn.phase,
        turnIndex: bestIndex,
      });
    }
  }

  return highlights;
}

/**
 * Get the best single quote from the debate for use in a share card.
 * Returns a concise (max ~150 chars) quote string.
 */
export function getBestQuoteForCard(debate: Debate): string {
  const highlights = analyzeHighlights(debate);

  // Prefer key-quote, then strongest-argument
  const keyQuote = highlights.find((h) => h.type === 'key-quote');
  if (keyQuote && keyQuote.quote.length <= 150) return keyQuote.quote;

  const strongest = highlights.find((h) => h.type === 'strongest-argument');
  if (strongest && strongest.quote.length <= 150) return strongest.quote;

  // Fallback: truncate the key quote
  if (keyQuote) {
    return keyQuote.quote.slice(0, 147).replace(/\s+\S*$/, '') + '...';
  }

  // Last resort: extract from the first debater turn
  const debaterTurns = (debate.turns ?? []).filter((t) => {
    const debater = debate.debaters.find((d) => d.id === t.debaterId);
    return debater?.position === 'proposition' || debater?.position === 'opposition';
  });

  if (debaterTurns.length > 0) {
    return extractBestSentence(debaterTurns[0].content, 150);
  }

  return '';
}
