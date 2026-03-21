import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  Wrench, HardHat, Clock, FileText, Mail,
  CheckCircle, ArrowRight, Hammer, Settings,
  Cog,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

/* ------------------------------------------------------------------ */
/*  Construction Illustration                                         */
/* ------------------------------------------------------------------ */

const ConstructionScene: React.FC = () => (
  <div className="relative mx-auto mb-8 flex h-36 w-72 items-center justify-center overflow-hidden">
    {/* Rotating cog left */}
    <div
      className="absolute left-6 top-4"
      style={{ animation: 'cog-spin 4s linear infinite' }}
    >
      <Cog className="h-10 w-10 text-gray-300 dark:text-gray-600" />
    </div>

    {/* Rotating cog right (counter) */}
    <div
      className="absolute right-8 top-8"
      style={{ animation: 'cog-spin-reverse 3s linear infinite' }}
    >
      <Settings className="h-8 w-8 text-gray-300 dark:text-gray-600" />
    </div>

    {/* Central hard hat */}
    <div className="relative z-10 flex flex-col items-center">
      <div
        className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30"
        style={{ animation: 'hat-bob 2s ease-in-out infinite' }}
      >
        <HardHat className="h-9 w-9 text-amber-600 dark:text-amber-400" />
      </div>
    </div>

    {/* Floating wrench */}
    <div
      className="absolute bottom-2 left-16"
      style={{ animation: 'wrench-wobble 3s ease-in-out 0.5s infinite' }}
    >
      <Wrench className="h-6 w-6 text-gray-400 dark:text-gray-500" />
    </div>

    {/* Floating hammer */}
    <div
      className="absolute bottom-4 right-16"
      style={{ animation: 'wrench-wobble 3s ease-in-out 1s infinite' }}
    >
      <Hammer className="h-6 w-6 text-gray-400 dark:text-gray-500" />
    </div>

    <style>{`
      @keyframes cog-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes cog-spin-reverse {
        from { transform: rotate(360deg); }
        to { transform: rotate(0deg); }
      }
      @keyframes hat-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes wrench-wobble {
        0%, 100% { transform: rotate(0deg) translateY(0); }
        25% { transform: rotate(-8deg) translateY(-4px); }
        75% { transform: rotate(8deg) translateY(-2px); }
      }
    `}</style>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Animated Progress Bar                                             */
/* ------------------------------------------------------------------ */

const AnimatedProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        // Randomized increment for a realistic feel
        return Math.min(100, prev + Math.random() * 3 + 0.5);
      });
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="mx-auto mb-8 w-full max-w-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Upgrading systems...
        </span>
        <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forge-500 via-purple-500 to-forge-500 transition-all duration-200 ease-out"
          style={{
            width: `${progress}%`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  MaintenanceView                                                   */
/* ------------------------------------------------------------------ */

const MaintenanceView: React.FC = () => {
  const setCurrentView = useStore((s) => s.setCurrentView);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (email.trim() && email.includes('@')) {
        setSubscribed(true);
      }
    },
    [email],
  );

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16 animate-fade-in">
      <div className="relative w-full max-w-lg text-center">
        {/* Background glow */}
        <div className="absolute -top-20 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/5 blur-3xl dark:bg-amber-500/10" />

        {/* Construction illustration */}
        <ConstructionScene />

        {/* Heading */}
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          We&apos;re upgrading the arena
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          DebateForge is getting some improvements. We&apos;ll be back shortly.
        </p>

        {/* Estimated return time */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-surface-dark-3 dark:bg-surface-dark-2">
          <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Estimated return:{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ~30 minutes
            </span>
          </span>
        </div>

        {/* Animated progress bar */}
        <AnimatedProgressBar />

        {/* Changelog link */}
        <div className="mb-8">
          <button
            onClick={() => setCurrentView('changelog')}
            className={clsx(
              'inline-flex items-center gap-1.5 text-sm font-medium',
              'text-forge-600 hover:text-forge-700 dark:text-forge-400 dark:hover:text-forge-300',
              'transition-colors',
            )}
          >
            <FileText className="h-4 w-4" />
            Check our changelog
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Subscribe for updates */}
        <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-surface-dark-3 dark:bg-surface-dark-2">
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Get notified when we&apos;re back
          </h3>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Subscribe to receive an update when DebateForge is live again.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-3 dark:bg-emerald-900/20">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                You&apos;ll be notified!
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
              />
              <Button type="submit" variant="primary" size="md">
                Subscribe
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-gray-300 dark:text-gray-600">
          Scheduled maintenance &middot; DebateForge
        </p>
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

export default MaintenanceView;
