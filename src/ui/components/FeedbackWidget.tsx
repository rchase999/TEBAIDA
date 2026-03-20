import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  HelpCircle,
  X,
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedbackCategory = 'bug' | 'feature' | 'feedback';

interface CategoryConfig {
  id: FeedbackCategory;
  label: string;
  description: string;
  placeholder: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  hoverBg: string;
  iconBg: string;
}

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'bug',
    label: 'Report a Bug',
    description: 'Something isn\'t working as expected',
    placeholder: 'Describe what happened, what you expected, and steps to reproduce...',
    icon: Bug,
    color: 'text-red-600 dark:text-red-400',
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/10',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
  },
  {
    id: 'feature',
    label: 'Request a Feature',
    description: 'Suggest an improvement or new capability',
    placeholder: 'Describe the feature you\'d like, why it would be useful, and any ideas for how it could work...',
    icon: Lightbulb,
    color: 'text-purple-600 dark:text-purple-400',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/10',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: 'feedback',
    label: 'Send Feedback',
    description: 'General thoughts, praise, or suggestions',
    placeholder: 'Share your thoughts about DebateForge...',
    icon: MessageSquare,
    color: 'text-blue-600 dark:text-blue-400',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/10',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
];

// ---------------------------------------------------------------------------
// Toast notification (inline)
// ---------------------------------------------------------------------------

const SuccessToast: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div
    className={clsx(
      'absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl',
      'bg-white dark:bg-surface-dark-1',
      'transition-all duration-300',
      visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
    )}
  >
    <div
      className={clsx(
        'flex h-14 w-14 items-center justify-center rounded-full',
        'bg-emerald-100 dark:bg-emerald-900/30',
      )}
    >
      <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
    </div>
    <p className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">
      Thank you!
    </p>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Your feedback has been received.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// FeedbackWidget
// ---------------------------------------------------------------------------

export const FeedbackWidget: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Focus textarea when category is selected ───────────────────────────
  useEffect(() => {
    if (selectedCategory && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [selectedCategory]);

  // ── Close on Escape ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    if (isPanelOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setIsPanelOpen(false);
    // Reset state after close animation completes
    setTimeout(() => {
      setSelectedCategory(null);
      setMessage('');
      setShowSuccess(false);
    }, 300);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose();
  };

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || !selectedCategory) return;

    setIsSubmitting(true);

    // Simulate a brief submission delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Auto-close after showing success
    setTimeout(() => {
      handleClose();
    }, 2000);
  }, [message, selectedCategory, handleClose]);

  const handleBack = () => {
    setSelectedCategory(null);
    setMessage('');
  };

  const activeCfg = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsPanelOpen(true)}
        className={clsx(
          'fixed bottom-5 left-5 z-40',
          'flex h-11 w-11 items-center justify-center rounded-full',
          'bg-forge-600 text-white shadow-lg',
          'transition-all duration-200',
          'hover:bg-forge-700 hover:shadow-xl hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-surface-dark-0',
          isPanelOpen && 'opacity-0 pointer-events-none scale-90',
        )}
        aria-label="Send feedback"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className={clsx(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
          'transition-opacity duration-300',
          isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!isPanelOpen}
      />

      {/* ── Slide-out panel ─────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={clsx(
          'fixed bottom-0 left-0 top-0 z-50 w-full max-w-md',
          'flex flex-col',
          'border-r border-gray-200 bg-white shadow-2xl',
          'dark:border-surface-dark-3 dark:bg-surface-dark-1',
          'transition-transform duration-300 ease-out',
          isPanelOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Feedback panel"
      >
        {/* ── Panel header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-surface-dark-3">
          <div className="flex items-center gap-3">
            {selectedCategory && (
              <button
                onClick={handleBack}
                className={clsx(
                  'rounded-lg p-1.5 text-gray-400 transition-colors',
                  'hover:bg-gray-100 hover:text-gray-600',
                  'dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
                )}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {activeCfg ? activeCfg.label : 'Feedback'}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {activeCfg
                  ? activeCfg.description
                  : 'We\'d love to hear from you'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
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

        {/* ── Panel body ────────────────────────────────────────────────── */}
        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          {/* Success overlay */}
          <SuccessToast visible={showSuccess} />

          {!selectedCategory ? (
            /* ── Category picker ──────────────────────────────────────── */
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                How can we help? Choose a category below.
              </p>

              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={clsx(
                      'flex w-full items-center gap-4 rounded-xl border p-4 text-left',
                      'border-gray-200 dark:border-surface-dark-3',
                      'transition-all duration-150',
                      cat.hoverBg,
                      'hover:shadow-sm hover:border-gray-300 dark:hover:border-surface-dark-4',
                    )}
                  >
                    <div
                      className={clsx(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        cat.iconBg,
                      )}
                    >
                      <Icon className={clsx('h-5 w-5', cat.color)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── Message form ─────────────────────────────────────────── */
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="feedback-message"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your message
                </label>
                <textarea
                  ref={textareaRef}
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeCfg?.placeholder}
                  rows={8}
                  className={clsx(
                    'block w-full resize-none rounded-lg border px-3 py-2.5 text-sm',
                    'border-gray-300 bg-white text-gray-900 placeholder-gray-400',
                    'focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/30',
                    'dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-100',
                    'dark:placeholder-gray-500 dark:focus:border-forge-400 dark:focus:ring-forge-400/30',
                    'transition-colors duration-150',
                  )}
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {message.length > 0 ? `${message.length} characters` : 'Be as detailed as you like'}
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className={clsx(
                  'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
                  'bg-forge-600 text-white shadow-sm',
                  'transition-colors duration-150',
                  'hover:bg-forge-700 active:bg-forge-800',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
                  'dark:focus-visible:ring-offset-surface-dark-0',
                  'disabled:opacity-50 disabled:pointer-events-none',
                )}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Panel footer ──────────────────────────────────────────────── */}
        <div
          className={clsx(
            'border-t px-6 py-3 text-center text-xs',
            'border-gray-200 text-gray-400',
            'dark:border-surface-dark-3 dark:text-gray-500',
          )}
        >
          Your feedback helps make DebateForge better
        </div>
      </div>
    </>
  );
};

export default FeedbackWidget;
