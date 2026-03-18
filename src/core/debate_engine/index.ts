import type {
  Debate,
  DebatePhase,
  DebaterConfig,
  DebateTurn,
  StreamChunk,
  ChatMessage,
  Citation,
} from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { OXFORD_UNION_FORMAT, TURN_SEQUENCE } from './formats';
import { parseCitations } from '../../utils/citation_parser';

/**
 * Information about the current turn in the debate cycle.
 */
export interface CurrentTurnInfo {
  /** The step index (0-9) in the 10-step cycle */
  stepIndex: number;
  /** The debate phase for this step */
  phase: DebatePhase;
  /** The role that should speak ('proposition' | 'opposition' | 'housemaster') */
  role: 'proposition' | 'opposition' | 'housemaster';
  /** The debater id assigned to this role */
  debaterId: string;
}

/**
 * Main debate orchestrator for the Oxford Union format.
 *
 * Manages the full lifecycle of a debate: initialization, turn execution
 * (with streaming), phase advancement through the fixed 10-step cycle,
 * and completion detection.
 */
export class DebateEngine {
  /**
   * Initialize a new Oxford Union debate with the given topic and debaters.
   *
   * The debaters array must contain exactly 3 members with positions:
   * 'proposition', 'opposition', and 'housemaster'. If positions are not
   * pre-assigned, pass any 3 debaters and the engine will assign them randomly
   * (one as housemaster, two as proposition/opposition).
   */
  startDebate(
    topic: string,
    debaters: DebaterConfig[]
  ): Debate {
    if (debaters.length < 3) {
      throw new Error(
        'An Oxford Union debate requires exactly 3 participants: proposition, opposition, and housemaster.'
      );
    }

    // Validate that we have all three roles assigned
    const proposition = debaters.find((d) => d.position === 'proposition');
    const opposition = debaters.find((d) => d.position === 'opposition');
    const housemaster = debaters.find((d) => d.position === 'housemaster');

    if (!proposition || !opposition || !housemaster) {
      throw new Error(
        'Debaters must include exactly one proposition, one opposition, and one housemaster.'
      );
    }

    const formatConfig = OXFORD_UNION_FORMAT;
    const now = new Date().toISOString();

    // The first step is introduction by the housemaster
    const firstStep = TURN_SEQUENCE[0];

    return {
      id: uuidv4(),
      topic,
      format: formatConfig,
      status: 'in-progress',
      debaters,
      turns: [],
      currentRound: 1,
      currentDebaterIndex: debaters.indexOf(housemaster),
      currentPhase: firstStep.phase,
      housemasterId: housemaster.id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get information about the current turn in the 10-step cycle.
   *
   * Uses the number of completed turns to determine which step we're on,
   * then resolves the debater assigned to the role for that step.
   */
  getCurrentTurnInfo(debate: Debate): CurrentTurnInfo {
    const stepIndex = debate.turns.length;

    if (stepIndex >= TURN_SEQUENCE.length) {
      // Debate is complete; return the last step info
      const lastStep = TURN_SEQUENCE[TURN_SEQUENCE.length - 1];
      return {
        stepIndex: TURN_SEQUENCE.length - 1,
        phase: lastStep.phase,
        role: lastStep.role,
        debaterId: this.getDebaterIdForRole(debate, lastStep.role),
      };
    }

    const step = TURN_SEQUENCE[stepIndex];
    return {
      stepIndex,
      phase: step.phase,
      role: step.role,
      debaterId: this.getDebaterIdForRole(debate, step.role),
    };
  }

  /**
   * Run a single debate turn with streaming.
   *
   * Yields StreamChunk objects as the model generates text. When the stream
   * completes, the full response is assembled, citations are extracted,
   * and a DebateTurn is appended to the debate.
   *
   * The engine automatically determines which debater speaks based on the
   * current position in the 10-step cycle.
   *
   * @param debate    - The current debate state (mutated in place).
   * @param streamFn  - A function that takes ChatMessage[] and returns an
   *                    AsyncGenerator<StreamChunk>. This decouples the engine
   *                    from any specific model provider.
   * @param onChunk   - Optional callback invoked for each chunk (for UI updates).
   * @returns         - AsyncGenerator yielding StreamChunks.
   */
  async *runTurn(
    debate: Debate,
    streamFn: (messages: ChatMessage[]) => AsyncGenerator<StreamChunk>,
    onChunk?: (chunk: StreamChunk) => void,
    userQuestions?: string[]
  ): AsyncGenerator<StreamChunk> {
    if (this.isDebateComplete(debate)) {
      throw new Error('Debate is already complete. All 10 turns have been played.');
    }

    const turnInfo = this.getCurrentTurnInfo(debate);
    const debater = debate.debaters.find((d) => d.id === turnInfo.debaterId);

    if (!debater) {
      throw new Error(
        `Cannot find debater for role "${turnInfo.role}" (id: ${turnInfo.debaterId})`
      );
    }

    // Update the debate's current state to reflect this turn
    debate.currentPhase = turnInfo.phase;
    debate.currentDebaterIndex = debate.debaters.indexOf(debater);

    // Build the prompt messages
    const messages = this.buildDebatePrompt(debate, debater, turnInfo, userQuestions);

    // Stream the response
    let fullContent = '';
    let thinkingContent = '';

    for await (const chunk of streamFn(messages)) {
      if (chunk.type === 'thinking') {
        thinkingContent += chunk.content;
      } else {
        fullContent += chunk.content;
      }

      if (onChunk) {
        onChunk(chunk);
      }

      yield chunk;
    }

    // Extract citations from the completed response
    const citations = this.extractCitations(fullContent);

    // Calculate the round number: turns are paired for prop/opp, so roughly
    // steps 1-3 = round 1, 4-6 = round 2, 7-9 = round 3, 10 = round 3
    const round = Math.floor(turnInfo.stepIndex / 3) + 1;

    // Create the turn record
    const turn: DebateTurn = {
      id: uuidv4(),
      debateId: debate.id,
      debaterName: debater.name,
      debaterId: debater.id,
      model: debater.model.name,
      persona: debater.persona.name,
      content: fullContent,
      ...(thinkingContent ? { thinking: thinkingContent } : {}),
      citations,
      round,
      phase: turnInfo.phase,
      timestamp: new Date().toISOString(),
    };

    // Append to debate history
    debate.turns.push(turn);
    debate.currentRound = round;
    debate.updatedAt = new Date().toISOString();
  }

  /**
   * Advance the debate to the next turn in the 10-step cycle.
   *
   * After step 10, marks the debate as completed. Returns the updated debate.
   */
  nextTurn(debate: Debate): Debate {
    if (this.isDebateComplete(debate)) {
      debate.status = 'completed';
      debate.updatedAt = new Date().toISOString();
      return debate;
    }

    // Determine the next step based on completed turns
    const nextStepIndex = debate.turns.length;

    if (nextStepIndex >= TURN_SEQUENCE.length) {
      debate.status = 'completed';
      debate.updatedAt = new Date().toISOString();
      return debate;
    }

    const nextStep = TURN_SEQUENCE[nextStepIndex];
    const nextDebaterId = this.getDebaterIdForRole(debate, nextStep.role);
    const nextDebater = debate.debaters.find((d) => d.id === nextDebaterId);

    if (nextDebater) {
      debate.currentDebaterIndex = debate.debaters.indexOf(nextDebater);
    }

    debate.currentPhase = nextStep.phase;
    debate.currentRound = Math.floor(nextStepIndex / 3) + 1;
    debate.updatedAt = new Date().toISOString();

    return debate;
  }

  /**
   * Check if the debate has completed all 10 turns.
   */
  isDebateComplete(debate: Debate): boolean {
    if (debate.status === 'completed' || debate.status === 'cancelled') {
      return true;
    }

    return debate.turns.length >= TURN_SEQUENCE.length;
  }

  /**
   * Get phase-specific instructions for the current turn.
   *
   * @param userQuestions - Optional array of audience-submitted questions to
   *                        incorporate during the cross-examination phase.
   */
  getPhaseInstructions(
    phase: DebatePhase,
    role: 'proposition' | 'opposition' | 'housemaster',
    stepIndex: number,
    topic: string,
    debate?: Debate,
    userQuestions?: string[]
  ): string {
    const stepLabel = `Step ${stepIndex + 1} of ${TURN_SEQUENCE.length}`;

    // Resolve actual debater names for the Housemaster to reference
    const propName = debate?.debaters.find(d => d.position === 'proposition')?.name ?? 'the Proposition';
    const oppName = debate?.debaters.find(d => d.position === 'opposition')?.name ?? 'the Opposition';

    const instructions: Record<DebatePhase, Record<string, string>> = {
      introduction: {
        housemaster:
          `[${stepLabel} -- Introduction]\n\n` +
          `You are the Housemaster presiding over this Oxford Union debate.\n` +
          `Announce the motion: "${topic}"\n` +
          `There are exactly TWO debaters in this debate:\n` +
          `  - PROPOSITION: ${propName} (arguing IN FAVOR of the motion)\n` +
          `  - OPPOSITION: ${oppName} (arguing AGAINST the motion)\n` +
          `Introduce these two debaters BY NAME, explain the Oxford Union format and rules briefly, ` +
          `and set the tone for a rigorous, fair, and intellectually stimulating debate. ` +
          `Do NOT invent or mention any other debaters — there are only these two plus yourself as Housemaster.`,
      },
      opening: {
        proposition:
          `[${stepLabel} -- Opening Statement (Proposition)]\n\n` +
          `Deliver your opening statement. Clearly establish your position IN FAVOR of the motion, ` +
          `present your core thesis, and preview the main arguments you will develop. ` +
          `Set a strong foundation for your case.`,
        opposition:
          `[${stepLabel} -- Opening Statement (Opposition)]\n\n` +
          `Deliver your opening statement. Clearly establish your position AGAINST the motion, ` +
          `present your counter-thesis, and preview the main arguments you will develop. ` +
          `Set a strong foundation for your case.`,
      },
      transition: {
        housemaster:
          `[${stepLabel} -- Transition]\n\n` +
          `As Housemaster, summarize the opening positions of ${propName} (Proposition) and ${oppName} (Opposition). ` +
          `Highlight the key tensions, areas of agreement and disagreement, and the central questions ` +
          `that the rebuttal phase should address. Be balanced and analytical. ` +
          `Address both debaters by name.`,
      },
      rebuttal: {
        proposition:
          `[${stepLabel} -- Rebuttal (Proposition)]\n\n` +
          `Deliver your rebuttal. Directly address and counter the Opposition's strongest arguments ` +
          `from their opening statement. Point out logical flaws, challenge their evidence, ` +
          `and reinforce your own position.`,
        opposition:
          `[${stepLabel} -- Rebuttal (Opposition)]\n\n` +
          `Deliver your rebuttal. Directly address and counter the Proposition's strongest arguments ` +
          `from their opening statement. Point out logical flaws, challenge their evidence, ` +
          `and reinforce your own position.`,
      },
      'cross-examination': {
        housemaster:
          `[${stepLabel} -- Cross-Examination]\n\n` +
          `As Housemaster, conduct a cross-examination of both sides.\n` +
          `Address questions directly to ${propName} (Proposition) and ${oppName} (Opposition) BY NAME.\n` +
          `Ask probing, challenging questions that test the strength of each side's arguments. ` +
          `Address weaknesses you've identified, push for clarification on vague claims, ` +
          `and challenge both debaters equally. Pose 3-5 pointed questions to each side.`,
      },
      closing: {
        proposition:
          `[${stepLabel} -- Closing Statement (Proposition)]\n\n` +
          `Deliver your closing statement. Summarize the key arguments from the debate, ` +
          `explain why your position has prevailed despite the Opposition's challenges, ` +
          `and leave a compelling final impression. Do NOT introduce new arguments.`,
        opposition:
          `[${stepLabel} -- Closing Statement (Opposition)]\n\n` +
          `Deliver your closing statement. Summarize the key arguments from the debate, ` +
          `explain why your position has prevailed despite the Proposition's challenges, ` +
          `and leave a compelling final impression. Do NOT introduce new arguments.`,
      },
      verdict: {
        housemaster:
          `[${stepLabel} -- Verdict]\n\n` +
          `As Housemaster, deliver your final verdict.\n` +
          `Evaluate ${propName} (Proposition) and ${oppName} (Opposition) by name.\n` +
          `Assess: strength of arguments, quality of evidence, effectiveness of rebuttals, ` +
          `and rhetorical skill. Declare a winner by name and provide clear reasoning. ` +
          `Be fair, thorough, and authoritative.`,
      },
    };

    const phaseInstructions = instructions[phase];
    let result: string;
    if (phaseInstructions && phaseInstructions[role]) {
      result = phaseInstructions[role];
    } else {
      result = `[${stepLabel}]\nProceed with your contribution to the debate.`;
    }

    // Inject audience questions during cross-examination
    if (phase === 'cross-examination' && userQuestions && userQuestions.length > 0) {
      const questionList = userQuestions.map((q) => `- ${q}`).join('\n');
      result +=
        `\n\nAdditionally, the audience has submitted the following questions. ` +
        `Incorporate at least one into your cross-examination:\n${questionList}`;
    }

    return result;
  }

  // ── Private Methods ──────────────────────────────────────────────────

  /**
   * Resolve the debater ID for a given role in the debate.
   */
  private getDebaterIdForRole(
    debate: Debate,
    role: 'proposition' | 'opposition' | 'housemaster'
  ): string {
    const debater = debate.debaters.find((d) => d.position === role);
    if (!debater) {
      throw new Error(`No debater found with position "${role}" in the debate.`);
    }
    return debater.id;
  }

  /**
   * Construct the full chat message array (system + history + turn instructions)
   * for the current turn.
   */
  private buildDebatePrompt(
    debate: Debate,
    debater: DebaterConfig,
    turnInfo: CurrentTurnInfo,
    userQuestions?: string[]
  ): ChatMessage[] {
    // System prompt -- persona + format + role context
    const systemContent = this.buildSystemContent(debate, debater, turnInfo);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
    ];

    // Include prior turns as assistant/user messages for conversational context.
    for (const turn of debate.turns) {
      if (turn.debaterId === debater.id) {
        messages.push({
          role: 'assistant',
          content: `[${formatPhaseName(turn.phase)}, Step ${this.stepIndexForTurn(debate, turn) + 1}]\n${turn.content}`,
        });
      } else {
        const speaker = debate.debaters.find((d) => d.id === turn.debaterId);
        const speakerLabel = speaker
          ? `${speaker.name} [${speaker.position.toUpperCase()}]`
          : turn.debaterName;
        messages.push({
          role: 'user',
          content: `[${speakerLabel} -- ${formatPhaseName(turn.phase)}, Step ${this.stepIndexForTurn(debate, turn) + 1}]\n${turn.content}`,
        });
      }
    }

    // Final user message with the turn-specific instructions
    const turnInstructions = this.getPhaseInstructions(
      turnInfo.phase,
      turnInfo.role,
      turnInfo.stepIndex,
      debate.topic,
      debate,
      userQuestions
    );
    messages.push({ role: 'user', content: turnInstructions });

    return messages;
  }

  /**
   * Build the system prompt content for a debater in the Oxford Union format.
   */
  private buildSystemContent(
    debate: Debate,
    debater: DebaterConfig,
    turnInfo: CurrentTurnInfo
  ): string {
    const sections: string[] = [];
    const persona = debater.persona;
    const format = debate.format;

    // ── Identity ──
    sections.push(
      `You are "${persona.name}" -- ${persona.tagline}\n` +
      `Background: ${persona.background}\n` +
      `Expertise: ${persona.expertise.join(', ')}\n` +
      `Rhetorical style: ${persona.rhetorical_style}\n` +
      `Ideological perspective: ${persona.ideological_leanings}`
    );

    // ── Role & Topic ──
    const roleDescriptions: Record<string, string> = {
      proposition: 'arguing IN FAVOR of the motion',
      opposition: 'arguing AGAINST the motion',
      housemaster: 'presiding as HOUSEMASTER -- the neutral moderator and judge',
    };

    sections.push(
      `DEBATE TOPIC (MOTION): "${debate.topic}"\n` +
      `YOUR ROLE: You are ${roleDescriptions[debater.position]}.`
    );

    // ── Format ──
    sections.push(
      `DEBATE FORMAT: ${format.name}\n` +
      `Description: ${format.description}\n` +
      `Total Steps: ${format.totalTurns}\n` +
      `Format Rules:\n${format.rules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}`
    );

    // ── Argumentation Style (for proposition/opposition only) ──
    if (debater.position !== 'housemaster') {
      const evidenceMap: Record<string, string> = {
        heavy: 'Ground every major claim in specific evidence, data, statistics, or named sources.',
        moderate: 'Support your key claims with evidence or examples.',
        light: 'Focus on reasoning and narrative. Cite evidence when particularly impactful.',
      };

      const emotionMap: Record<string, string> = {
        heavy: 'Use emotionally compelling language, vivid stories, and rhetorical questions.',
        moderate: 'Balance analytical arguments with appropriate emotional resonance.',
        minimal: 'Keep your tone analytical and measured. Persuade through logic and evidence.',
      };

      sections.push(
        `ARGUMENTATION STYLE:\n` +
        `- Evidence: ${evidenceMap[persona.argumentation_preferences.evidence_weight] ?? evidenceMap['moderate']}\n` +
        `- Emotion: ${emotionMap[persona.argumentation_preferences.emotional_appeals] ?? emotionMap['moderate']}\n` +
        `- Concessions: ${persona.argumentation_preferences.concession_willingness === 'high'
          ? 'Freely acknowledge valid opposing points to build credibility.'
          : persona.argumentation_preferences.concession_willingness === 'low'
            ? 'Rarely concede. Vigorously challenge every opposing claim.'
            : 'Concede minor points when warranted but hold firm on core arguments.'}\n` +
        `- Humor: ${persona.argumentation_preferences.humor}`
      );
    } else {
      // Housemaster-specific guidance
      sections.push(
        `HOUSEMASTER CONDUCT:\n` +
        `- Remain strictly neutral and impartial throughout.\n` +
        `- Be authoritative but fair in managing the debate.\n` +
        `- During cross-examination, challenge BOTH sides equally.\n` +
        `- In the verdict, base your decision solely on the quality of argumentation, ` +
        `evidence, and rhetorical effectiveness demonstrated during the debate.`
      );
    }

    // ── Global Rules ──
    sections.push(
      'IMPORTANT RULES:\n' +
      '- Stay in character. Never break the fourth wall or mention being an AI.\n' +
      '- Engage directly with the arguments presented in the debate.\n' +
      '- Structure your response clearly with paragraphs.\n' +
      '- Keep your response focused and proportional to the debate phase.\n' +
      '- When citing sources, use markdown links [Title](URL) or bracketed references [1].'
    );

    return sections.join('\n\n');
  }

  /**
   * Determine the step index for a given turn based on its position in the turns array.
   */
  private stepIndexForTurn(debate: Debate, turn: DebateTurn): number {
    const index = debate.turns.indexOf(turn);
    return index >= 0 ? index : 0;
  }

  /**
   * Extract citations from completed response text.
   */
  private extractCitations(text: string): Citation[] {
    return parseCitations(text);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatPhaseName(phase: DebatePhase): string {
  switch (phase) {
    case 'introduction':
      return 'Introduction';
    case 'opening':
      return 'Opening';
    case 'transition':
      return 'Transition';
    case 'rebuttal':
      return 'Rebuttal';
    case 'cross-examination':
      return 'Cross-Examination';
    case 'closing':
      return 'Closing';
    case 'verdict':
      return 'Verdict';
  }
}

export { DEBATE_FORMATS, getFormatConfig, OXFORD_UNION_FORMAT, TURN_SEQUENCE } from './formats';
