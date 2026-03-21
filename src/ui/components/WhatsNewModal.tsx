import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Rocket,
  Zap,
  Wrench,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EntryKind = 'new' | 'improved' | 'fixed';

interface ChangelogEntry {
  kind: EntryKind;
  text: string;
}

interface VersionBlock {
  version: string;
  date: string;
  title: string;
  entries: ChangelogEntry[];
}

// ---------------------------------------------------------------------------
// Changelog data
// ---------------------------------------------------------------------------

const CHANGELOG: VersionBlock[] = [
  {
    version: '1.0.0',
    date: 'March 2026',
    title: 'Initial Release',
    entries: [
      { kind: 'new', text: 'Multi-model AI debate arena with support for Anthropic, OpenAI, Google, Mistral, Groq, and local models via Ollama & LM Studio' },
      { kind: 'new', text: 'Oxford Union, Lincoln-Douglas, and Parliamentary debate formats with configurable turn sequences' },
      { kind: 'new', text: 'Custom persona system with 8 built-in personas, each with unique rhetorical styles and argumentation preferences' },
      { kind: 'new', text: 'Evidence verification with credibility scoring across peer-reviewed, government, news, and social media sources' },
      { kind: 'new', text: 'Logical fallacy detection covering 14+ patterns including ad hominem, straw man, false dichotomy, and appeal to authority' },
      { kind: 'new', text: 'ELO rating system and leaderboard tracking model performance across debates' },
      { kind: 'new', text: 'Tournament mode with single-elimination and round-robin brackets' },
      { kind: 'new', text: 'Voice synthesis for debate playback with per-debater voice configuration' },
      { kind: 'new', text: 'Dark mode with system preference support and smooth theme transitions' },
      { kind: 'new', text: 'Debate bookmarks, notes, and tagging system for organizing past debates' },
      { kind: 'new', text: 'HTML and Markdown export for sharing debates outside the app' },
      { kind: 'new', text: 'Audience reaction panel with live polling and momentum graph' },
      { kind: 'new', text: 'Debate replay mode for step-by-step review of completed debates' },
      { kind: 'new', text: 'Debate templates for quick-start common topic categories' },
      { kind: 'improved', text: 'Command palette (Cmd+K / Ctrl+K) for quick navigation across all views' },
      { kind: 'improved', text: 'Keyboard shortcuts throughout the app with discoverable shortcut panel' },
      { kind: 'improved', text: 'Streaming responses with visible thinking blocks for supported models' },
      { kind: 'improved', text: 'Responsive layout with collapsible sidebar and scroll progress indicator' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Badge styles per entry kind
// ---------------------------------------------------------------------------

const kindConfig: Record<
  EntryKind,
  { label: string; bg: string; icon: React.FC<{ className?: string }> }
> = {
  new: {
    label: 'New',
    bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: Rocket,
  },
  improved: {
    label: 'Improved',
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Zap,
  },
  fixed: {
    label: 'Fixed',
    bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Wrench,
  },
};

// ---------------------------------------------------------------------------
// EntryBadge
// ---------------------------------------------------------------------------

const EntryBadge: React.FC<{ kind: EntryKind }> = ({ kind }) => {
  const cfg = kindConfig[kind];
  const Icon = cfg.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-none shrink-0',
        cfg.bg,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// VersionSection (collapsible)
// ---------------------------------------------------------------------------

const VersionSection: React.FC<{
  block: VersionBlock;
  defaultOpen?: boolean;
}> = ({ block, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [block.entries]);

  return (
    <div className="overflow-hidden">
      {/* Version header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          'flex w-full items-center justify-between rounded-xl px-4 py-3',
          'transition-colors duration-150',
          'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              'bg-forge-100 text-forge-600',
              'dark:bg-forge-900/30 dark:text-forge-400',
            )}
          >
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              v{block.version}{' '}
              <span className="font-normal text-gray-500 dark:text-gray-400">
                &mdash; {block.title}
              </span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {block.date}
            </p>
          </div>
        </div>

        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {/* Animated entries container */}
      <div
        style={{
          maxHeight: isOpen ? (contentHeight === 'auto' ? '9999px' : contentHeight) : 0,
          opacity: isOpen ? 1 : 0,
        }}
        className="transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div ref={contentRef} className="space-y-1 px-2 pb-2 pt-1">
          {block.entries.map((entry, idx) => (
            <div
              key={idx}
              className={clsx(
                'flex items-start gap-3 rounded-lg px-3 py-2',
                'transition-colors duration-100',
                'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
              )}
            >
              <div className="mt-0.5">
                <EntryBadge kind={entry.kind} />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {entry.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WhatsNewModal
// ---------------------------------------------------------------------------

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Close on Escape ────────────────────────────────────────────────────
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  // ── Overlay click ──────────────────────────────────────────────────────
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  // Compute summary counts
  const allEntries = CHANGELOG.flatMap((b) => b.entries);
  const newCount = allEntries.filter((e) => e.kind === 'new').length;
  const improvedCount = allEntries.filter((e) => e.kind === 'improved').length;
  const fixedCount = allEntries.filter((e) => e.kind === 'fixed').length;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-[60] flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'animate-fade-in',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="What's new"
    >
      <div
        className={clsx(
          'w-full max-w-2xl rounded-2xl border shadow-2xl',
          'border-gray-200 bg-white',
          'dark:border-surface-dark-3 dark:bg-surface-dark-1',
          'animate-slide-up',
          'flex flex-col max-h-[80vh]',
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-surface-dark-3">
          <div className="flex items-center gap-2.5">
            <div
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'bg-forge-100 text-forge-600',
                'dark:bg-forge-900/30 dark:text-forge-400',
              )}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                What&apos;s New
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Changelog &amp; release notes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={clsx(
              'rounded-lg p-1.5 text-gray-400 transition-colors',
              'hover:bg-gray-100 hover:text-gray-600',
              'dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Summary strip ──────────────────────────────────────────────── */}
        <div
          className={clsx(
            'flex items-center gap-4 border-b px-6 py-3',
            'border-gray-200 dark:border-surface-dark-3',
          )}
        >
          {newCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {newCount} new
              </span>
            </div>
          )}
          {improvedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {improvedCount} improved
              </span>
            </div>
          )}
          {fixedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {fixedCount} fixed
              </span>
            </div>
          )}
        </div>

        {/* ── Version list ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {CHANGELOG.map((block, idx) => (
              <VersionSection
                key={block.version}
                block={block}
                defaultOpen={idx === 0}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className={clsx(
            'flex items-center justify-between border-t px-6 py-3',
            'border-gray-200 dark:border-surface-dark-3',
          )}
        >
          <p className="text-xs text-gray-400 dark:text-gray-500">
            DebateForge v{CHANGELOG[0].version}
          </p>
          <button
            onClick={onClose}
            className={clsx(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              'bg-forge-600 text-white hover:bg-forge-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
              'dark:focus-visible:ring-offset-surface-dark-0',
            )}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
