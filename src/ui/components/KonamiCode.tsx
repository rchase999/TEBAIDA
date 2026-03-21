import React, { useEffect, useState, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { Terminal, Sparkles, X } from 'lucide-react';
import { ConfettiEffect } from './ConfettiEffect';

/** The classic Konami Code key sequence. */
const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

export interface KonamiCodeProps {
  /** Optional callback when the retro/hacker theme is toggled. */
  onRetroToggle?: (enabled: boolean) => void;
}

/**
 * Easter egg component that listens for the Konami code.
 * When the sequence is entered correctly, displays a fun overlay
 * with confetti and an optional retro/hacker theme toggle.
 * Auto-dismisses after 5 seconds or on click.
 */
export const KonamiCode: React.FC<KonamiCodeProps> = ({ onRetroToggle }) => {
  const [activated, setActivated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [retroMode, setRetroMode] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const sequenceIndex = useRef(0);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setActivated(false);
      setShowConfetti(false);
      setIsExiting(false);
    }, 300);

    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
  }, []);

  const activate = useCallback(() => {
    setActivated(true);
    setShowConfetti(true);

    // Auto-dismiss after 5 seconds
    autoDismissTimer.current = setTimeout(() => {
      dismiss();
    }, 5000);
  }, [dismiss]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If overlay is showing, dismiss on any key
      if (activated) {
        dismiss();
        return;
      }

      const expected = KONAMI_SEQUENCE[sequenceIndex.current];

      if (e.key === expected || e.key.toLowerCase() === expected) {
        sequenceIndex.current++;

        if (sequenceIndex.current === KONAMI_SEQUENCE.length) {
          sequenceIndex.current = 0;
          activate();
        }
      } else {
        // Reset on wrong key
        sequenceIndex.current = 0;
        // Check if this wrong key matches the start of the sequence
        if (e.key === KONAMI_SEQUENCE[0]) {
          sequenceIndex.current = 1;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [activated, activate, dismiss]);

  const handleRetroToggle = () => {
    const next = !retroMode;
    setRetroMode(next);
    onRetroToggle?.(next);
  };

  if (!activated) return null;

  return (
    <>
      <ConfettiEffect
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Overlay backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-[9998] flex items-center justify-center',
          'bg-black/60 backdrop-blur-sm cursor-pointer',
          isExiting ? 'animate-fade-out' : 'animate-fade-in',
        )}
        onClick={dismiss}
        role="dialog"
        aria-modal="true"
        aria-label="Secret easter egg discovered"
      >
        {/* Modal card */}
        <div
          className={clsx(
            'relative max-w-sm w-full mx-4 p-6 rounded-2xl shadow-2xl',
            'bg-white dark:bg-surface-dark-1',
            'border border-gray-200 dark:border-surface-dark-3',
            'text-center cursor-default',
            isExiting ? 'animate-fade-out' : 'animate-slide-up',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className={clsx(
              'absolute top-3 right-3 p-1 rounded-lg',
              'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-surface-dark-2',
              'transition-colors duration-150',
            )}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={clsx(
                'h-16 w-16 rounded-full flex items-center justify-center',
                'bg-gradient-to-br from-forge-500 to-purple-500',
                'shadow-lg shadow-forge-500/30',
              )}
            >
              <Sparkles size={32} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            You found the secret!
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            The Konami code never gets old.
          </p>

          {/* Retro / hacker theme toggle */}
          <button
            onClick={handleRetroToggle}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'text-sm font-medium transition-all duration-200',
              retroMode
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
                : 'bg-gray-100 dark:bg-surface-dark-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-dark-3',
            )}
          >
            <Terminal size={16} />
            {retroMode ? 'Hacker mode ON' : 'Enable hacker mode'}
          </button>

          {/* Fun ASCII art */}
          <pre className="mt-4 text-[10px] leading-tight text-gray-300 dark:text-surface-dark-4 font-mono select-none">
            {`  ↑ ↑ ↓ ↓ ← → ← → B A`}
          </pre>
        </div>
      </div>

      {/* Inline styles for fade-out since Tailwind config only has fade-in */}
      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>
    </>
  );
};

export default KonamiCode;
