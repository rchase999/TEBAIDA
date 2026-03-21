import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  Scale, Gavel, Users, ChevronDown, ChevronRight,
  Clock, ListOrdered, ShieldCheck, Target, Lightbulb, BookOpen,
} from 'lucide-react';
import type { DebateFormat } from '../../types';

/* ======================================================================
   DebateRules — Comprehensive debate rules reference panel.

   Shows format-specific rules for Oxford Union, Lincoln-Douglas, and
   Parliamentary formats. Includes turn structure, time allocations,
   speaking order, rules of engagement, scoring criteria, and common
   strategies. Tabbed by format with collapsible sections and a compact
   "Quick Reference" card mode.
   ====================================================================== */

export interface DebateRulesProps {
  /** Currently selected or active format */
  format: DebateFormat;
  /** Start in compact card mode */
  compact?: boolean;
  className?: string;
}

// ── Format metadata ──────────────────────────────────────────────────

interface RuleSection {
  id: string;
  icon: React.FC<{ className?: string }>;
  title: string;
  items: string[];
}

interface FormatInfo {
  id: DebateFormat;
  name: string;
  tagline: string;
  icon: React.FC<{ className?: string }>;
  color: { tab: string; activeTab: string; accent: string; iconBg: string };
  structure: RuleSection;
  timeAllocations: RuleSection;
  speakingOrder: RuleSection;
  rulesOfEngagement: RuleSection;
  scoringCriteria: RuleSection;
  strategies: RuleSection;
}

const FORMATS: Record<DebateFormat, FormatInfo> = {
  'oxford-union': {
    id: 'oxford-union',
    name: 'Oxford Union',
    tagline: 'Persuasion through structured eloquence',
    icon: Scale,
    color: {
      tab: 'text-blue-600 dark:text-blue-400',
      activeTab: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500',
      accent: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    structure: {
      id: 'structure',
      icon: ListOrdered,
      title: 'Structure & Turns',
      items: [
        '10 turns total across 7 phases',
        'Introduction by the Housemaster sets the stage',
        'Opening statements from Proposition then Opposition',
        'Two rounds of rebuttals (alternating speakers)',
        'Cross-examination where debaters challenge each other',
        'Closing statements summarize and persuade',
        'Final verdict delivered by the Housemaster',
      ],
    },
    timeAllocations: {
      id: 'time',
      icon: Clock,
      title: 'Time Allocations',
      items: [
        'Introduction: 1-2 minutes (Housemaster)',
        'Opening Statements: 3-5 minutes each',
        'Rebuttals: 2-4 minutes per turn',
        'Cross-Examination: 2-3 minutes each',
        'Closing Statements: 3-5 minutes each',
        'Verdict: 2-3 minutes (Housemaster)',
      ],
    },
    speakingOrder: {
      id: 'order',
      icon: Users,
      title: 'Speaking Order',
      items: [
        '1. Housemaster introduces the motion',
        '2. Proposition opens with their case',
        '3. Opposition opens with their counter-case',
        '4. Proposition rebuts Opposition\'s arguments',
        '5. Opposition rebuts Proposition\'s arguments',
        '6. Cross-examination (alternating)',
        '7. Proposition delivers closing',
        '8. Opposition delivers closing',
        '9. Housemaster delivers verdict',
      ],
    },
    rulesOfEngagement: {
      id: 'rules',
      icon: ShieldCheck,
      title: 'Rules of Engagement',
      items: [
        'Address the chair (Housemaster), not the opponent directly',
        'No personal attacks — criticize arguments, not people',
        'Points of Information may be offered during speeches',
        'Speakers may accept or decline Points of Information',
        'No new arguments allowed in closing statements',
        'Evidence must be cited with sources when possible',
        'Maintain parliamentary courtesy at all times',
      ],
    },
    scoringCriteria: {
      id: 'scoring',
      icon: Target,
      title: 'Scoring Criteria',
      items: [
        'Argumentation (1-10): Logical soundness and depth of reasoning',
        'Evidence (1-10): Quality and relevance of supporting material',
        'Rebuttal (1-10): Effectiveness at dismantling opponent\'s case',
        'Rhetoric (1-10): Persuasive delivery and audience engagement',
        'Overall (1-10): Holistic assessment of debate performance',
      ],
    },
    strategies: {
      id: 'strategies',
      icon: Lightbulb,
      title: 'Common Strategies',
      items: [
        'Front-loading: Present strongest argument first to set the tone',
        'Preemptive rebuttal: Address obvious counter-arguments before the opponent raises them',
        'Burden shifting: Frame the debate so the opposition must defend a difficult position',
        'Anecdote anchoring: Use a compelling story to humanize abstract arguments',
        'Concede and pivot: Acknowledge a minor point to strengthen credibility on major ones',
        'Socratic questioning: Use targeted questions to expose logical gaps',
      ],
    },
  },
  'lincoln-douglas': {
    id: 'lincoln-douglas',
    name: 'Lincoln-Douglas',
    tagline: 'Values-focused one-on-one clash',
    icon: Gavel,
    color: {
      tab: 'text-emerald-600 dark:text-emerald-400',
      activeTab: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500',
      accent: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    structure: {
      id: 'structure',
      icon: ListOrdered,
      title: 'Structure & Turns',
      items: [
        '8 turns total across 6 phases',
        'Affirmative constructive (AC) presents the case',
        'Cross-examination of the affirmative by the negative',
        'Negative constructive (NC) with first rebuttal',
        'Cross-examination of the negative by the affirmative',
        'First affirmative rebuttal (1AR)',
        'Negative rebuttal (NR)',
        'Second affirmative rebuttal (2AR) — final word',
      ],
    },
    timeAllocations: {
      id: 'time',
      icon: Clock,
      title: 'Time Allocations',
      items: [
        'Affirmative Constructive: 6 minutes',
        'Cross-Examination (by Neg): 3 minutes',
        'Negative Constructive + Rebuttal: 7 minutes',
        'Cross-Examination (by Aff): 3 minutes',
        'First Affirmative Rebuttal: 4 minutes',
        'Negative Rebuttal: 6 minutes',
        'Second Affirmative Rebuttal: 3 minutes',
        'Prep Time: 4 minutes per debater (total)',
      ],
    },
    speakingOrder: {
      id: 'order',
      icon: Users,
      title: 'Speaking Order',
      items: [
        '1. Affirmative (Proposition) presents constructive case',
        '2. Negative (Opposition) cross-examines',
        '3. Negative presents constructive + initial rebuttal',
        '4. Affirmative cross-examines',
        '5. Affirmative delivers first rebuttal',
        '6. Negative delivers final rebuttal',
        '7. Affirmative delivers final rebuttal (last word)',
      ],
    },
    rulesOfEngagement: {
      id: 'rules',
      icon: ShieldCheck,
      title: 'Rules of Engagement',
      items: [
        'Must establish a clear value criterion (e.g., Justice, Liberty)',
        'Arguments must link back to the value criterion',
        'Cross-examination must be questions only — no speeches',
        'New arguments not permitted in rebuttals',
        'Dropped arguments are considered conceded',
        'Debaters should clearly signpost their responses',
        'Time signals should be respected — no running over',
      ],
    },
    scoringCriteria: {
      id: 'scoring',
      icon: Target,
      title: 'Scoring Criteria',
      items: [
        'Value/Criterion Debate: Who better established and defended their framework?',
        'Argumentation: Logical soundness and analytical depth',
        'Clash: Direct engagement with opponent\'s arguments',
        'Cross-Examination: Effectiveness in questioning / answering',
        'Rebuttal Coverage: How thoroughly were opposing arguments addressed?',
      ],
    },
    strategies: {
      id: 'strategies',
      icon: Lightbulb,
      title: 'Common Strategies',
      items: [
        'Value hijacking: Show your opponent\'s value actually supports your case',
        'Criterion leverage: Win the criterion debate to capture multiple arguments',
        'Cross-ex traps: Lead the opponent into contradictions during questioning',
        'Turn arguments: Show an opponent\'s argument actually supports your side',
        'Underview: Present overarching analysis that subsumes individual arguments',
        'Time allocation: Spend more time on winning arguments, less on losing ones',
      ],
    },
  },
  parliamentary: {
    id: 'parliamentary',
    name: 'Parliamentary',
    tagline: 'Dynamic, knowledge-based debate',
    icon: Users,
    color: {
      tab: 'text-violet-600 dark:text-violet-400',
      activeTab: 'bg-violet-50 dark:bg-violet-900/30 border-violet-500',
      accent: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    },
    structure: {
      id: 'structure',
      icon: ListOrdered,
      title: 'Structure & Turns',
      items: [
        '8 turns across 5 phases',
        'Prime Minister (PM) constructive opens the Government case',
        'Leader of Opposition (LO) constructive responds',
        'Member of Government (MG) extends the case',
        'Member of Opposition (MO) extends the opposition',
        'Opposition Whip summarizes and crystallizes',
        'Government Whip summarizes and crystallizes',
        'No formal cross-examination — use Points of Information',
      ],
    },
    timeAllocations: {
      id: 'time',
      icon: Clock,
      title: 'Time Allocations',
      items: [
        'PM Constructive: 7 minutes',
        'LO Constructive: 7 minutes',
        'MG Constructive: 7 minutes',
        'MO Constructive: 7 minutes',
        'Opposition Whip: 5 minutes',
        'Government Whip: 5 minutes',
        'Points of Information: 15 seconds each (during speeches)',
        'Protected time: First/last minute of each speech is POI-free',
      ],
    },
    speakingOrder: {
      id: 'order',
      icon: Users,
      title: 'Speaking Order',
      items: [
        '1. Prime Minister defines the motion and presents the case',
        '2. Leader of Opposition responds and establishes counter-case',
        '3. Member of Government extends with new arguments',
        '4. Member of Opposition responds and extends opposition',
        '5. Opposition Whip crystallizes key clashes (no new arguments)',
        '6. Government Whip crystallizes and claims the debate',
      ],
    },
    rulesOfEngagement: {
      id: 'rules',
      icon: ShieldCheck,
      title: 'Rules of Engagement',
      items: [
        'Government defines the motion — Opposition must engage with that definition',
        'Points of Information: Stand and say "On that point..." to offer a POI',
        'Speakers may accept or decline POIs at their discretion',
        'No outside evidence or prepared materials allowed',
        'Arguments must rely on common knowledge and logic',
        'Whips cannot introduce new arguments — only summarize',
        'Heckling is allowed but must be brief and witty',
      ],
    },
    scoringCriteria: {
      id: 'scoring',
      icon: Target,
      title: 'Scoring Criteria',
      items: [
        'Content (40%): Quality and relevance of arguments presented',
        'Strategy (20%): Identification and engagement with key issues',
        'Style (20%): Persuasive delivery, humor, and audience engagement',
        'POI Engagement (10%): Quality of offered and answered Points of Information',
        'Teamwork (10%): How well speakers built on their partner\'s case',
      ],
    },
    strategies: {
      id: 'strategies',
      icon: Lightbulb,
      title: 'Common Strategies',
      items: [
        'Squirrelling: Define the motion narrowly to gain strategic advantage (risky)',
        'Knifing: Member speaker contradicts partner to introduce a stronger argument',
        'POI flooding: Offer many POIs to distract and pressure the speaker',
        'Mechanism debate: Focus on the practical implementation of the policy',
        'Principled split: Each team member takes a different philosophical angle',
        'Stakeholder analysis: Show who benefits and who is harmed by the motion',
      ],
    },
  },
};

// ── Collapsible Section sub-component ────────────────────────────────

interface CollapsibleSectionProps {
  section: RuleSection;
  accentColor: string;
  iconBg: string;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  section,
  accentColor,
  iconBg,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <div className="border border-gray-100 dark:border-surface-dark-3 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-gray-50 dark:hover:bg-surface-dark-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-inset',
        )}
        aria-expanded={isOpen}
      >
        <div className={clsx('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={clsx('w-3.5 h-3.5', accentColor)} />
        </div>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1">{section.title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1">
          <ul className="space-y-2">
            {section.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                <span className={clsx('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', accentColor.replace('text-', 'bg-'))} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────

export const DebateRules: React.FC<DebateRulesProps> = ({
  format: initialFormat,
  compact = false,
  className,
}) => {
  const [activeFormat, setActiveFormat] = useState<DebateFormat>(initialFormat);
  const [isCompact, setIsCompact] = useState(compact);

  const info = FORMATS[activeFormat];
  const FormatIcon = info.icon;

  const allSections: RuleSection[] = [
    info.structure,
    info.timeAllocations,
    info.speakingOrder,
    info.rulesOfEngagement,
    info.scoringCriteria,
    info.strategies,
  ];

  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 dark:border-surface-dark-3 bg-white dark:bg-surface-dark-1 overflow-hidden',
        className,
      )}
      role="region"
      aria-label="Debate rules reference"
    >
      {/* ── Format tabs ──────────────────────────────────── */}
      <div className="flex border-b border-gray-200 dark:border-surface-dark-3">
        {(Object.keys(FORMATS) as DebateFormat[]).map((fmtId) => {
          const fmt = FORMATS[fmtId];
          const FmtIcon = fmt.icon;
          const isActive = fmtId === activeFormat;

          return (
            <button
              key={fmtId}
              onClick={() => setActiveFormat(fmtId)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition-colors border-b-2',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-inset',
                isActive
                  ? clsx(fmt.color.activeTab, fmt.color.tab)
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-surface-dark-2',
              )}
              aria-selected={isActive}
              role="tab"
            >
              <FmtIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{fmt.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Header ───────────────────────────────────────── */}
      <div className="p-4 border-b border-gray-100 dark:border-surface-dark-3 flex items-center gap-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', info.color.iconBg)}>
          <FormatIcon className={clsx('w-5 h-5', info.color.accent)} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{info.name} Format</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{info.tagline}</p>
        </div>
        <button
          onClick={() => setIsCompact((c) => !c)}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
            'border border-gray-200 dark:border-surface-dark-3',
            'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-2',
          )}
        >
          {isCompact ? 'Full View' : 'Quick Ref'}
        </button>
      </div>

      {/* ── Compact quick-reference cards ─────────────────── */}
      {isCompact ? (
        <div className="p-4 grid grid-cols-2 gap-3">
          {allSections.map((section) => {
            const SIcon = section.icon;
            return (
              <div
                key={section.id}
                className="rounded-lg border border-gray-100 dark:border-surface-dark-3 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <SIcon className={clsx('w-3.5 h-3.5', info.color.accent)} />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{section.title}</span>
                </div>
                <ul className="space-y-1">
                  {section.items.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-xs text-gray-500 dark:text-gray-400 leading-snug truncate">
                      {item}
                    </li>
                  ))}
                  {section.items.length > 3 && (
                    <li className="text-xs text-gray-400 dark:text-gray-500 italic">
                      +{section.items.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Full expandable sections ──────────────────────── */
        <div className="p-4 space-y-2">
          {allSections.map((section, i) => (
            <CollapsibleSection
              key={section.id}
              section={section}
              accentColor={info.color.accent}
              iconBg={info.color.iconBg}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DebateRules;
