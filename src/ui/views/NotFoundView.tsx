import React, { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import {
  Home, Swords, MessageSquare, Search, Trophy,
  Gavel, Sparkles,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ConfettiEffect } from '../components/ConfettiEffect';

/* ------------------------------------------------------------------ */
/*  Floating Speech Bubbles (CSS-only animation)                      */
/* ------------------------------------------------------------------ */

const BUBBLE_DATA = [
  { text: 'Therefore...', color: 'blue', delay: 0, x: 15, startY: 60 },
  { text: 'However!', color: 'rose', delay: 1.2, x: 75, startY: 70 },
  { text: 'I object!', color: 'amber', delay: 2.4, x: 40, startY: 80 },
  { text: 'Consider...', color: 'emerald', delay: 0.8, x: 60, startY: 55 },
  { text: 'Indeed?', color: 'purple', delay: 1.8, x: 25, startY: 75 },
] as const;

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  blue: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  rose: {
    border: 'border-rose-200 dark:border-rose-800',
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    border: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

const FloatingBubbles: React.FC = () => (
  <div className="pointer-events-none relative mx-auto mb-6 h-40 w-full max-w-md overflow-hidden">
    {BUBBLE_DATA.map((b, i) => {
      const c = colorMap[b.color];
      return (
        <div
          key={i}
          className={clsx(
            'absolute rounded-2xl rounded-bl-sm border px-3 py-2 shadow-sm',
            c.border,
            c.bg,
          )}
          style={{
            left: `${b.x}%`,
            bottom: '0%',
            animation: `notfound-float 6s ease-in-out ${b.delay}s infinite`,
            opacity: 0,
          }}
        >
          <span className={clsx('text-xs font-medium', c.text)}>{b.text}</span>
        </div>
      );
    })}

    <style>{`
      @keyframes notfound-float {
        0% { transform: translateY(0) scale(0.8); opacity: 0; }
        10% { opacity: 0.9; transform: translateY(-20px) scale(1); }
        50% { opacity: 0.7; transform: translateY(-80px) scale(0.95) rotate(-3deg); }
        80% { opacity: 0.3; transform: translateY(-120px) scale(0.85) rotate(2deg); }
        100% { opacity: 0; transform: translateY(-150px) scale(0.7); }
      }
    `}</style>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Gavel Easter Egg                                                  */
/* ------------------------------------------------------------------ */

interface GavelGameProps {
  onAchievement: () => void;
}

const GavelGame: React.FC<GavelGameProps> = ({ onAchievement }) => {
  const [count, setCount] = useState(0);
  const [isBanging, setIsBanging] = useState(false);
  const [achieved, setAchieved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (achieved) return;

    setIsBanging(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsBanging(false), 200);

    const next = count + 1;
    setCount(next);

    if (next >= 10) {
      setAchieved(true);
      onAchievement();
    }
  }, [count, achieved, onAchievement]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className={clsx(
          'group relative flex h-12 w-12 items-center justify-center rounded-full',
          'bg-gray-100 dark:bg-surface-dark-2',
          'transition-all duration-150 hover:bg-gray-200 dark:hover:bg-surface-dark-3',
          'outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
          achieved && 'cursor-default',
        )}
        title={achieved ? 'Achievement unlocked!' : 'Click the gavel...'}
        aria-label="Click the gavel"
      >
        <Gavel
          className={clsx(
            'h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-150',
            isBanging && 'scale-125 -rotate-12 text-forge-600 dark:text-forge-400',
          )}
        />
        {isBanging && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forge-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-forge-500" />
          </span>
        )}
      </button>

      {count > 0 && !achieved && (
        <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500 animate-pulse">
          {count}/10
        </span>
      )}

      {achieved && (
        <div className="flex items-center gap-1.5 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Persistent Debater!
          </span>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main NotFoundView                                                 */
/* ------------------------------------------------------------------ */

const NotFoundView: React.FC = () => {
  const setCurrentView = useStore((s) => s.setCurrentView);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        setCurrentView('home');
      }
    },
    [searchQuery, setCurrentView],
  );

  const handleAchievement = useCallback(() => {
    setShowConfetti(true);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  }, []);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return (
    <div className="relative flex min-h-full items-center justify-center px-6 py-16 animate-fade-in">
      <div className="relative w-full max-w-xl text-center">
        {/* Background glow */}
        <div className="absolute -top-32 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-forge-500/5 blur-3xl dark:bg-forge-500/10" />
        <div className="absolute -top-16 left-1/4 -z-10 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl dark:bg-purple-500/8" />

        {/* Large 404 text with gradient */}
        <div className="mb-2 select-none">
          <span
            className={clsx(
              'inline-block text-[10rem] font-black leading-none tracking-tighter',
              'bg-gradient-to-br from-forge-500 via-purple-500 to-rose-500 bg-clip-text text-transparent',
              'drop-shadow-sm',
            )}
          >
            404
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          This debate doesn&apos;t exist&hellip; yet
        </h1>

        {/* Subtitle */}
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          The page you&apos;re looking for has left the arena.
        </p>

        {/* Floating speech bubbles */}
        <FloatingBubbles />

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mx-auto mb-8 flex max-w-sm gap-2">
          <Input
            placeholder="Search debates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        {/* Quick navigation buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={() => setCurrentView('home')}
            icon={<Home className="h-5 w-5" />}
          >
            Go Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentView('setup')}
            icon={<Swords className="h-5 w-5" />}
          >
            Start a Debate
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setCurrentView('leaderboard')}
            icon={<Trophy className="h-5 w-5" />}
          >
            View Leaderboard
          </Button>
        </div>

        {/* Gavel easter egg */}
        <GavelGame onAchievement={handleAchievement} />

        {/* Footer text */}
        <p className="mt-10 text-xs text-gray-300 dark:text-gray-600">
          Error 404 &middot; The requested page could not be found
        </p>

        {/* Confetti */}
        <ConfettiEffect active={showConfetti} onComplete={handleConfettiComplete} />

        {/* Achievement toast */}
        {toastVisible && (
          <div
            className={clsx(
              'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
              'flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-xl',
              'dark:border-amber-800/50 dark:bg-amber-900/30',
              'animate-fade-in',
            )}
          >
            <Sparkles className="h-5 w-5 text-amber-500" />
            <div className="text-left">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Achievement Unlocked: Persistent Debater!
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                You clicked the gavel 10 times. Tenacity rewarded!
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default NotFoundView;
