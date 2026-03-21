import React, { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import {
  Search, ChevronDown, ChevronUp, BookOpen, Key, Swords,
  Users, HelpCircle, Keyboard, MessageSquare, ExternalLink,
  Lightbulb, Zap, Shield, AlertTriangle, Trophy, Globe,
  Download, Server, Bug, Command, ArrowRight, Cpu,
  FileText, Play, Star,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  DEFAULT_SHORTCUTS,
  formatKey,
} from '../hooks/useKeyboardShortcuts';

/* ─── Getting Started Data ────────────────────────────────────────────────── */

interface GettingStartedItem {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  steps: string[];
  color: string;
  bgColor: string;
}

const GETTING_STARTED: GettingStartedItem[] = [
  {
    icon: Key,
    title: 'How to add API keys',
    description: 'Connect your AI providers to start debating.',
    steps: [
      'Navigate to Settings (Ctrl+7 or click the gear icon).',
      'Select the "API Keys" tab from the sidebar.',
      'Enter your API key for each provider you want to use.',
      'Click "Test" to verify the connection works.',
      'Click "Save All Keys" to persist your configuration.',
    ],
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    icon: Swords,
    title: 'How to create your first debate',
    description: 'Set up and launch an AI-powered debate.',
    steps: [
      'Click "New Debate" or press Ctrl+N.',
      'Enter a debate topic or pick a suggestion.',
      'Choose a debate format (Oxford Union, Lincoln-Douglas, or Parliamentary).',
      'Select AI models for the proposition and opposition.',
      'Optionally assign personas to each debater.',
      'Click "Start Debate" to begin.',
    ],
    color: 'text-forge-600 dark:text-forge-400',
    bgColor: 'bg-forge-100 dark:bg-forge-900/30',
  },
  {
    icon: BookOpen,
    title: 'Understanding debate formats',
    description: 'Learn how each format structures the conversation.',
    steps: [
      'Oxford Union: Formal structure with opening, rebuttal, and closing rounds.',
      'Lincoln-Douglas: One-on-one format focused on values and philosophy.',
      'Parliamentary: Team-based with government and opposition benches.',
      'Each format has a preset number of turns and time allocation.',
      'The housemaster AI judges and scores each round.',
    ],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    icon: Users,
    title: 'Creating custom personas',
    description: 'Build unique debater personalities and expertise.',
    steps: [
      'Navigate to Personas (Ctrl+3).',
      'Click "Create New Persona" to start.',
      'Set a name, expertise area, and debating style.',
      'Customize argumentation strategies and rhetorical preferences.',
      'Save the persona to use in any debate.',
    ],
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
];

/* ─── FAQ Data ────────────────────────────────────────────────────────────── */

interface FAQItem {
  question: string;
  answer: string;
  icon: React.FC<{ className?: string }>;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is DebateForge?',
    answer: 'DebateForge is an AI-powered debate arena that pits multiple AI models against each other in structured debates. It features real-time evidence verification, logical fallacy detection, ELO-based scoring, and support for multiple debate formats. It runs as a desktop application built on Electron.',
    icon: HelpCircle,
  },
  {
    question: 'Which AI models are supported?',
    answer: 'DebateForge supports models from Anthropic (Claude 3.5, Claude 4, Opus), OpenAI (GPT-4o, o1, o3), Google (Gemini 2.5 Pro, Flash), and local models via Ollama and LM Studio. You can mix and match any combination of providers in a single debate.',
    icon: Cpu,
  },
  {
    question: 'Do I need API keys for all providers?',
    answer: 'No. You only need an API key for the providers you want to use. For example, if you only have an Anthropic key, you can run debates between different Claude models. Local models via Ollama or LM Studio do not require API keys at all.',
    icon: Key,
  },
  {
    question: 'How does fallacy detection work?',
    answer: 'DebateForge uses a dedicated AI analysis pass to identify 14+ common logical fallacies in real-time, including ad hominem, straw man, false dichotomy, appeal to authority, slippery slope, and more. Each detected fallacy is tagged with a severity level and explanation.',
    icon: AlertTriangle,
  },
  {
    question: 'What is the ELO rating system?',
    answer: 'ELO is a rating system originally designed for chess. In DebateForge, each AI model starts with a base rating of 1500. After each debate, ratings are adjusted based on performance: winning against a higher-rated model earns more points. View the Leaderboard to see current rankings.',
    icon: Trophy,
  },
  {
    question: 'Can I use local models?',
    answer: 'Yes! DebateForge supports Ollama and LM Studio for running local models. Install Ollama or LM Studio, download a model (like Llama 3, DeepSeek, or Mistral), and configure the endpoint in Settings. Local models run entirely on your machine with no API costs.',
    icon: Server,
  },
  {
    question: 'How do I export debates?',
    answer: 'Go to Settings > Data and click "Export Debates" to download all debates as a JSON file. You can also export individual debates using the export button within each debate view. DebateForge also supports HTML export for sharing formatted debate transcripts.',
    icon: Download,
  },
  {
    question: 'What debate formats are available?',
    answer: 'DebateForge offers three debate formats: Oxford Union (formal, multi-round with opening, rebuttal, and closing), Lincoln-Douglas (one-on-one philosophical debate), and Parliamentary (team-based government vs. opposition). Each has unique rules and turn structures.',
    icon: BookOpen,
  },
  {
    question: 'How does evidence verification work?',
    answer: 'During a debate, the evidence panel analyzes claims made by each debater. It checks factual accuracy, evaluates source credibility, classifies evidence types (statistical, anecdotal, expert testimony), and assigns confidence scores. This helps identify which arguments are well-supported.',
    icon: Shield,
  },
  {
    question: 'Is DebateForge free?',
    answer: 'DebateForge itself is free and open-source under the MIT License. However, using cloud AI models (Anthropic, OpenAI, Google) requires API keys from those providers, which may incur costs based on their pricing. Using local models through Ollama or LM Studio is completely free.',
    icon: Star,
  },
];

/* ─── Keycap Component ────────────────────────────────────────────────────── */

const Keycap: React.FC<{ label: string }> = ({ label }) => (
  <kbd
    className={clsx(
      'inline-flex min-w-[1.75rem] items-center justify-center rounded-md',
      'border border-gray-300 bg-gray-100 px-1.5 py-0.5',
      'text-[11px] font-semibold leading-none text-gray-600',
      'shadow-[0_1px_0_1px_rgba(0,0,0,0.08)]',
      'dark:border-surface-dark-4 dark:bg-surface-dark-3',
      'dark:text-gray-300 dark:shadow-[0_1px_0_1px_rgba(0,0,0,0.4)]',
    )}
  >
    {label}
  </kbd>
);

/* ─── FAQ Accordion Item ──────────────────────────────────────────────────── */

const FAQAccordion: React.FC<{
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ item, isOpen, onToggle }) => {
  const Icon = item.icon;
  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        isOpen
          ? 'border-forge-200 bg-forge-50/50 shadow-sm dark:border-forge-800/40 dark:bg-forge-900/10'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4',
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={isOpen}
      >
        <div
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
            isOpen
              ? 'bg-forge-100 dark:bg-forge-900/30'
              : 'bg-gray-100 dark:bg-surface-dark-2',
          )}
        >
          <Icon
            className={clsx(
              'h-4 w-4 transition-colors',
              isOpen ? 'text-forge-600 dark:text-forge-400' : 'text-gray-500 dark:text-gray-400',
            )}
          />
        </div>
        <span
          className={clsx(
            'flex-1 text-sm font-medium transition-colors',
            isOpen ? 'text-forge-700 dark:text-forge-300' : 'text-gray-800 dark:text-gray-200',
          )}
        >
          {item.question}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-forge-500 dark:text-forge-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {/* Expandable answer */}
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-4 pb-4 pl-[3.75rem]">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Help View ───────────────────────────────────────────────────────────── */

const HelpView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQs, setOpenFAQs] = useState<Set<number>>(new Set());

  const toggleFAQ = useCallback((index: number) => {
    setOpenFAQs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Filter content by search query
  const query = searchQuery.toLowerCase().trim();

  const filteredGettingStarted = useMemo(() => {
    if (!query) return GETTING_STARTED;
    return GETTING_STARTED.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.steps.some((s) => s.toLowerCase().includes(query)),
    );
  }, [query]);

  const filteredFAQs = useMemo(() => {
    if (!query) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query),
    );
  }, [query]);

  const filteredShortcuts = useMemo(() => {
    if (!query) return DEFAULT_SHORTCUTS;
    return DEFAULT_SHORTCUTS.filter(
      (s) =>
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.key.toLowerCase().includes(query),
    );
  }, [query]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, typeof DEFAULT_SHORTCUTS> = {};
    for (const s of filteredShortcuts) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filteredShortcuts]);

  const hasResults = filteredGettingStarted.length > 0 || filteredFAQs.length > 0 || filteredShortcuts.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forge-100 dark:bg-forge-900/30">
            <HelpCircle className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help Center</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Everything you need to know about DebateForge
            </p>
          </div>
        </div>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help topics, shortcuts, and FAQs..."
            className={clsx(
              'w-full rounded-xl border py-3 pl-12 pr-4 text-sm',
              'border-gray-200 bg-white text-gray-900 placeholder-gray-400',
              'focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20',
              'dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:text-gray-100',
              'dark:placeholder-gray-500 dark:focus:border-forge-400 dark:focus:ring-forge-400/20',
              'transition-colors duration-150 shadow-sm',
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="text-xs font-medium">Clear</span>
            </button>
          )}
        </div>
        {query && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {hasResults
              ? `Showing results for "${searchQuery}"`
              : `No results found for "${searchQuery}"`}
          </p>
        )}
      </div>

      {/* ── No Results ───────────────────────────────────────────────────── */}
      {query && !hasResults && (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No matching help topics found
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Try different keywords or browse the sections below
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-sm font-medium text-forge-600 hover:text-forge-700 dark:text-forge-400 dark:hover:text-forge-300 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* ── Getting Started ──────────────────────────────────────────────── */}
      {filteredGettingStarted.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-forge-600 dark:text-forge-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Getting Started</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredGettingStarted.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="group">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110', item.bgColor)}>
                      <Icon className={clsx('h-5 w-5', item.color)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <ol className="ml-1 space-y-2">
                    {item.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                        <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold', item.bgColor, item.color)}>
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {filteredFAQs.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-forge-600 dark:text-forge-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Frequently Asked Questions
              </h2>
            </div>
            {openFAQs.size > 0 && (
              <button
                onClick={() => setOpenFAQs(new Set())}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                Collapse all
              </button>
            )}
          </div>
          <div className="space-y-2">
            {filteredFAQs.map((item, index) => {
              // Find the original index in FAQ_ITEMS for stable open state
              const originalIndex = FAQ_ITEMS.indexOf(item);
              return (
                <FAQAccordion
                  key={item.question}
                  item={item}
                  isOpen={openFAQs.has(originalIndex)}
                  onToggle={() => toggleFAQ(originalIndex)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Keyboard Shortcuts ───────────────────────────────────────────── */}
      {filteredShortcuts.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-forge-600 dark:text-forge-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-2">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Category
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Action
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Shortcut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  {Object.entries(groupedShortcuts).map(([category, shortcuts]) =>
                    shortcuts.map((shortcut, i) => {
                      const parts = formatKey(shortcut);
                      return (
                        <tr
                          key={`${category}-${i}`}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2"
                        >
                          <td className="px-4 py-2.5">
                            {i === 0 ? (
                              <Badge variant="default" size="sm">{category}</Badge>
                            ) : (
                              <span className="text-xs text-transparent">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                            {shortcut.description}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              {parts.map((part, j) => (
                                <React.Fragment key={j}>
                                  {j > 0 && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
                                  )}
                                  <Keycap label={part} />
                                </React.Fragment>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Press <Keycap label="?" /> anywhere in the app to open the shortcuts panel.
          </p>
        </section>
      )}

      {/* ── Contact / Feedback ───────────────────────────────────────────── */}
      <section className="mb-8">
        <Card variant="gradient" className="relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start sm:gap-4">
            <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forge-100 dark:bg-forge-900/30 sm:mb-0">
              <Lightbulb className="h-6 w-6 text-forge-600 dark:text-forge-400" />
            </div>
            <div className="flex-1">
              <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                Still need help?
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Can't find what you're looking for? Report issues, request features, or
                start a discussion on GitHub.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href="https://github.com/debateforge/debateforge/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    'bg-forge-600 text-white hover:bg-forge-700 shadow-sm',
                  )}
                >
                  <Bug className="h-4 w-4" />
                  Report an Issue
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://github.com/debateforge/debateforge/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    'border border-gray-300 text-gray-700 hover:bg-gray-50',
                    'dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2',
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  Join Discussion
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-forge-200/20 blur-3xl dark:bg-forge-800/10" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-purple-200/20 blur-3xl dark:bg-purple-800/10" />
        </Card>
      </section>
    </div>
  );
};

export default HelpView;
