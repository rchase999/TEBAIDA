import React, { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

/**
 * DebateReplay — Step through a completed debate turn by turn.
 * Controls: play/pause auto-advance, next/prev, jump to start/end.
 */

interface DebateReplayProps {
  totalTurns: number;
  /** How many turns to reveal (0 = none, totalTurns = all) */
  visibleTurns: number;
  onVisibleTurnsChange: (count: number) => void;
  /** Auto-advance speed in ms */
  speed?: number;
  className?: string;
}

export const DebateReplay: React.FC<DebateReplayProps> = ({
  totalTurns,
  visibleTurns,
  onVisibleTurnsChange,
  speed = 2000,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || visibleTurns >= totalTurns) {
      if (visibleTurns >= totalTurns) setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      onVisibleTurnsChange(visibleTurns + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [isPlaying, visibleTurns, totalTurns, speed, onVisibleTurnsChange]);

  const handlePlayPause = useCallback(() => {
    if (visibleTurns >= totalTurns) {
      // Reset and play from start
      onVisibleTurnsChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [visibleTurns, totalTurns, onVisibleTurnsChange]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    onVisibleTurnsChange(Math.max(0, visibleTurns - 1));
  }, [visibleTurns, onVisibleTurnsChange]);

  const handleNext = useCallback(() => {
    onVisibleTurnsChange(Math.min(totalTurns, visibleTurns + 1));
  }, [visibleTurns, totalTurns, onVisibleTurnsChange]);

  const handleStart = useCallback(() => {
    setIsPlaying(false);
    onVisibleTurnsChange(0);
  }, [onVisibleTurnsChange]);

  const handleEnd = useCallback(() => {
    setIsPlaying(false);
    onVisibleTurnsChange(totalTurns);
  }, [totalTurns, onVisibleTurnsChange]);

  const progress = totalTurns > 0 ? (visibleTurns / totalTurns) * 100 : 0;

  return (
    <div className={clsx(
      'flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-surface-dark-3 dark:bg-surface-dark-1',
      className,
    )}>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Replay</span>

      <div className="flex items-center gap-1">
        <Tooltip content="Jump to start">
          <button onClick={handleStart} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300">
            <Rewind className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        <Tooltip content="Previous turn">
          <button onClick={handlePrev} disabled={visibleTurns <= 0} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300">
            <SkipBack className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        <Tooltip content={isPlaying ? 'Pause' : (visibleTurns >= totalTurns ? 'Replay from start' : 'Play')}>
          <button
            onClick={handlePlayPause}
            className="rounded-full bg-forge-600 p-1.5 text-white transition-colors hover:bg-forge-700"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </Tooltip>

        <Tooltip content="Next turn">
          <button onClick={handleNext} disabled={visibleTurns >= totalTurns} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300">
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        <Tooltip content="Jump to end">
          <button onClick={handleEnd} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300">
            <FastForward className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-surface-dark-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-forge-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400 w-12 text-right">
          {visibleTurns}/{totalTurns}
        </span>
      </div>
    </div>
  );
};

export default DebateReplay;
