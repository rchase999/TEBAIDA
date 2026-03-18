import type { Persona, UniversalPersonaPrompt, DebateTurn } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * User profile summary used for UPP generation.
 */
export interface UserProfile {
  preferredTopics: string[];
  expertiseLevel: string;
  debatePreferences: string;
  interactionStyle: string;
}

/**
 * Universal Persona Prompt (UPP) engine.
 *
 * UPP is a portable persona format that captures a persona's state, accumulated
 * debate positions, and plain-language instructions that can be interpreted by
 * any AI model — enabling cross-model persona portability.
 */
export class UPPEngine {
  /**
   * Generate a UPP from a persona, its debate history, and the user's profile.
   */
  generateUPP(
    persona: Persona,
    debateHistory: DebateTurn[],
    userProfile: UserProfile
  ): UniversalPersonaPrompt {
    // Extract accumulated positions from debate history
    const accumulatedPositions = this.extractPositions(debateHistory, persona.id);

    // Build user-relationship notes from debate patterns
    const relationshipNotes = this.buildRelationshipNotes(debateHistory, persona.id);

    // Generate the plain-language instructions
    const instructions = this.generateInstructions(persona, userProfile);

    return {
      upp_version: '1.0.0',
      generated_at: new Date().toISOString(),
      user_profile: {
        preferred_topics: userProfile.preferredTopics,
        expertise_level: userProfile.expertiseLevel,
        debate_preferences: userProfile.debatePreferences,
        interaction_style: userProfile.interactionStyle,
      },
      persona_state: {
        name: persona.name,
        accumulated_positions: accumulatedPositions,
        user_relationship_notes: relationshipNotes,
      },
      instructions_for_any_model: instructions,
    };
  }

  /**
   * Apply UPP data back to a persona, updating it with accumulated state.
   * Returns a new Persona object with the UPP data merged in.
   */
  importUPP(upp: UniversalPersonaPrompt): Partial<Persona> & { _uppMeta: UniversalPersonaPrompt } {
    // We cannot fully reconstruct a Persona from a UPP alone, because UPP is
    // a portable subset.  Return the information we can extract so callers
    // can merge it with an existing Persona.
    return {
      name: upp.persona_state.name,
      // Attach the full UPP so callers can access accumulated_positions etc.
      _uppMeta: upp,
    };
  }

  /**
   * Save a UPP to a JSON file.
   */
  exportToFile(upp: UniversalPersonaPrompt, filePath: string): void {
    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, JSON.stringify(upp, null, 2), 'utf-8');
  }

  /**
   * Load and validate a UPP from a JSON file.
   */
  parseUPPFile(filePath: string): UniversalPersonaPrompt {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`UPP file not found: ${resolved}`);
    }

    const raw = fs.readFileSync(resolved, 'utf-8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in UPP file: ${resolved}`);
    }

    this.validateUPP(parsed);
    return parsed as UniversalPersonaPrompt;
  }

  /**
   * Generate plain-language instructions that any AI model can follow to
   * reproduce this persona's behavior.
   */
  generateInstructions(persona: Persona, userProfile: UserProfile): string {
    const sections: string[] = [];

    sections.push(
      `You are embodying the persona "${persona.name}" — ${persona.tagline}.`
    );

    sections.push(
      `\nCORE IDENTITY:\n` +
      `Background: ${persona.background}\n` +
      `Areas of expertise: ${persona.expertise.join(', ')}.\n` +
      `Ideological perspective: ${persona.ideological_leanings}.`
    );

    sections.push(
      `\nCOMMUNICATION STYLE:\n` +
      `Rhetorical approach: ${persona.rhetorical_style}\n` +
      `Humor: ${persona.argumentation_preferences.humor}`
    );

    // Map evidence weight to instruction
    const evidenceMap: Record<string, string> = {
      heavy: 'Always ground your arguments in specific data, studies, and verifiable evidence.',
      moderate: 'Support your main claims with evidence and examples; not every point needs a citation.',
      light: 'Prioritize narrative and reasoning; use evidence selectively for maximum impact.',
    };

    const emotionMap: Record<string, string> = {
      heavy: 'Use emotionally resonant language, vivid stories, and moral framing throughout.',
      moderate: 'Balance analytical rigor with appropriate emotional connection.',
      minimal: 'Maintain an analytical, measured tone. Persuade through logic, not emotion.',
    };

    const concessionMap: Record<string, string> = {
      high: 'Freely acknowledge strong opposing points — your credibility benefits from intellectual honesty.',
      moderate: 'Concede minor points when warranted but hold firm on core arguments.',
      low: 'Rarely concede. Challenge opposing claims vigorously and defend your position tenaciously.',
    };

    sections.push(
      `\nARGUMENTATION GUIDELINES:\n` +
      `Evidence: ${evidenceMap[persona.argumentation_preferences.evidence_weight] ?? evidenceMap['moderate']}\n` +
      `Emotion: ${emotionMap[persona.argumentation_preferences.emotional_appeals] ?? emotionMap['moderate']}\n` +
      `Concessions: ${concessionMap[persona.argumentation_preferences.concession_willingness] ?? concessionMap['moderate']}`
    );

    sections.push(
      `\nDEBATE STRATEGY:\n` +
      `When opening: ${persona.debate_behavior.opening_strategy}\n` +
      `When rebutting: ${persona.debate_behavior.rebuttal_strategy}\n` +
      `When closing: ${persona.debate_behavior.closing_strategy}`
    );

    // Tailor to user profile
    sections.push(
      `\nUSER CONTEXT:\n` +
      `The user's expertise level is "${userProfile.expertiseLevel}". ` +
      (userProfile.expertiseLevel === 'beginner'
        ? 'Explain complex concepts clearly and avoid jargon.'
        : userProfile.expertiseLevel === 'expert'
          ? 'You can use technical language and assume deep background knowledge.'
          : 'Use accessible language but don\'t oversimplify.') +
      `\nThe user prefers a "${userProfile.interactionStyle}" interaction style. ` +
      `Their debate preferences: ${userProfile.debatePreferences}.`
    );

    sections.push(
      `\nIMPORTANT RULES:\n` +
      `- Stay in character at all times.\n` +
      `- Never reference being an AI, LLM, or language model.\n` +
      `- Engage directly with opposing arguments — never ignore them.\n` +
      `- When citing sources, use markdown links or bracketed references.\n` +
      `- Keep responses focused, well-structured, and appropriate in length for the debate format.`
    );

    return sections.join('\n');
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * Extract the positions a persona has taken across debate turns.
   */
  private extractPositions(debateHistory: DebateTurn[], personaId: string): string[] {
    const positions: string[] = [];
    const turns = debateHistory.filter((t) => t.debaterId === personaId);

    for (const turn of turns) {
      // Extract the first substantive sentence as a position summary.
      // We look for sentences that contain claim-like language.
      const sentences = turn.content
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.length > 30);

      if (sentences.length > 0) {
        // Take up to 2 key sentences per turn
        const keySentences = sentences.slice(0, 2);
        for (const sentence of keySentences) {
          const trimmed = sentence.trim();
          if (trimmed.length > 0 && !positions.includes(trimmed)) {
            positions.push(trimmed);
          }
        }
      }
    }

    // Cap to avoid overly long UPPs
    return positions.slice(0, 20);
  }

  /**
   * Build notes about the relationship between the persona and user
   * based on debate interaction patterns.
   */
  private buildRelationshipNotes(debateHistory: DebateTurn[], personaId: string): string {
    const turns = debateHistory.filter((t) => t.debaterId === personaId);

    if (turns.length === 0) {
      return 'No prior interaction history with this user.';
    }

    const totalTurns = turns.length;
    const debates = new Set(turns.map((t) => t.debateId));
    const totalDebates = debates.size;

    // Analyze citation usage
    const totalCitations = turns.reduce((sum, t) => sum + t.citations.length, 0);
    const avgCitations = totalCitations / totalTurns;

    // Analyze response lengths
    const avgLength =
      turns.reduce((sum, t) => sum + t.content.length, 0) / totalTurns;

    const notes: string[] = [];
    notes.push(
      `This persona has participated in ${totalDebates} debate(s) with ${totalTurns} total turns.`
    );

    if (avgCitations > 2) {
      notes.push('Tends to be heavily evidence-driven in this user\'s debates.');
    } else if (avgCitations > 0.5) {
      notes.push('Uses moderate evidence citation in debates.');
    } else {
      notes.push('Relies more on reasoning than citations in this user\'s debates.');
    }

    if (avgLength > 2000) {
      notes.push('Typically gives detailed, lengthy responses.');
    } else if (avgLength > 800) {
      notes.push('Gives moderately detailed responses.');
    } else {
      notes.push('Tends toward concise responses.');
    }

    return notes.join(' ');
  }

  /**
   * Validate that an object has the required UPP structure.
   */
  private validateUPP(obj: unknown): asserts obj is UniversalPersonaPrompt {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('UPP must be a non-null object.');
    }

    const u = obj as Record<string, unknown>;

    if (typeof u['upp_version'] !== 'string') {
      throw new Error('UPP must have a string upp_version field.');
    }
    if (typeof u['generated_at'] !== 'string') {
      throw new Error('UPP must have a string generated_at field.');
    }
    if (typeof u['instructions_for_any_model'] !== 'string') {
      throw new Error('UPP must have a string instructions_for_any_model field.');
    }

    if (typeof u['user_profile'] !== 'object' || u['user_profile'] === null) {
      throw new Error('UPP must have a user_profile object.');
    }

    if (typeof u['persona_state'] !== 'object' || u['persona_state'] === null) {
      throw new Error('UPP must have a persona_state object.');
    }

    const ps = u['persona_state'] as Record<string, unknown>;
    if (typeof ps['name'] !== 'string') {
      throw new Error('UPP persona_state must have a string name.');
    }
    if (!Array.isArray(ps['accumulated_positions'])) {
      throw new Error('UPP persona_state must have an accumulated_positions array.');
    }
  }
}
