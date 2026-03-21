import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

/**
 * 20 witty loading messages that rotate with a fade transition.
 */
export const LOADING_MESSAGES: string[] = [
  'Reticulating splines...',
  'Convincing electrons to cooperate...',
  'Counting backwards from infinity...',
  'Warming up the debate arena...',
  'Sharpening logical swords...',
  'Calibrating fallacy detectors...',
  "Herding Schr\u00F6dinger's cats...",
  'Polishing the argument engine...',
  'Consulting ancient philosophers...',
  'Establishing rhetorical protocols...',
  'Compiling counterarguments...',
  'Untangling logical knots...',
  'Summoning the spirit of Socrates...',
  'Defragmenting debate matrices...',
  'Loading straw man repellent...',
  'Syncing with the dialectic cloud...',
  'Tuning the persuasion algorithms...',
  'Brewing a pot of critical thinking...',
  'Aligning syllogistic parameters...',
  'Deploying rhetorical countermeasures...',
];

export interface LoadingMessagesProps {
  /** Additional CSS classes */
  className?: string;
  /** Rotation interval in milliseconds (default: 2500) */
  speed?: number;
}

/**
 * Rotating witty loading messages component.
 * Cycles through 20 messages with a smooth fade transition.
 */
export const LoadingMessages: React.FC<LoadingMessagesProps> = ({
  className,
  speed = 2500,
}) => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Start fade out
      setFading(true);

      // After fade out completes, switch message and fade in
      timeoutRef.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        setFading(false);
      }, 250);
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [speed]);

  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        className={clsx(
          'text-sm text-gray-500 dark:text-gray-400 transition-opacity duration-250 ease-in-out',
          fading ? 'opacity-0' : 'opacity-100',
        )}
      >
        {LOADING_MESSAGES[index]}
      </p>
    </div>
  );
};

export default LoadingMessages;
