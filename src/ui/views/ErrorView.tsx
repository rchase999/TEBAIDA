import React, { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import {
  AlertTriangle, Home, RefreshCw, ChevronDown,
  ChevronUp, Bug, MessageSquare, Copy, Check,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';

/* ------------------------------------------------------------------ */
/*  Crashing Bubbles Illustration                                     */
/* ------------------------------------------------------------------ */

const CrashingBubbles: React.FC = () => (
  <div className="relative mx-auto mb-8 flex h-28 w-64 items-center justify-center overflow-hidden">
    {/* Left bubble "!?" */}
    <div
      className="absolute left-4"
      style={{ animation: 'crash-left 2.5s ease-in-out infinite' }}
    >
      <div className="rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-4 py-3 shadow-sm dark:border-red-800 dark:bg-red-900/30">
        <span className="text-lg font-black text-red-500 dark:text-red-400">!?</span>
      </div>
    </div>

    {/* Right bubble "?!" */}
    <div
      className="absolute right-4"
      style={{ animation: 'crash-right 2.5s ease-in-out infinite' }}
    >
      <div className="rounded-2xl rounded-br-sm border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm dark:border-orange-800 dark:bg-orange-900/30">
        <span className="text-lg font-black text-orange-500 dark:text-orange-400">?!</span>
      </div>
    </div>

    {/* Crash effect */}
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ animation: 'crash-spark 2.5s ease-in-out infinite' }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </div>
    </div>

    <style>{`
      @keyframes crash-left {
        0%, 100% { transform: translateX(-30px) rotate(-5deg); }
        40%, 60% { transform: translateX(20px) rotate(3deg); }
      }
      @keyframes crash-right {
        0%, 100% { transform: translateX(30px) rotate(5deg); }
        40%, 60% { transform: translateX(-20px) rotate(-3deg); }
      }
      @keyframes crash-spark {
        0%, 30% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        45%, 55% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        70%, 100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      }
    `}</style>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface ErrorViewProps {
  error?: Error;
  onRetry?: () => void;
}

/* ------------------------------------------------------------------ */
/*  ErrorView                                                         */
/* ------------------------------------------------------------------ */

const ErrorView: React.FC<ErrorViewProps> = ({ error, onRetry }) => {
  const setCurrentView = useStore((s) => s.setCurrentView);
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate a pseudo-random incident reference ID
  const incidentId = useMemo(() => {
    const hex = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
    return `ERR-${hex.toUpperCase()}`;
  }, []);

  const handleRetry = useCallback(async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    // Small delay to show the loading state
    await new Promise((r) => setTimeout(r, 600));
    onRetry();
    setIsRetrying(false);
  }, [onRetry]);

  const handleCopyError = useCallback(async () => {
    if (!error) return;
    const text = `Incident: ${incidentId}\nError: ${error.message}\n\nStack trace:\n${error.stack ?? 'N/A'}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }, [error, incidentId]);

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16 animate-fade-in">
      <div className="relative w-full max-w-lg text-center">
        {/* Background glow */}
        <div className="absolute -top-20 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/5 blur-3xl dark:bg-red-500/10" />

        {/* Crashing bubbles illustration */}
        <CrashingBubbles />

        {/* Warning icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h1>

        {/* Subtitle */}
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Our circuits got tangled in a heated argument.
        </p>

        {/* Incident reference */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-surface-dark-3 dark:bg-surface-dark-2">
          <Bug className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
            {incidentId}
          </span>
        </div>

        {/* Collapsible error details */}
        {error && (
          <div className="mx-auto mb-6 max-w-md text-left">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className={clsx(
                'flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
                'dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:text-gray-300 dark:hover:bg-surface-dark-3',
              )}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Error details
              </span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showDetails && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-surface-dark-3 dark:bg-surface-dark-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Error Message
                  </span>
                  <button
                    onClick={handleCopyError}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-surface-dark-3 dark:hover:text-gray-300"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="mb-3 text-sm font-medium text-red-600 dark:text-red-400">
                  {error.message}
                </p>
                {error.stack && (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Stack Trace
                    </span>
                    <pre className="mt-1 max-h-48 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-300 dark:bg-black/50">
                      {error.stack}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {onRetry && (
            <Button
              size="lg"
              onClick={handleRetry}
              loading={isRetrying}
              icon={<RefreshCw className="h-5 w-5" />}
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentView('home')}
            icon={<Home className="h-5 w-5" />}
          >
            Go Home
          </Button>
        </div>

        {/* Report link */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          If this keeps happening,{' '}
          <button
            onClick={() => setCurrentView('help')}
            className="font-medium text-forge-600 underline decoration-forge-600/30 hover:text-forge-700 hover:decoration-forge-600/60 dark:text-forge-400 dark:decoration-forge-400/30 dark:hover:text-forge-300"
          >
            report it
          </button>
          .
        </p>

        {/* Footer */}
        <p className="mt-4 text-xs text-gray-300 dark:text-gray-600">
          Incident {incidentId}
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

export default ErrorView;
