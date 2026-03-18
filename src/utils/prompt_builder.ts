import type {
  Persona,
  DebatePhase,
  Debate,
} from '../types';

// ── Types ───────────────────────────────────────────────────────────────

type DebatePosition = 'proposition' | 'opposition' | 'housemaster';

/**
 * The fixed 10-turn Oxford Union debate cycle.
 * Index 0–9 maps to turns 1–10.
 */
export const OXFORD_TURN_SEQUENCE: readonly {
  phase: DebatePhase;
  role: DebatePosition;
}[] = [
  { phase: 'introduction',       role: 'housemaster'  },  // Turn 1
  { phase: 'opening',            role: 'proposition'   },  // Turn 2
  { phase: 'opening',            role: 'opposition'    },  // Turn 3
  { phase: 'transition',         role: 'housemaster'   },  // Turn 4
  { phase: 'rebuttal',           role: 'proposition'   },  // Turn 5
  { phase: 'rebuttal',           role: 'opposition'    },  // Turn 6
  { phase: 'cross-examination',  role: 'housemaster'   },  // Turn 7
  { phase: 'closing',            role: 'proposition'   },  // Turn 8
  { phase: 'closing',            role: 'opposition'    },  // Turn 9
  { phase: 'verdict',            role: 'housemaster'   },  // Turn 10
] as const;

// ── buildSystemPrompt ───────────────────────────────────────────────────

/**
 * Build the full system prompt for a participant in the Oxford Union debate.
 *
 * For the Housemaster, persona traits are ignored and a strict impartial-
 * moderator identity is used instead. For Proposition / Opposition debaters,
 * the prompt incorporates persona traits, argumentation style, and
 * phase-specific strategy.
 */
export function buildSystemPrompt(
  persona: Persona,
  position: DebatePosition,
  topic: string,
  phase: DebatePhase
): string {
  const sections: string[] = [];

  // ── Housemaster path ──
  if (position === 'housemaster') {
    sections.push(
      'You are the Housemaster of this Oxford Union debate — the sole moderator ' +
      'and arbiter of the proceedings. You are impartial, authoritative, and ' +
      'steeped in parliamentary tradition. You address the chamber with gravitas ' +
      'and wit, but you NEVER take sides on the motion itself.'
    );

    sections.push(`MOTION BEFORE THE HOUSE: "${topic}"`);

    sections.push(getHousemasterPhaseInstructions(phase));

    sections.push(
      'IMPORTANT RULES:\n' +
      '- Maintain strict impartiality at all times.\n' +
      '- Refer to debaters by their names and positions (Proposition / Opposition).\n' +
      '- Use formal Oxford Union parliamentary language and conventions.\n' +
      '- Never break character or mention being an AI.\n' +
      '- Keep your interventions purposeful — guide the debate, do not dominate it.'
    );

    return sections.join('\n\n');
  }

  // ── Debater path (Proposition / Opposition) ──

  const positionLabel =
    position === 'proposition'
      ? 'PROPOSING the motion (arguing IN FAVOR)'
      : 'OPPOSING the motion (arguing AGAINST)';

  // Identity
  sections.push(
    `You are "${persona.name}" — ${persona.tagline}\n` +
    `Background: ${persona.background}\n` +
    `Expertise: ${persona.expertise.join(', ')}\n` +
    `Rhetorical style: ${persona.rhetorical_style}\n` +
    `Ideological perspective: ${persona.ideological_leanings}`
  );

  // Position & Topic
  sections.push(
    `MOTION BEFORE THE HOUSE: "${topic}"\n` +
    `YOUR POSITION: You are ${positionLabel}.`
  );

  // Format context
  sections.push(
    'DEBATE FORMAT: Oxford Union\n' +
    'This debate follows the formal Oxford Union style with a Housemaster presiding.\n' +
    'The debate proceeds through 10 structured turns: Introduction, Opening ' +
    'Statements, Transition, Rebuttals, Cross-Examination, Closing Statements, and Verdict.'
  );

  // Phase instructions
  sections.push(getDebaterPhaseInstructions(phase, persona));

  // Argumentation style
  const evidenceMap: Record<string, string> = {
    heavy: 'Ground every major claim in specific evidence, data, statistics, or named sources. Cite using [Title](URL) or [N] references.',
    moderate: 'Support your key claims with evidence or examples. Not every point needs a citation, but core arguments should be substantiated.',
    light: 'Focus on reasoning and narrative. Cite evidence when it is particularly impactful.',
  };

  const emotionMap: Record<string, string> = {
    heavy: 'Use emotionally compelling language, vivid stories, moral framing, and rhetorical questions.',
    moderate: 'Balance analytical arguments with appropriate emotional resonance and relatable examples.',
    minimal: 'Keep your tone analytical and measured. Persuade through logic and evidence, not emotion.',
  };

  sections.push(
    'ARGUMENTATION STYLE:\n' +
    `- Evidence: ${evidenceMap[persona.argumentation_preferences.evidence_weight] ?? evidenceMap['moderate']}\n` +
    `- Emotion: ${emotionMap[persona.argumentation_preferences.emotional_appeals] ?? emotionMap['moderate']}\n` +
    `- Concessions: ${persona.argumentation_preferences.concession_willingness === 'high'
      ? 'Freely acknowledge valid opposing points to build credibility.'
      : persona.argumentation_preferences.concession_willingness === 'low'
        ? 'Rarely concede. Vigorously challenge every opposing claim.'
        : 'Concede minor points when warranted but hold firm on core arguments.'}\n` +
    `- Humor: ${persona.argumentation_preferences.humor}`
  );

  // Global rules
  sections.push(
    'IMPORTANT RULES:\n' +
    '- Stay in character. Never break the fourth wall or mention being an AI.\n' +
    '- Engage directly with opposing arguments. Do not ignore them.\n' +
    '- Structure your response clearly with paragraphs.\n' +
    '- Keep your response focused and proportional to the debate phase.\n' +
    '- When citing sources, use markdown links [Title](URL) or bracketed references [1].\n' +
    '- Address the Housemaster and the chamber using Oxford Union conventions.'
  );

  return sections.join('\n\n');
}

// ── buildTurnPrompt ─────────────────────────────────────────────────────

/**
 * Build the user-message prompt for a specific turn in the debate.
 *
 * Includes the full debate history so far and turn-specific instructions
 * tailored to each of the 10 Oxford Union turns.
 */
export function buildTurnPrompt(debate: Debate, debaterIndex: number): string {
  const debater = debate.debaters[debaterIndex];
  const sections: string[] = [];

  // ── Debate History ──
  if (debate.turns.length > 0) {
    sections.push('=== DEBATE HISTORY ===');

    for (const turn of debate.turns) {
      const speaker = debate.debaters.find((d) => d.id === turn.debaterId);
      const speakerName = speaker?.name ?? turn.debaterName;
      const positionTag = speaker
        ? ` [${formatPosition(speaker.position)}]`
        : '';

      sections.push(
        `--- ${speakerName}${positionTag} (${formatPhase(turn.phase)}) ---\n${turn.content}`
      );
    }

    sections.push('=== END DEBATE HISTORY ===\n');
  }

  // ── Turn Instructions ──
  const turnNumber = debate.turns.length + 1;

  sections.push(
    `It is now YOUR TURN to speak.\n` +
    `You are: ${debater.name} (${formatPosition(debater.position)})\n` +
    `Current phase: ${formatPhase(debate.currentPhase)}\n` +
    `Turn ${turnNumber} of 10`
  );

  // ── Turn-specific guidance (keyed to the 10-turn cycle) ──
  const turnIndex = debate.turns.length; // 0-based index of the upcoming turn
  sections.push(getTurnGuidance(turnIndex, debate));

  // ── Length guidance ──
  sections.push(getLengthGuidance(debate.currentPhase, debater.position));

  return sections.join('\n');
}

// ── buildJudgePrompt ────────────────────────────────────────────────────

/**
 * Build a prompt for an external AI judge to evaluate the completed debate.
 * (Separate from the Housemaster's in-debate verdict.)
 */
export function buildJudgePrompt(debate: Debate): string {
  const sections: string[] = [];

  sections.push(
    'You are an expert debate judge with deep knowledge of formal debate, rhetoric, ' +
    'logic, and argumentation. You are evaluating the following Oxford Union debate.\n'
  );

  // Filter to only the debaters (not the housemaster) for scoring
  const scorableDebaters = debate.debaters.filter(
    (d) => d.position === 'proposition' || d.position === 'opposition'
  );

  sections.push(
    `MOTION: "${debate.topic}"\n` +
    `FORMAT: Oxford Union (10-turn structured debate with Housemaster)\n` +
    `DEBATERS:\n` +
    scorableDebaters
      .map((d) => `  - ${d.name} (${formatPosition(d.position)}) — Persona: ${d.persona.name}`)
      .join('\n')
  );

  // Full transcript
  sections.push('\n=== FULL DEBATE TRANSCRIPT ===');

  for (const turn of debate.turns) {
    const speaker = debate.debaters.find((d) => d.id === turn.debaterId);
    const speakerName = speaker?.name ?? turn.debaterName;
    const positionTag = speaker ? ` [${formatPosition(speaker.position)}]` : '';

    sections.push(
      `\n--- ${speakerName}${positionTag} (${formatPhase(turn.phase)}) ---\n${turn.content}`
    );
  }

  sections.push('\n=== END TRANSCRIPT ===\n');

  // Scoring instructions
  sections.push(
    'Evaluate each debater (Proposition and Opposition only — NOT the Housemaster) on the following criteria (score 1-10 for each):\n' +
    '1. ARGUMENTATION: Strength, clarity, and logical soundness of arguments.\n' +
    '2. EVIDENCE: Quality, relevance, and proper use of evidence and citations.\n' +
    '3. REBUTTAL: Effectiveness in addressing and countering opposing arguments.\n' +
    '4. RHETORIC: Persuasiveness, eloquence, and effective use of rhetorical techniques.\n' +
    '5. OVERALL: Holistic assessment of debate performance.\n'
  );

  sections.push(
    'Respond in the following JSON format (no other text):\n' +
    '```json\n' +
    '[\n' +
    '  {\n' +
    '    "debaterId": "<id>",\n' +
    '    "debaterName": "<name>",\n' +
    '    "categories": {\n' +
    '      "argumentation": <1-10>,\n' +
    '      "evidence": <1-10>,\n' +
    '      "rebuttal": <1-10>,\n' +
    '      "rhetoric": <1-10>,\n' +
    '      "overall": <1-10>\n' +
    '    },\n' +
    '    "notes": "<2-3 sentence assessment>"\n' +
    '  }\n' +
    ']\n' +
    '```'
  );

  return sections.join('\n');
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Phase-specific instructions for the Housemaster's system prompt.
 */
function getHousemasterPhaseInstructions(phase: DebatePhase): string {
  switch (phase) {
    case 'introduction':
      return (
        'CURRENT PHASE: Introduction\n' +
        'Instructions: You are opening the debate. Formally announce the motion before ' +
        'the House, introduce each debater by name and position (Proposition and Opposition), ' +
        'briefly explain the rules and structure of the debate (opening statements, rebuttals, ' +
        'cross-examination, closing statements, then your verdict), and invite the Proposition ' +
        'to deliver their opening statement. Set a tone of intellectual seriousness and fairness.'
      );
    case 'transition':
      return (
        'CURRENT PHASE: Transition\n' +
        'Instructions: Both sides have delivered their opening statements. Provide a brief, ' +
        'impartial summary of each side\'s opening position. Highlight the key tensions and ' +
        'points of disagreement that have emerged. Identify the central questions the debate ' +
        'must resolve. Then invite the Proposition to deliver their rebuttal.'
      );
    case 'cross-examination':
      return (
        'CURRENT PHASE: Cross-Examination\n' +
        'Instructions: Both sides have delivered their rebuttals. Now conduct a cross-examination ' +
        'by posing probing questions to BOTH sides. Ask 2-3 sharp, substantive questions directed ' +
        'at the Proposition and 2-3 at the Opposition. Target weaknesses in their arguments, ' +
        'unexamined assumptions, missing evidence, or logical gaps. The questions should be ' +
        'challenging but fair. Conclude by inviting the Proposition to deliver their closing statement.'
      );
    case 'verdict':
      return (
        'CURRENT PHASE: Verdict\n' +
        'Instructions: The debate has concluded. Deliver a thorough and authoritative verdict.\n' +
        '- Summarize the strongest arguments made by each side.\n' +
        '- Evaluate the quality of evidence, reasoning, and rhetoric from both debaters.\n' +
        '- Identify which arguments were effectively rebutted and which stood unchallenged.\n' +
        '- Declare a winner (Proposition or Opposition) with detailed reasoning.\n' +
        '- The verdict should be substantive (400-600 words) and demonstrate careful weighing ' +
        'of all arguments presented.'
      );
    // Housemaster does not speak during these phases, but handle gracefully
    case 'opening':
    case 'rebuttal':
    case 'closing':
      return (
        `CURRENT PHASE: ${formatPhase(phase)}\n` +
        'Note: This phase is normally handled by the debaters. If called upon, ' +
        'provide brief procedural commentary.'
      );
  }
}

/**
 * Phase-specific instructions for debaters' system prompts.
 */
function getDebaterPhaseInstructions(phase: DebatePhase, persona: Persona): string {
  switch (phase) {
    case 'opening':
      return (
        'CURRENT PHASE: Opening Statement\n' +
        `Strategy: ${persona.debate_behavior.opening_strategy}\n` +
        'Instructions: Deliver your opening statement to the House. Clearly establish your ' +
        'position on the motion, preview your main arguments, and set the rhetorical tone. ' +
        'Address the Housemaster and the chamber. Make a compelling first impression.'
      );
    case 'rebuttal':
      return (
        'CURRENT PHASE: Rebuttal\n' +
        `Strategy: ${persona.debate_behavior.rebuttal_strategy}\n` +
        'Instructions: Directly address and counter your opponent\'s strongest arguments from ' +
        'their opening statement. Point out logical flaws, challenge their evidence, and defend ' +
        'your own position against any attacks. Reinforce your strongest points.'
      );
    case 'closing':
      return (
        'CURRENT PHASE: Closing Statement\n' +
        `Strategy: ${persona.debate_behavior.closing_strategy}\n` +
        'Instructions: Deliver your closing statement. The Housemaster has posed cross-examination ' +
        'questions — address any directed at you. Summarize the key arguments, explain why your ' +
        'side has prevailed, and leave the House with a compelling final impression. Do NOT ' +
        'introduce entirely new arguments.'
      );
    // Debaters do not speak during these phases, but handle gracefully
    case 'introduction':
    case 'transition':
    case 'cross-examination':
    case 'verdict':
      return (
        `CURRENT PHASE: ${formatPhase(phase)}\n` +
        'Note: This phase is normally handled by the Housemaster. If called upon, ' +
        'respond appropriately and stay in character.'
      );
  }
}

/**
 * Generate turn-specific guidance for the user prompt, keyed to each of the
 * 10 Oxford Union turns.
 */
function getTurnGuidance(turnIndex: number, debate: Debate): string {
  switch (turnIndex) {
    // Turn 1: Housemaster Introduction
    case 0:
      return (
        'You are opening this Oxford Union debate. Announce the motion, introduce the ' +
        'two debaters by name and position, outline the debate structure, and invite the ' +
        'Proposition to begin.'
      );

    // Turn 2: Proposition Opening Statement
    case 1:
      return (
        'The Housemaster has opened the debate and invited you to speak. Deliver your ' +
        'opening statement. Establish your position on the motion clearly, preview your ' +
        'main arguments, and make a strong first impression on the House.'
      );

    // Turn 3: Opposition Opening Statement
    case 2: {
      const propOpening = debate.turns.find(
        (t) => t.phase === 'opening' && debate.debaters.find((d) => d.id === t.debaterId)?.position === 'proposition'
      );
      return (
        'The Proposition has delivered their opening statement.' +
        (propOpening
          ? ' You have heard their arguments.'
          : '') +
        ' Now deliver YOUR opening statement. Establish your opposition to the motion, ' +
        'preview your main counter-arguments, and begin to challenge the Proposition\'s framing.'
      );
    }

    // Turn 4: Housemaster Transition
    case 3:
      return (
        'Both sides have delivered their opening statements. Provide an impartial summary ' +
        'of each side\'s position. Highlight the key tensions, points of agreement, and ' +
        'areas of disagreement. Then invite the Proposition to deliver their rebuttal.'
      );

    // Turn 5: Proposition Rebuttal
    case 4:
      return (
        'The Housemaster has summarized both positions and invited you to rebut. ' +
        'Directly address the Opposition\'s strongest arguments from their opening statement. ' +
        'Challenge their evidence and reasoning. Reinforce your own position and ' +
        'present any new supporting evidence.'
      );

    // Turn 6: Opposition Rebuttal
    case 5:
      return (
        'The Proposition has delivered their rebuttal. Now deliver YOUR rebuttal. ' +
        'Directly address the Proposition\'s arguments — both from their opening and their rebuttal. ' +
        'Expose weaknesses, counter their evidence, and strengthen your own case.'
      );

    // Turn 7: Housemaster Cross-Examination
    case 6:
      return (
        'Both sides have completed their rebuttals. Conduct a cross-examination by posing ' +
        'probing questions to BOTH the Proposition and the Opposition. Ask 2-3 sharp questions ' +
        'to each side, targeting weaknesses, unexamined assumptions, or logical gaps. ' +
        'Then invite the Proposition to deliver their closing statement.'
      );

    // Turn 8: Proposition Closing Statement
    case 7:
      return (
        'The Housemaster has conducted the cross-examination and posed questions to both sides. ' +
        'Deliver your closing statement. Address any questions the Housemaster directed at you. ' +
        'Summarize the strongest arguments in your favor, explain why the Proposition has prevailed, ' +
        'and leave the House with a powerful final impression. Do NOT introduce new arguments.'
      );

    // Turn 9: Opposition Closing Statement
    case 8:
      return (
        'The Proposition has delivered their closing statement. Now deliver YOUR closing statement. ' +
        'Address any questions the Housemaster directed at you. Summarize the debate from your ' +
        'perspective, explain why the Opposition has the stronger case, and make your final appeal ' +
        'to the House. Do NOT introduce new arguments.'
      );

    // Turn 10: Housemaster Verdict
    case 9:
      return (
        'The debate has concluded. Both sides have made their closing statements. ' +
        'Deliver your verdict. Summarize the strongest arguments from each side, evaluate ' +
        'the quality of evidence and reasoning, identify which arguments were effectively ' +
        'rebutted and which stood unchallenged, and declare a winner (Proposition or Opposition) ' +
        'with detailed reasoning. Be thorough and authoritative.'
      );

    default:
      return (
        'The structured debate has concluded. Provide additional commentary if appropriate.'
      );
  }
}

/**
 * Return length guidance based on phase and role.
 */
function getLengthGuidance(phase: DebatePhase, position: DebatePosition): string {
  if (position === 'housemaster') {
    switch (phase) {
      case 'introduction':
        return '\nAim for a formal but concise introduction (roughly 200-350 words).';
      case 'transition':
        return '\nKeep your transition summary focused (roughly 200-300 words).';
      case 'cross-examination':
        return '\nPose clear, pointed questions. Aim for roughly 250-400 words.';
      case 'verdict':
        return '\nDeliver a thorough verdict (roughly 400-600 words).';
      default:
        return '\nKeep your remarks brief and procedural.';
    }
  }

  // Debater length guidance
  switch (phase) {
    case 'opening':
      return '\nAim for a substantial but focused opening statement (roughly 300-500 words).';
    case 'rebuttal':
      return '\nAim for a focused, hard-hitting rebuttal (roughly 300-500 words).';
    case 'closing':
      return '\nAim for a concise, powerful closing statement (roughly 250-400 words).';
    default:
      return '\nAim for a focused response (roughly 300-500 words).';
  }
}

/**
 * Format a phase enum value for display.
 */
export function formatPhase(phase: DebatePhase): string {
  switch (phase) {
    case 'introduction':
      return 'Introduction';
    case 'opening':
      return 'Opening Statement';
    case 'transition':
      return 'Transition';
    case 'rebuttal':
      return 'Rebuttal';
    case 'cross-examination':
      return 'Cross-Examination';
    case 'closing':
      return 'Closing Statement';
    case 'verdict':
      return 'Verdict';
  }
}

/**
 * Format a position for display.
 */
export function formatPosition(position: DebatePosition): string {
  switch (position) {
    case 'proposition':
      return 'PROPOSITION';
    case 'opposition':
      return 'OPPOSITION';
    case 'housemaster':
      return 'HOUSEMASTER';
  }
}
