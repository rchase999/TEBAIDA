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
 * Record of all available debate formats. Contains a single entry for backwards compatibility.
 */
export const DEBATE_FORMATS: Record<DebateFormat, DebateFormatConfig> = {
  'oxford-union': OXFORD_UNION_FORMAT,
};

/**
 * Returns the debate format config. Since there is only one format (Oxford Union),
 * the parameter is optional and exists for backwards compatibility.
 */
export function getFormatConfig(_format?: DebateFormat): DebateFormatConfig {
  return OXFORD_UNION_FORMAT;
}
