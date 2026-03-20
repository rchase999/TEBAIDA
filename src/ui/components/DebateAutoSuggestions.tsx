import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Lightbulb, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import type { Debate } from '../../types';

export interface DebateAutoSuggestionsProps {
  debates: Debate[];
  onSelect: (topic: string) => void;
  className?: string;
}

interface Suggestion {
  topic: string;
  reason: string;
  type: 'followup' | 'trending' | 'unexplored';
  icon: React.FC<{ className?: string }>;
  color: string;
}

/**
 * Intelligent debate topic suggestions based on user's debate history.
 * Analyzes past topics and suggests follow-ups, related topics, and
 * areas the user hasn't explored yet.
 */
export const DebateAutoSuggestions: React.FC<DebateAutoSuggestionsProps> = ({
  debates,
  onSelect,
  className,
}) => {
  const suggestions = useMemo(() => {
    const results: Suggestion[] = [];
    const topics = debates.map((d) => d.topic?.toLowerCase() ?? '');

    // Follow-up suggestions based on recent debate topics
    const recentDebate = debates[0];
    if (recentDebate?.topic) {
      const FOLLOW_UPS: Record<string, string[]> = {
        'ai': [
          'Should AI-generated art be eligible for copyright protection?',
          'Will AI replace more jobs than it creates in the next decade?',
          'Should AI companies be liable for outputs that cause harm?',
        ],
        'climate': [
          'Is carbon capture technology a viable solution or a distraction?',
          'Should developing nations have the same emission standards as developed ones?',
          'Is individual action or systemic change more important for climate?',
        ],
        'democracy': [
          'Should there be term limits for all elected officials?',
          'Is direct democracy feasible with modern technology?',
          'Should tech companies be regulated as public utilities?',
        ],
        'education': [
          'Should standardized testing be abolished entirely?',
          'Is homeschooling better for child development than traditional schooling?',
          'Should college education be free for all citizens?',
        ],
        'economy': [
          'Is a wealth tax constitutional and enforceable?',
          'Should gig workers have full employee benefits?',
          'Is modern monetary theory a viable economic framework?',
        ],
      };

      const topicLower = recentDebate.topic.toLowerCase();
      for (const [keyword, followUps] of Object.entries(FOLLOW_UPS)) {
        if (topicLower.includes(keyword)) {
          const unused = followUps.filter((f) => !topics.some((t) => t.includes(f.toLowerCase().slice(0, 20))));
          if (unused.length > 0) {
            results.push({
              topic: unused[0],
              reason: `Follow-up to "${recentDebate.topic.slice(0, 40)}..."`,
              type: 'followup',
              icon: ArrowRight,
              color: 'text-blue-600 dark:text-blue-400',
            });
          }
          break;
        }
      }
    }

    // Unexplored areas
    const AREA_TOPICS: Record<string, string> = {
      'ethics': 'Is it ethical to extend human lifespan indefinitely through technology?',
      'space': 'Should private companies own resources they extract from asteroids?',
      'biology': 'Should we bring back extinct species using de-extinction technology?',
      'philosophy': 'Can machines ever truly understand consciousness, or only simulate it?',
      'law': 'Should algorithms used in criminal sentencing be open-sourced?',
      'media': 'Should news organizations be required to label AI-generated content?',
      'health': 'Should access to mental health care be treated as a human right?',
      'military': 'Is cyberwarfare a legitimate form of warfare under international law?',
    };

    for (const [area, topic] of Object.entries(AREA_TOPICS)) {
      if (!topics.some((t) => t.includes(area))) {
        results.push({
          topic,
          reason: `Explore ${area} topics`,
          type: 'unexplored',
          icon: Sparkles,
          color: 'text-purple-600 dark:text-purple-400',
        });
        if (results.length >= 3) break;
      }
    }

    // Trending topics (always available)
    const TRENDING = [
      'Should deepfake technology be banned or regulated?',
      'Is the four-day work week inevitable?',
      'Should social media have age verification requirements?',
    ];

    for (const topic of TRENDING) {
      if (!topics.some((t) => t.includes(topic.toLowerCase().slice(0, 20))) && results.length < 4) {
        results.push({
          topic,
          reason: 'Popular debate topic',
          type: 'trending',
          icon: TrendingUp,
          color: 'text-amber-600 dark:text-amber-400',
        });
      }
    }

    return results.slice(0, 4);
  }, [debates]);

  if (suggestions.length === 0) return null;

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-4 w-4 text-forge-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Suggested for You</span>
      </div>
      {suggestions.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.topic}
            onClick={() => onSelect(s.topic)}
            className="group flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-left transition-all duration-200 hover:border-forge-200 hover:shadow-sm dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-forge-800"
          >
            <Icon className={clsx('h-4 w-4 shrink-0', s.color)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors line-clamp-1">{s.topic}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{s.reason}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        );
      })}
    </div>
  );
};

export default DebateAutoSuggestions;
