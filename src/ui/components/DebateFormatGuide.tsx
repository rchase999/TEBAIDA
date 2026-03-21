import React, { useState } from 'react';
import clsx from 'clsx';
import {
  Crown, Shield, Swords, ChevronDown, ChevronUp,
  MessageSquare, Gavel, BookOpen,
} from 'lucide-react';

export interface DebateFormatGuideProps {
  format: 'oxford-union' | 'lincoln-douglas' | 'parliamentary';
  className?: string;
}

interface TurnInfo {
  number: number;
  role: string;
  phase: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

const FORMAT_DATA: Record<string, {
  name: string;
  description: string;
  totalTurns: number;
  tips: string[];
  turns: TurnInfo[];
}> = {
  'oxford-union': {
    name: 'Oxford Union',
    description: 'The gold standard of formal debate. A Housemaster moderates as Proposition and Opposition present structured arguments through distinct phases.',
    totalTurns: 10,
    tips: [
      'The Housemaster sets the tone - their introduction frames the entire debate',
      'Rebuttals should directly address specific points from the opposing side',
      'The closing statement is your final chance to persuade - make it count',
      'Evidence quality matters more than quantity in this format',
    ],
    turns: [
      { number: 1, role: 'Housemaster', phase: 'Introduction', description: 'Sets the stage, explains the motion, establishes ground rules', icon: Crown, color: 'text-amber-500' },
      { number: 2, role: 'Proposition', phase: 'Opening', description: 'Presents the main thesis with supporting evidence', icon: Shield, color: 'text-blue-500' },
      { number: 3, role: 'Opposition', phase: 'Opening', description: 'Challenges the proposition with counter-arguments', icon: Swords, color: 'text-rose-500' },
      { number: 4, role: 'Housemaster', phase: 'Transition', description: 'Summarizes openings, poses questions for rebuttal', icon: Crown, color: 'text-amber-500' },
      { number: 5, role: 'Proposition', phase: 'Rebuttal', description: 'Addresses opposition points, reinforces core arguments', icon: Shield, color: 'text-blue-500' },
      { number: 6, role: 'Opposition', phase: 'Rebuttal', description: 'Deconstructs proposition arguments, presents new evidence', icon: Swords, color: 'text-rose-500' },
      { number: 7, role: 'Housemaster', phase: 'Cross-Exam', description: 'Probes both sides with pointed questions', icon: Crown, color: 'text-amber-500' },
      { number: 8, role: 'Proposition', phase: 'Closing', description: 'Final summary and appeal to the audience', icon: Shield, color: 'text-blue-500' },
      { number: 9, role: 'Opposition', phase: 'Closing', description: 'Final counter-narrative and conclusion', icon: Swords, color: 'text-rose-500' },
      { number: 10, role: 'Housemaster', phase: 'Verdict', description: 'Weighs all arguments and delivers judgment', icon: Gavel, color: 'text-amber-600' },
    ],
  },
  'lincoln-douglas': {
    name: 'Lincoln-Douglas',
    description: 'A pure 1v1 intellectual duel focused on values and logic. No moderator - just two minds debating head-to-head.',
    totalTurns: 8,
    tips: [
      'Define your value criterion clearly in the opening',
      'Cross-examination is your chance to expose logical weaknesses',
      'Focus on quality of reasoning over quantity of arguments',
      'Your closing should demonstrate why your value framework is superior',
    ],
    turns: [
      { number: 1, role: 'Proposition', phase: 'Opening', description: 'Defines value criterion and presents affirmative case', icon: Shield, color: 'text-blue-500' },
      { number: 2, role: 'Opposition', phase: 'Opening', description: 'Challenges framework and presents negative case', icon: Swords, color: 'text-rose-500' },
      { number: 3, role: 'Proposition', phase: 'Cross-Exam', description: 'Questions opposition to expose weaknesses', icon: Shield, color: 'text-blue-500' },
      { number: 4, role: 'Opposition', phase: 'Cross-Exam', description: 'Questions proposition to challenge evidence', icon: Swords, color: 'text-rose-500' },
      { number: 5, role: 'Proposition', phase: 'Rebuttal', description: 'Addresses opposition case, rebuilds arguments', icon: Shield, color: 'text-blue-500' },
      { number: 6, role: 'Opposition', phase: 'Rebuttal', description: 'Final rebuttal of proposition case', icon: Swords, color: 'text-rose-500' },
      { number: 7, role: 'Proposition', phase: 'Closing', description: 'Final value comparison and summary', icon: Shield, color: 'text-blue-500' },
      { number: 8, role: 'Opposition', phase: 'Closing', description: 'Final appeal and conclusion', icon: Swords, color: 'text-rose-500' },
    ],
  },
  'parliamentary': {
    name: 'Parliamentary',
    description: 'Government vs Opposition in a speaker-managed format. Emphasizes quick thinking, points of order, and rhetorical flourish.',
    totalTurns: 8,
    tips: [
      'Government should establish clear definitions and framing early',
      'Opposition can challenge definitions if they are unfairly narrow',
      'The Speaker maintains order and asks probing questions',
      'Parliamentary style rewards wit and rhetorical skill alongside logic',
    ],
    turns: [
      { number: 1, role: 'Speaker', phase: 'Introduction', description: 'Opens the session and states the motion', icon: Crown, color: 'text-amber-500' },
      { number: 2, role: 'Government', phase: 'Opening', description: 'Prime Minister presents the government case', icon: Shield, color: 'text-blue-500' },
      { number: 3, role: 'Opposition', phase: 'Opening', description: 'Leader of Opposition presents counter-case', icon: Swords, color: 'text-rose-500' },
      { number: 4, role: 'Government', phase: 'Rebuttal', description: 'Government member reinforces and rebuts', icon: Shield, color: 'text-blue-500' },
      { number: 5, role: 'Opposition', phase: 'Rebuttal', description: 'Opposition member counters and extends', icon: Swords, color: 'text-rose-500' },
      { number: 6, role: 'Speaker', phase: 'Cross-Exam', description: 'Speaker questions both sides on key points', icon: Crown, color: 'text-amber-500' },
      { number: 7, role: 'Government', phase: 'Closing', description: 'Government whip delivers final summary', icon: Shield, color: 'text-blue-500' },
      { number: 8, role: 'Opposition', phase: 'Closing', description: 'Opposition whip delivers final rebuttal', icon: Swords, color: 'text-rose-500' },
    ],
  },
};

export const DebateFormatGuide: React.FC<DebateFormatGuideProps> = ({ format, className }) => {
  const [expanded, setExpanded] = useState(false);
  const data = FORMAT_DATA[format];

  if (!data) return null;

  return (
    <div className={clsx(
      'rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-surface-dark-3 dark:bg-surface-dark-1',
      className,
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-surface-dark-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-forge-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {data.name} Format Guide
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {data.totalTurns} turns
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-surface-dark-3 animate-fade-in">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{data.description}</p>

          {/* Turn flow */}
          <div className="space-y-1.5 mb-3">
            {data.turns.map((turn) => {
              const Icon = turn.icon;
              return (
                <div key={turn.number} className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-xs font-bold tabular-nums text-gray-400 dark:text-gray-500">
                    {turn.number}
                  </span>
                  <Icon className={clsx('h-3.5 w-3.5 shrink-0', turn.color)} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20 shrink-0">{turn.role}</span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 shrink-0">{turn.phase}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{turn.description}</span>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="rounded-lg bg-forge-50/50 p-3 dark:bg-forge-900/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-600 dark:text-forge-400 mb-1.5">Tips</p>
            <ul className="space-y-1">
              {data.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <span className="text-forge-500 mt-0.5">&#8226;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateFormatGuide;
