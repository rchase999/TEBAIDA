import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Search,
  BookOpen,
  Cpu,
  Landmark,
  FlaskConical,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateCategory = 'philosophy' | 'technology' | 'politics' | 'science';
export type TemplateDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface DebateTemplate {
  id: string;
  category: TemplateCategory;
  topic: string;
  description: string;
  suggestedFormat: string;
  difficulty: TemplateDifficulty;
}

export interface DebateTemplateGalleryProps {
  /** Called when the user clicks "Use This Template" */
  onSelect: (template: DebateTemplate) => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TEMPLATES: DebateTemplate[] = [
  // Philosophy
  {
    id: 'phil-1',
    category: 'philosophy',
    topic: 'Free Will vs Determinism',
    description: 'Do humans truly have free will, or are our choices determined by prior causes? Explore compatibilism, hard determinism, and libertarian free will.',
    suggestedFormat: 'Oxford Union',
    difficulty: 'Advanced',
  },
  {
    id: 'phil-2',
    category: 'philosophy',
    topic: 'Utilitarianism vs Deontology',
    description: 'Should morality be judged by outcomes or duties? Pit consequentialist ethics against Kantian moral principles.',
    suggestedFormat: 'Lincoln-Douglas',
    difficulty: 'Intermediate',
  },
  {
    id: 'phil-3',
    category: 'philosophy',
    topic: 'Nature of Consciousness',
    description: 'Is consciousness a product of physical brain processes, or something more? Debate the hard problem of consciousness.',
    suggestedFormat: 'Oxford Union',
    difficulty: 'Advanced',
  },

  // Technology
  {
    id: 'tech-1',
    category: 'technology',
    topic: 'AI Regulation',
    description: 'Should governments impose strict regulations on artificial intelligence development, or would that stifle innovation?',
    suggestedFormat: 'Parliamentary',
    difficulty: 'Intermediate',
  },
  {
    id: 'tech-2',
    category: 'technology',
    topic: 'Cryptocurrency Future',
    description: 'Will decentralized currencies replace traditional banking, or are they a speculative bubble destined to fail?',
    suggestedFormat: 'Lincoln-Douglas',
    difficulty: 'Beginner',
  },
  {
    id: 'tech-3',
    category: 'technology',
    topic: 'Social Media Impact',
    description: 'Has social media been a net positive or negative for society? Examine mental health, democracy, and connectivity.',
    suggestedFormat: 'Oxford Union',
    difficulty: 'Beginner',
  },

  // Politics
  {
    id: 'pol-1',
    category: 'politics',
    topic: 'Universal Basic Income',
    description: 'Should governments provide unconditional income to all citizens? Debate economic feasibility, work incentives, and poverty reduction.',
    suggestedFormat: 'Parliamentary',
    difficulty: 'Intermediate',
  },
  {
    id: 'pol-2',
    category: 'politics',
    topic: 'Immigration Policy',
    description: 'Open borders vs strict controls: what immigration policy best serves economic growth, security, and humanitarian values?',
    suggestedFormat: 'Oxford Union',
    difficulty: 'Intermediate',
  },
  {
    id: 'pol-3',
    category: 'politics',
    topic: 'Electoral Reform',
    description: 'Is first-past-the-post fair, or should democracies adopt ranked choice, proportional representation, or other systems?',
    suggestedFormat: 'Parliamentary',
    difficulty: 'Advanced',
  },

  // Science
  {
    id: 'sci-1',
    category: 'science',
    topic: 'Climate Solutions',
    description: 'Nuclear, renewables, or carbon capture? Debate which technologies and policies are most effective at combating climate change.',
    suggestedFormat: 'Oxford Union',
    difficulty: 'Intermediate',
  },
  {
    id: 'sci-2',
    category: 'science',
    topic: 'Space Exploration Priority',
    description: 'Should humanity invest heavily in space exploration and colonization, or focus resources on Earth-bound problems?',
    suggestedFormat: 'Lincoln-Douglas',
    difficulty: 'Beginner',
  },
  {
    id: 'sci-3',
    category: 'science',
    topic: 'Gene Editing Ethics',
    description: 'CRISPR and gene editing offer incredible promise but raise ethical questions about designer babies and unforeseen consequences.',
    suggestedFormat: 'Oxford Union',
    difficulty: 'Advanced',
  },
];

const CATEGORIES: { id: TemplateCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'philosophy', label: 'Philosophy', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'technology', label: 'Technology', icon: <Cpu className="h-4 w-4" /> },
  { id: 'politics', label: 'Politics', icon: <Landmark className="h-4 w-4" /> },
  { id: 'science', label: 'Science', icon: <FlaskConical className="h-4 w-4" /> },
];

const DIFFICULTY_STYLES: Record<TemplateDifficulty, string> = {
  Beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const CATEGORY_BADGE_STYLES: Record<TemplateCategory, string> = {
  philosophy: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  politics: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  science: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * A gallery of pre-made debate templates organized by category.
 * Users can filter, search, and select a template to quick-start a debate.
 */
export const DebateTemplateGallery: React.FC<DebateTemplateGalleryProps> = ({
  onSelect,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = TEMPLATES;

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.topic.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.includes(q),
      );
    }

    return result;
  }, [activeCategory, search]);

  return (
    <div className="w-full space-y-5">
      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className={clsx(
            'block w-full rounded-lg border bg-white pl-10 pr-3 py-2 text-sm text-gray-900 shadow-sm transition-colors duration-150',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-forge-500/30 focus:border-forge-500',
            'dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder:text-gray-500',
            'border-gray-300 dark:border-surface-dark-4 dark:focus:border-forge-500',
          )}
          aria-label="Search templates"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Template categories">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-forge-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-surface-dark-2 dark:text-gray-400 dark:hover:bg-surface-dark-3',
              )}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Template grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <div
              key={template.id}
              className={clsx(
                'flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200',
                'hover:shadow-md hover:-translate-y-0.5 hover:border-forge-300',
                'dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-forge-700',
              )}
            >
              {/* Badges row */}
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-none',
                    CATEGORY_BADGE_STYLES[template.category],
                  )}
                >
                  {capitalize(template.category)}
                </span>
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-none',
                    DIFFICULTY_STYLES[template.difficulty],
                  )}
                >
                  {template.difficulty}
                </span>
              </div>

              {/* Topic */}
              <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">
                {template.topic}
              </h3>

              {/* Description */}
              <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>

              {/* Suggested format */}
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                Suggested format:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {template.suggestedFormat}
                </span>
              </p>

              {/* Action */}
              <button
                onClick={() => onSelect(template)}
                className={clsx(
                  'mt-4 w-full rounded-lg bg-forge-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150',
                  'hover:bg-forge-700 active:bg-forge-800',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
                  'dark:focus-visible:ring-offset-surface-dark-0',
                )}
              >
                Use This Template
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-surface-dark-4">
          <Search className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No templates match your search.
          </p>
        </div>
      )}
    </div>
  );
};

export default DebateTemplateGallery;
