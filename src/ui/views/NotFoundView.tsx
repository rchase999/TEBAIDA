import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Home, Swords, MessageSquare } from 'lucide-react';
import { Button } from '../components/Button';
import { ConfettiEffect } from '../components/ConfettiEffect';

/* ─── Props ───────────────────────────────────────────────────────────────── */

interface NotFoundViewProps {
  onNavigateHome: () => void;
  onNewDebate: () => void;
}

/* ─── Speech Bubble Animation ─────────────────────────────────────────────── */

const SpeechBubbles: React.FC = () => (
  <div className="relative mx-auto mb-8 flex h-32 w-56 items-center justify-center">
    {/* Left bubble */}
    <div
      className={clsx(
        'absolute left-4 top-2',
        'animate-bounce',
      )}
      style={{ animationDuration: '2.5s', animationDelay: '0s' }}
    >
      <div className="relative rounded-2xl rounded-bl-sm border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm dark:border-blue-800 dark:bg-blue-900/30">
        <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
      </div>
    </div>

    {/* Right bubble */}
    <div
      className={clsx(
        'absolute right-4 top-2',
        'animate-bounce',
      )}
      style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}
    >
      <div className="relative rounded-2xl rounded-br-sm border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm dark:border-rose-800 dark:bg-rose-900/30">
        <MessageSquare className="h-5 w-5 text-rose-500 dark:text-rose-400" />
      </div>
    </div>

    {/* Question mark in the middle */}
    <div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-pulse"
      style={{ animationDuration: '2s' }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-surface-dark-2">
        <span className="text-2xl font-black text-gray-400 dark:text-gray-500">?</span>
      </div>
    </div>
  </div>
);

/* ─── Not Found View ──────────────────────────────────────────────────────── */

const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigateHome, onNewDebate }) => {
  const [clickCount, setClickCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleEasterEgg = useCallback(() => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      setShowConfetti(true);
      setClickCount(0);
    }
  }, [clickCount]);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="relative w-full max-w-lg text-center">
        {/* Background glow */}
        <div className="absolute -top-20 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-forge-500/5 blur-3xl dark:bg-forge-500/10" />

        {/* 404 Text - Easter egg trigger */}
        <button
          onClick={handleEasterEgg}
          className="group mb-2 select-none outline-none focus-visible:outline-none"
          aria-label="404 error code"
          title={clickCount >= 3 ? 'Keep clicking...' : undefined}
        >
          <span
            className={clsx(
              'inline-block text-[8rem] font-black leading-none tracking-tighter',
              'bg-gradient-to-br from-forge-500 via-purple-500 to-rose-500 bg-clip-text text-transparent',
              'transition-transform duration-200 group-hover:scale-105',
              'cursor-pointer',
            )}
          >
            404
          </span>
        </button>

        {/* Hint for easter egg */}
        {clickCount >= 3 && clickCount < 5 && (
          <p className="mb-2 text-xs text-forge-500 dark:text-forge-400 animate-pulse">
            {5 - clickCount} more click{5 - clickCount !== 1 ? 's' : ''}...
          </p>
        )}

        {/* Heading */}
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Page not found
        </h1>

        {/* Subtitle with debate pun */}
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          Looks like this argument doesn't exist. Even the best debaters
          can't defend a page that was never written.
        </p>

        {/* Animated speech bubbles */}
        <SpeechBubbles />

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={onNavigateHome}
            icon={<Home className="h-5 w-5" />}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onNewDebate}
            icon={<Swords className="h-5 w-5" />}
          >
            Start a Debate
          </Button>
        </div>

        {/* Subtle footer text */}
        <p className="mt-10 text-xs text-gray-300 dark:text-gray-600">
          Error 404 &middot; The requested page could not be found
        </p>

        {/* Confetti easter egg */}
        <ConfettiEffect trigger={showConfetti} onComplete={handleConfettiComplete} />
      </div>
    </div>
  );
};

export default NotFoundView;
