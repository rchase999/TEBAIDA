import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Sparkles, RefreshCw, ArrowRight, Shuffle } from 'lucide-react';
import { Button } from './Button';

export interface TopicGeneratorProps {
  onSelect: (topic: string) => void;
  className?: string;
}

const TOPIC_CATEGORIES: Record<string, string[]> = {
  'Technology': [
    'Should AI systems be required to explain their reasoning to affected humans?',
    'Will brain-computer interfaces fundamentally alter what it means to be human?',
    'Should social media algorithms be legally required to show chronological feeds?',
    'Is the open-source model or the proprietary model better for AI safety?',
    'Should there be a global moratorium on autonomous lethal weapons systems?',
  ],
  'Philosophy': [
    'Does consciousness require a biological substrate, or can silicon think?',
    'Is moral progress real, or do ethical standards merely change over time?',
    'Can a deterministic universe be compatible with meaningful free will?',
    'Should we prioritize reducing suffering over maximizing happiness?',
    'Is the simulation hypothesis unfalsifiable, and does that matter?',
  ],
  'Society': [
    'Should voting age be lowered to 16 in democracies worldwide?',
    'Is meritocracy achievable, or inherently perpetuates inequality?',
    'Should there be legal limits on personal wealth accumulation?',
    'Is cultural appropriation a meaningful concept, or does it hinder cultural exchange?',
    'Should prisoners retain the right to vote?',
  ],
  'Science': [
    'Should we invest more in nuclear fusion or solar energy for the future?',
    'Is the pursuit of longevity research ethically justifiable given resource scarcity?',
    'Should gain-of-function research be banned globally?',
    'Is colonizing Mars a responsible use of humanity\'s resources?',
    'Should we actively attempt to contact extraterrestrial intelligence?',
  ],
  'Economics': [
    'Is a four-day work week better for the economy than a five-day week?',
    'Should central banks issue digital currencies to replace physical cash?',
    'Is intellectual property law hindering or helping innovation?',
    'Should countries adopt a carbon tax or cap-and-trade to fight climate change?',
    'Is globalization a net positive or negative for developing nations?',
  ],
};

const CATEGORIES = Object.keys(TOPIC_CATEGORIES);

export const TopicGenerator: React.FC<TopicGeneratorProps> = ({ onSelect, className }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [currentTopics, setCurrentTopics] = useState<string[]>(() =>
    [...(TOPIC_CATEGORIES[CATEGORIES[0]] ?? [])].sort(() => Math.random() - 0.5).slice(0, 3)
  );

  const shuffleTopics = useCallback(() => {
    const topics = TOPIC_CATEGORIES[category] ?? [];
    const shuffled = [...topics].sort(() => Math.random() - 0.5).slice(0, 3);
    setCurrentTopics(shuffled);
  }, [category]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const topics = TOPIC_CATEGORIES[cat] ?? [];
    setCurrentTopics([...topics].sort(() => Math.random() - 0.5).slice(0, 3));
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
              category === cat
                ? 'bg-forge-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-surface-dark-2 dark:text-gray-400 dark:hover:bg-surface-dark-3',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Topics */}
      <div className="space-y-2">
        {currentTopics.map((topic, i) => (
          <button
            key={`${category}-${i}`}
            onClick={() => onSelect(topic)}
            className={clsx(
              'group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left',
              'transition-all duration-200 hover:border-forge-300 hover:shadow-md hover:-translate-y-0.5',
              'dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-forge-700',
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-forge-400 group-hover:text-forge-500 transition-colors" />
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
              {topic}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-600" />
          </button>
        ))}
      </div>

      {/* Shuffle */}
      <button
        onClick={shuffleTopics}
        className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-400 hover:text-forge-500 dark:text-gray-500 dark:hover:text-forge-400 transition-colors"
      >
        <Shuffle className="h-3 w-3" /> More {category} topics
      </button>
    </div>
  );
};

export default TopicGenerator;
