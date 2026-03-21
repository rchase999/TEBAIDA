import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Swords } from 'lucide-react';
import { LOADING_MESSAGES } from './LoadingMessages';

export interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDuration = 1200,
}) => {
  const [message, setMessage] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 95));
    }, 200);

    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setFading(true);
        setTimeout(() => onComplete?.(), 300);
      }, 200);
    }, minDuration);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [minDuration, onComplete]);

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[999] flex flex-col items-center justify-center',
        'bg-white dark:bg-surface-dark-0',
        'transition-opacity duration-300',
        fading ? 'opacity-0' : 'opacity-100',
      )}
    >
      {/* Logo */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg shadow-forge-500/25 animate-float">
        <Swords className="h-8 w-8 text-white" />
      </div>

      {/* Brand */}
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">DebateForge</h1>

      {/* Progress bar */}
      <div className="mb-3 h-1 w-48 overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forge-500 to-forge-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading message */}
      <p className="text-xs text-gray-400 dark:text-gray-500 animate-pulse-soft">{message}</p>
    </div>
  );
};

export default LoadingScreen;
