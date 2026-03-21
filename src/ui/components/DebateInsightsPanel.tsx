import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  BarChart3, Type, HelpCircle, Handshake, Sparkles,
  BookOpen, Swords, TrendingUp, Award, MessageSquare,
} from 'lucide-react';
import type { Debate, DebaterConfig, DebateTurn } from '../../types';

/* ======================================================================
   DebateInsightsPanel — AI-free heuristic analysis of a completed debate.

   Calculates purely from the transcript text:
   - Word count comparison
   - Average sentence length per debater
   - Question frequency
   - Concession count ("I agree", "fair point", "you're right", etc.)
   - Rhetorical device usage (anaphora, rhetorical questions)
   - Reading level estimate (Flesch-Kincaid approximation)
   - Debate style classification (Aggressive / Defensive / Balanced)
   - Key turning point (turn with biggest momentum shift)

   Only displays for completed debates.
   ====================================================================== */

export interface DebateInsightsPanelProps {
  debate: Debate;
  className?: string;
}

// ── Text analysis helpers ────────────────────────────────────────────

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  // Silent e
  if (w.endsWith('e') && count > 1) count--;
  return Math.max(count, 1);
}

function fleschKincaidGradeLevel(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const grade =
    0.39 * (words.length / sentences.length) +
    11.8 * (totalSyllables / words.length) -
    15.59;

  return Math.max(0, Math.round(grade * 10) / 10);
}

function gradeToLabel(grade: number): string {
  if (grade <= 6) return 'Simple';
  if (grade <= 9) return 'Standard';
  if (grade <= 12) return 'Advanced';
  if (grade <= 16) return 'Academic';
  return 'Post-Graduate';
}

const CONCESSION_PATTERNS = [
  /\bi agree\b/i,
  /\bfair point\b/i,
  /\byou'?re right\b/i,
  /\bthat'?s true\b/i,
  /\bi concede\b/i,
  /\bi'?ll grant\b/i,
  /\byou make a (?:good|valid|fair) point\b/i,
  /\bi acknowledge\b/i,
  /\bi accept that\b/i,
  /\bthat'?s a fair\b/i,
  /\byou have a point\b/i,
  /\bi can'?t deny\b/i,
];

function countConcessions(text: string): number {
  return CONCESSION_PATTERNS.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern, 'gi'));
    return count + (matches?.length ?? 0);
  }, 0);
}

function countQuestions(text: string): number {
  return (text.match(/\?/g) ?? []).length;
}

function detectAnaphora(text: string): number {
  // Detect repeated sentence openings (a classic rhetorical device)
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length < 3) return 0;

  let anaphoraCount = 0;
  for (let i = 2; i < sentences.length; i++) {
    const words1 = sentences[i - 2].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    const words2 = sentences[i - 1].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    const words3 = sentences[i].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    if (words1 === words2 && words2 === words3 && words1.length > 2) {
      anaphoraCount++;
    }
  }
  return anaphoraCount;
}

function detectRhetoricalQuestions(text: string): number {
  // Heuristic: questions that don't expect an answer (often follow a statement
  // and use patterns like "Isn't it...", "Don't we...", "How can anyone...")
  const rhetorical = [
    /\bisn'?t it\b.*\?/gi,
    /\bdon'?t we\b.*\?/gi,
    /\bhow can anyone\b.*\?/gi,
    /\bwho would\b.*\?/gi,
    /\bwhat kind of\b.*\?/gi,
    /\bisn'?t that\b.*\?/gi,
    /\bwouldn'?t you agree\b.*\?/gi,
    /\bcan we really\b.*\?/gi,
    /\bare we to believe\b.*\?/gi,
  ];
  return rhetorical.reduce((count, p) => count + (text.match(p) ?? []).length, 0);
}

// ── Per-debater analysis ─────────────────────────────────────────────

interface DebaterAnalysis {
  id: string;
  name: string;
  role: 'proposition' | 'opposition' | 'housemaster';
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  questionCount: number;
  concessionCount: number;
  anaphoraCount: number;
  rhetoricalQuestionCount: number;
  readingLevel: number;
  readingLabel: string;
  rebuttalRatio: number; // proportion of turns that are rebuttals
  style: 'Aggressive' | 'Defensive' | 'Balanced';
}

function analyzeDebater(
  debater: DebaterConfig,
  turns: DebateTurn[],
): DebaterAnalysis {
  const debaterTurns = turns.filter((t) => t.debaterId === debater.id);
  const allText = debaterTurns.map((t) => t.content).join(' ');
  const words = allText.split(/\s+/).filter(Boolean);
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  const rebuttalTurns = debaterTurns.filter(
    (t) => t.phase === 'rebuttal' || t.phase === 'cross-examination',
  ).length;
  const rebuttalRatio = debaterTurns.length > 0 ? rebuttalTurns / debaterTurns.length : 0;

  // Classify style
  const questionRatio = words.length > 0 ? countQuestions(allText) / (words.length / 100) : 0;
  const concRatio = words.length > 0 ? countConcessions(allText) / (words.length / 500) : 0;

  let style: 'Aggressive' | 'Defensive' | 'Balanced' = 'Balanced';
  if (rebuttalRatio > 0.5 && questionRatio > 2) {
    style = 'Aggressive';
  } else if (concRatio > 1.5 || rebuttalRatio < 0.2) {
    style = 'Defensive';
  }

  const readingLevel = fleschKincaidGradeLevel(allText);

  return {
    id: debater.id,
    name: debater.name,
    role: debater.position,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? Math.round((words.length / sentences.length) * 10) / 10 : 0,
    questionCount: countQuestions(allText),
    concessionCount: countConcessions(allText),
    anaphoraCount: detectAnaphora(allText),
    rhetoricalQuestionCount: detectRhetoricalQuestions(allText),
    readingLevel,
    readingLabel: gradeToLabel(readingLevel),
    rebuttalRatio,
    style,
  };
}

// ── Insight card sub-component ───────────────────────────────────────

interface InsightCardProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ icon: Icon, label, children, className }) => (
  <div
    className={clsx(
      'rounded-lg border border-gray-100 dark:border-surface-dark-3 p-3',
      'bg-white dark:bg-surface-dark-1',
      className,
    )}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-3.5 h-3.5 text-forge-500 dark:text-forge-400" />
      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
        {label}
      </span>
    </div>
    {children}
  </div>
);

// ── Comparison bar ───────────────────────────────────────────────────

interface ComparisonBarProps {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  leftColor?: string;
  rightColor?: string;
  unit?: string;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  leftColor = 'bg-blue-500 dark:bg-blue-400',
  rightColor = 'bg-rose-500 dark:bg-rose-400',
  unit = '',
}) => {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPct = total > 0 ? (rightValue / total) * 100 : 50;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>
          {leftLabel}: <span className="font-medium text-gray-700 dark:text-gray-200">{leftValue}{unit}</span>
        </span>
        <span>
          {rightLabel}: <span className="font-medium text-gray-700 dark:text-gray-200">{rightValue}{unit}</span>
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-surface-dark-3">
        <div
          className={clsx('transition-all duration-500 rounded-l-full', leftColor)}
          style={{ width: `${leftPct}%` }}
        />
        <div
          className={clsx('transition-all duration-500 rounded-r-full', rightColor)}
          style={{ width: `${rightPct}%` }}
        />
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────

export const DebateInsightsPanel: React.FC<DebateInsightsPanelProps> = ({ debate, className }) => {
  const analyses = useMemo(() => {
    // Only non-housemaster debaters for comparison
    const debaters = debate.debaters.filter((d) => d.position !== 'housemaster');
    return debaters.map((d) => analyzeDebater(d, debate.turns));
  }, [debate.debaters, debate.turns]);

  const turningPoint = useMemo(() => {
    const momentum = debate.momentum;
    if (!momentum || momentum.length < 2) return null;

    let maxShift = 0;
    let maxIdx = 0;
    for (let i = 1; i < momentum.length; i++) {
      const shift = Math.abs(momentum[i].score - momentum[i - 1].score);
      if (shift > maxShift) {
        maxShift = shift;
        maxIdx = i;
      }
    }

    if (maxShift === 0) return null;

    const turn = debate.turns[momentum[maxIdx].turnIndex];
    return {
      turnIndex: momentum[maxIdx].turnIndex,
      speaker: turn?.debaterName ?? 'Unknown',
      shift: maxShift,
      direction: momentum[maxIdx].score > (momentum[maxIdx - 1]?.score ?? 0) ? 'proposition' : 'opposition',
      preview: turn?.content.slice(0, 80) ?? '',
    };
  }, [debate.momentum, debate.turns]);

  // Guard: only show for completed debates with turns
  if (debate.status !== 'completed' || debate.turns.length === 0) {
    return (
      <div className={clsx('rounded-xl border border-gray-200 dark:border-surface-dark-3 bg-white dark:bg-surface-dark-1 p-6 text-center', className)}>
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Insights will appear once the debate is completed.
        </p>
      </div>
    );
  }

  const [a, b] = analyses.length >= 2 ? [analyses[0], analyses[1]] : [analyses[0], null];

  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 dark:border-surface-dark-3 bg-white dark:bg-surface-dark-1 overflow-hidden',
        className,
      )}
      role="region"
      aria-label="Debate insights"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="p-4 border-b border-gray-100 dark:border-surface-dark-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-forge-100 dark:bg-forge-900/40 flex items-center justify-center">
          <BarChart3 className="w-4.5 h-4.5 text-forge-600 dark:text-forge-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Debate Insights</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Heuristic analysis of the transcript
          </p>
        </div>
      </div>

      {/* ── Insight grid ─────────────────────────────────── */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Word Count */}
        {a && b && (
          <InsightCard icon={Type} label="Word Count">
            <ComparisonBar
              leftLabel={a.name}
              rightLabel={b.name}
              leftValue={a.wordCount}
              rightValue={b.wordCount}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {a.wordCount > b.wordCount
                ? `${a.name} spoke ${Math.round(((a.wordCount - b.wordCount) / b.wordCount) * 100)}% more`
                : a.wordCount < b.wordCount
                  ? `${b.name} spoke ${Math.round(((b.wordCount - a.wordCount) / a.wordCount) * 100)}% more`
                  : 'Equal word counts'}
            </p>
          </InsightCard>
        )}

        {/* 2. Average Sentence Length */}
        {a && b && (
          <InsightCard icon={BarChart3} label="Avg Sentence Length">
            <ComparisonBar
              leftLabel={a.name}
              rightLabel={b.name}
              leftValue={a.avgSentenceLength}
              rightValue={b.avgSentenceLength}
              unit=" words"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {a.avgSentenceLength > b.avgSentenceLength
                ? `${a.name} uses more complex sentences`
                : a.avgSentenceLength < b.avgSentenceLength
                  ? `${b.name} uses more complex sentences`
                  : 'Similar sentence complexity'}
            </p>
          </InsightCard>
        )}

        {/* 3. Question Frequency */}
        {a && b && (
          <InsightCard icon={HelpCircle} label="Questions Asked">
            <ComparisonBar
              leftLabel={a.name}
              rightLabel={b.name}
              leftValue={a.questionCount}
              rightValue={b.questionCount}
              leftColor="bg-indigo-500 dark:bg-indigo-400"
              rightColor="bg-orange-500 dark:bg-orange-400"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {a.questionCount + b.questionCount} total questions in the debate
            </p>
          </InsightCard>
        )}

        {/* 4. Concession Count */}
        {a && b && (
          <InsightCard icon={Handshake} label="Concessions">
            <ComparisonBar
              leftLabel={a.name}
              rightLabel={b.name}
              leftValue={a.concessionCount}
              rightValue={b.concessionCount}
              leftColor="bg-emerald-500 dark:bg-emerald-400"
              rightColor="bg-teal-500 dark:bg-teal-400"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {a.concessionCount + b.concessionCount === 0
                ? 'Neither debater made concessions'
                : `${a.concessionCount + b.concessionCount} concession(s) detected`}
            </p>
          </InsightCard>
        )}

        {/* 5. Rhetorical Devices */}
        {a && b && (
          <InsightCard icon={Sparkles} label="Rhetorical Devices">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Anaphora (repetition)</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {a.name}: {a.anaphoraCount} &middot; {b.name}: {b.anaphoraCount}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Rhetorical questions</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {a.name}: {a.rhetoricalQuestionCount} &middot; {b.name}: {b.rhetoricalQuestionCount}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {(a.anaphoraCount + a.rhetoricalQuestionCount) > (b.anaphoraCount + b.rhetoricalQuestionCount)
                ? `${a.name} employs more rhetorical devices`
                : (a.anaphoraCount + a.rhetoricalQuestionCount) < (b.anaphoraCount + b.rhetoricalQuestionCount)
                  ? `${b.name} employs more rhetorical devices`
                  : 'Equal use of rhetorical devices'}
            </p>
          </InsightCard>
        )}

        {/* 6. Reading Level */}
        {a && b && (
          <InsightCard icon={BookOpen} label="Reading Level">
            <div className="flex gap-3">
              {[a, b].map((debater) => (
                <div key={debater.id} className="flex-1 text-center">
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{debater.readingLevel}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{debater.readingLabel}</div>
                  <div className={clsx(
                    'text-xs font-medium mt-0.5',
                    debater.role === 'proposition'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-rose-600 dark:text-rose-400',
                  )}>
                    {debater.name}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              Flesch-Kincaid grade level estimate
            </p>
          </InsightCard>
        )}

        {/* 7. Debate Style */}
        {a && b && (
          <InsightCard icon={Swords} label="Debate Style">
            <div className="flex gap-4">
              {[a, b].map((debater) => {
                const styleColors: Record<string, string> = {
                  Aggressive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                  Defensive: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                  Balanced: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                };
                return (
                  <div key={debater.id} className="flex-1 text-center">
                    <span className={clsx(
                      'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                      styleColors[debater.style],
                    )}>
                      {debater.style}
                    </span>
                    <div className={clsx(
                      'text-xs font-medium mt-1',
                      debater.role === 'proposition'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-rose-600 dark:text-rose-400',
                    )}>
                      {debater.name}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              Based on rebuttal ratio and questioning patterns
            </p>
          </InsightCard>
        )}

        {/* 8. Key Turning Point */}
        {turningPoint && (
          <InsightCard icon={TrendingUp} label="Key Turning Point" className="sm:col-span-2">
            <div className="flex items-start gap-3">
              <div className={clsx(
                'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold',
                turningPoint.direction === 'proposition'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
              )}>
                #{turningPoint.turnIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {turningPoint.speaker}
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                    momentum shift of {turningPoint.shift} points
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                  "{turningPoint.preview}..."
                </p>
              </div>
              <Award className={clsx(
                'w-5 h-5 flex-shrink-0',
                turningPoint.direction === 'proposition'
                  ? 'text-blue-400 dark:text-blue-500'
                  : 'text-rose-400 dark:text-rose-500',
              )} />
            </div>
          </InsightCard>
        )}

        {/* Single debater fallback */}
        {a && !b && (
          <InsightCard icon={Type} label="Speaker Stats" className="sm:col-span-2">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{a.wordCount}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Words</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{a.questionCount}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Questions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{a.readingLevel}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{a.readingLabel}</div>
              </div>
              <div>
                <span className={clsx(
                  'inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1',
                  a.style === 'Aggressive'
                    ? 'bg-red-100 text-red-700'
                    : a.style === 'Defensive'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700',
                )}>
                  {a.style}
                </span>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Style</div>
              </div>
            </div>
          </InsightCard>
        )}
      </div>
    </div>
  );
};

export default DebateInsightsPanel;
