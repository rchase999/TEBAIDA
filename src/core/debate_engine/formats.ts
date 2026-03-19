import type { DebateFormat, DebateFormatConfig, DebatePhase } from '../../types';

/**
 * A single step in the Oxford Union debate cycle.
 */
export interface TurnStep {
  phase: DebatePhase;
  role: 'proposition' | 'opposition' | 'housemaster';
}

/**
 * The fixed 10-step Oxford Union debate cycle.
 *
 *  1. Housemaster: Introduction
 *  2. Proposition: Opening Statement
 *  3. Opposition: Opening Statement
 *  4. Housemaster: Transition
 *  5. Proposition: Rebuttal
 *  6. Opposition: Rebuttal
 *  7. Housemaster: Cross-Examination
 *  8. Proposition: Closing Statement
 *  9. Opposition: Closing Statement
 * 10. Housemaster: Verdict
 */
export const TURN_SEQUENCE: TurnStep[] = [
  { phase: 'introduction',       role: 'housemaster' },
  { phase: 'opening',            role: 'proposition' },
  { phase: 'opening',            role: 'opposition' },
  { phase: 'transition',         role: 'housemaster' },
  { phase: 'rebuttal',           role: 'proposition' },
  { phase: 'rebuttal',           role: 'opposition' },
  { phase: 'cross-examination',  role: 'housemaster' },
  { phase: 'closing',            role: 'proposition' },
  { phase: 'closing',            role: 'opposition' },
  { phase: 'verdict',            role: 'housemaster' },
];

/**
 * The single Oxford Union format configuration.
 */
export const OXFORD_UNION_FORMAT: DebateFormatConfig = {
  id: 'oxford-union',
  name: 'Oxford Union',
  description:
    'A structured debate format inspired by the Oxford Union debating society. ' +
    'Features a Housemaster who introduces the motion, moderates the debate, conducts ' +
    'cross-examination, and delivers a final verdict. The Proposition and Opposition each ' +
    'present opening statements, rebuttals, and closing arguments across a fixed 10-step cycle.',
  totalTurns: 10,
  turnSequence: TURN_SEQUENCE,
  rules: [
    'The Housemaster introduces the motion and sets the rules at the start.',
    'The Proposition speaks first in each paired phase (opening, rebuttal, closing).',
    'Opening statements should clearly establish each side\'s core thesis and preview main arguments.',
    'Rebuttals must directly address the opposing side\'s arguments from the opening phase.',
    'The Housemaster conducts cross-examination by posing probing questions to both sides.',
    'Closing statements should summarize key arguments and explain why your side prevails.',
    'No new substantive arguments may be introduced during closing statements.',
    'The Housemaster delivers a final verdict evaluating both sides and declaring a winner.',
    'All participants must remain respectful and engage with the substance of the debate.',
    'Arguments should be accessible to a general audience, not just domain experts.',
  ],
};

/**
 * Lincoln-Douglas format: 1v1 focused debate with values/criteria framework.
 * 6 steps, no housemaster — direct confrontation.
 */
export const LINCOLN_DOUGLAS_SEQUENCE: TurnStep[] = [
  { phase: 'opening',            role: 'proposition' },   // Affirmative Constructive
  { phase: 'cross-examination',  role: 'opposition' },    // Neg Cross-Examines Aff
  { phase: 'opening',            role: 'opposition' },    // Negative Constructive
  { phase: 'cross-examination',  role: 'proposition' },   // Aff Cross-Examines Neg
  { phase: 'rebuttal',           role: 'proposition' },   // Affirmative Rebuttal
  { phase: 'rebuttal',           role: 'opposition' },    // Negative Rebuttal
  { phase: 'closing',            role: 'proposition' },   // Affirmative Closing
  { phase: 'closing',            role: 'opposition' },    // Negative Closing
];

export const LINCOLN_DOUGLAS_FORMAT: DebateFormatConfig = {
  id: 'lincoln-douglas',
  name: 'Lincoln-Douglas',
  description:
    'A one-on-one debate format focused on values and philosophical frameworks. ' +
    'Features direct cross-examination between debaters and structured constructive/rebuttal phases. ' +
    'No housemaster — debaters directly confront each other.',
  totalTurns: 8,
  turnSequence: LINCOLN_DOUGLAS_SEQUENCE,
  rules: [
    'The Affirmative (Proposition) presents their case first with a values framework.',
    'Cross-examination allows direct questioning of the opponent.',
    'Rebuttals must address arguments raised in constructive speeches.',
    'The Affirmative has the burden of proof — they must show the resolution is true.',
    'Focus on value premises and criteria for evaluation.',
    'No new arguments in closing statements.',
    'Both sides should directly engage with the opponent\'s value framework.',
    'Arguments should be grounded in logical reasoning and evidence.',
  ],
};

/**
 * Parliamentary format: Fast-paced, speaker-focused debate.
 * 6 steps with a Speaker (housemaster role) managing proceedings.
 */
export const PARLIAMENTARY_SEQUENCE: TurnStep[] = [
  { phase: 'introduction',  role: 'housemaster' },   // Speaker opens
  { phase: 'opening',       role: 'proposition' },    // Prime Minister's speech
  { phase: 'opening',       role: 'opposition' },     // Leader of Opposition's speech
  { phase: 'rebuttal',      role: 'proposition' },    // Member of Government's speech
  { phase: 'rebuttal',      role: 'opposition' },     // Member of Opposition's speech
  { phase: 'closing',       role: 'opposition' },     // Opposition Whip
  { phase: 'closing',       role: 'proposition' },    // Government Whip
  { phase: 'verdict',       role: 'housemaster' },    // Speaker's verdict
];

export const PARLIAMENTARY_FORMAT: DebateFormatConfig = {
  id: 'parliamentary',
  name: 'Parliamentary',
  description:
    'A speaker-focused debate format inspired by British Parliamentary debates. ' +
    'Features a Speaker who manages proceedings, with Government and Opposition sides. ' +
    'Fast-paced with emphasis on rhetoric, points of information, and direct engagement.',
  totalTurns: 8,
  turnSequence: PARLIAMENTARY_SEQUENCE,
  rules: [
    'The Speaker opens proceedings and introduces the motion.',
    'The Prime Minister (Proposition) defines the motion and presents the Government case.',
    'The Leader of Opposition directly rebuts and presents the counter-case.',
    'Member speeches should extend the case and rebut the other side.',
    'Whip speeches summarize and do NOT introduce new arguments.',
    'Debaters should offer and accept Points of Information when appropriate.',
    'The Speaker delivers a final verdict based on the quality of debate.',
    'All speeches should be accessible and rhetorically engaging.',
    'Ad hominem attacks and personal insults are strictly forbidden.',
  ],
};

/**
 * Record of all available debate formats.
 */
export const DEBATE_FORMATS: Record<DebateFormat, DebateFormatConfig> = {
  'oxford-union': OXFORD_UNION_FORMAT,
  'lincoln-douglas': LINCOLN_DOUGLAS_FORMAT,
  'parliamentary': PARLIAMENTARY_FORMAT,
};

/**
 * Returns the debate format config for the given format, defaulting to Oxford Union.
 */
export function getFormatConfig(format?: DebateFormat): DebateFormatConfig {
  if (format && DEBATE_FORMATS[format]) {
    return DEBATE_FORMATS[format];
  }
  return OXFORD_UNION_FORMAT;
}
