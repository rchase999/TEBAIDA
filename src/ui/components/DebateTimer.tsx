import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Clock, CheckCircle } from 'lucide-react';

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface DebateTimerProps {
  isGenerating: boolean;
  isCompleted: boolean;
  currentStep: number;
  totalSteps: number;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ─── Main component ───────────────────────────────────────────────────────── */

const DebateTimer: React.FC<DebateTimerProps> = ({
  isGenerating,
  isCompleted,
  currentStep,
  totalSteps,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStepRef = useRef(currentStep);

  /* Reset timer when the current step changes (new turn started) */
  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setElapsed(0);
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  /* Start / stop the interval based on isGenerating */
  useEffect(() => {
    if (isGenerating && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isGenerating, isCompleted]);

  /* Progress percentage */
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2.5 rounded-lg border px-3 py-2',
        'border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-1',
      )}
    >
      {/* Status indicator */}
      {isCompleted ? (
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      ) : (
        <div className="relative flex items-center justify-center">
          <Clock
            className={clsx(
              'h-4 w-4',
              isGenerating
                ? 'text-forge-600 dark:text-forge-400'
                : 'text-gray-400 dark:text-gray-500',
            )}
          />
          {/* Pulsing dot when generating */}
          {isGenerating && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forge-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-forge-600 dark:bg-forge-400" />
            </span>
          )}
        </div>
      )}

      {/* Time / status text */}
      <div className="flex flex-col">
        <span
          className={clsx(
            'text-sm font-semibold tabular-nums leading-tight',
            isCompleted
              ? 'text-emerald-600 dark:text-emerald-400'
              : isGenerating
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {isCompleted ? 'Completed' : formatTime(elapsed)}
        </span>
        <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
          Step {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="ml-1 h-6 w-12 overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            isCompleted
              ? 'bg-emerald-500'
              : 'bg-forge-600 dark:bg-forge-500',
            isGenerating && !isCompleted && 'animate-pulse-soft',
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default DebateTimer;
