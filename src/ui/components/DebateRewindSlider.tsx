import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import clsx from 'clsx';
import {
  Play, Pause, ChevronLeft, ChevronRight,
  Gauge,
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import type { Debate, DebateTurn } from '../../types';

/* ======================================================================
   DebateRewindSlider — A "time-travel" slider for replaying a debate
   turn by turn. Displays colored dots for each turn along a track,
   supports play/pause auto-advance with configurable speed, and
   keyboard navigation (arrow keys).
   ====================================================================== */

export interface DebateRewindSliderProps {
  debate: Debate;
  /** Called when the user or auto-advance changes the visible turn index */
  onTurnChange: (index: number) => void;
  /** Currently selected turn index (0-based, -1 means none selected) */
  currentIndex?: number;
  className?: string;
}

const SPEEDS = [
  { label: '0.5x', ms: 4000 },
  { label: '1x', ms: 2000 },
  { label: '2x', ms: 1000 },
  { label: '4x', ms: 500 },
];

const ROLE_DOT_COLORS: Record<string, { ring: string; fill: string; active: string }> = {
  proposition: {
    ring: 'ring-blue-400 dark:ring-blue-500',
    fill: 'bg-blue-500 dark:bg-blue-400',
    active: 'bg-blue-600 dark:bg-blue-300 shadow-blue-400/50',
  },
  opposition: {
    ring: 'ring-rose-400 dark:ring-rose-500',
    fill: 'bg-rose-500 dark:bg-rose-400',
    active: 'bg-rose-600 dark:bg-rose-300 shadow-rose-400/50',
  },
  housemaster: {
    ring: 'ring-gray-400 dark:ring-gray-500',
    fill: 'bg-gray-400 dark:bg-gray-500',
    active: 'bg-gray-500 dark:bg-gray-300 shadow-gray-400/50',
  },
};

const PHASE_LABELS: Record<string, string> = {
  introduction: 'Intro',
  opening: 'Opening',
  transition: 'Transition',
  rebuttal: 'Rebuttal',
  'cross-examination': 'Cross-Exam',
  closing: 'Closing',
  verdict: 'Verdict',
};

export const DebateRewindSlider: React.FC<DebateRewindSliderProps> = ({
  debate,
  onTurnChange,
  currentIndex: controlledIndex,
  className,
}) => {
  const turns = debate.turns;
  const totalTurns = turns.length;

  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // default 1x
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Build turn metadata
  const turnMeta = useMemo(() => {
    return turns.map((t: DebateTurn, i: number) => {
      const debater = debate.debaters.find((d) => d.id === t.debaterId);
      const role = debater?.position ?? 'proposition';
      return {
        index: i,
        speaker: t.debaterName,
        role,
        phase: PHASE_LABELS[t.phase] ?? t.phase,
        preview: t.content.slice(0, 50) + (t.content.length > 50 ? '...' : ''),
      };
    });
  }, [turns, debate.debaters]);

  // Navigate to a turn
  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(totalTurns - 1, idx));
      setInternalIndex(clamped);
      onTurnChange(clamped);
    },
    [totalTurns, onTurnChange],
  );

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || totalTurns === 0) return;
    if (activeIndex >= totalTurns - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      goTo(activeIndex + 1);
    }, SPEEDS[speedIdx].ms);
    return () => clearTimeout(timer);
  }, [isPlaying, activeIndex, totalTurns, speedIdx, goTo]);

  // Keyboard handling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        goTo(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        goTo(activeIndex + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  });

  const handlePlayPause = useCallback(() => {
    if (activeIndex >= totalTurns - 1) {
      goTo(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [activeIndex, totalTurns, goTo]);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((i) => (i + 1) % SPEEDS.length);
  }, []);

  if (totalTurns === 0) {
    return (
      <div className={clsx('text-center py-4 text-sm text-gray-500 dark:text-gray-400', className)}>
        No turns to replay yet.
      </div>
    );
  }

  const currentMeta = turnMeta[activeIndex];
  const hoveredMeta = hoveredIdx !== null ? turnMeta[hoveredIdx] : null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="slider"
      aria-label="Debate rewind slider"
      aria-valuemin={0}
      aria-valuemax={totalTurns - 1}
      aria-valuenow={activeIndex}
      aria-valuetext={currentMeta ? `Turn ${activeIndex + 1}: ${currentMeta.speaker}` : undefined}
      className={clsx(
        'rounded-xl border border-gray-200 dark:border-surface-dark-3 bg-white dark:bg-surface-dark-1 p-4',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
        className,
      )}
    >
      {/* ── Controls row ─────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => { setIsPlaying(false); goTo(activeIndex - 1); }}
          disabled={activeIndex <= 0}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-surface-dark-2 disabled:opacity-30 transition-colors"
          aria-label="Previous turn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handlePlayPause}
          className={clsx(
            'p-2 rounded-full transition-colors',
            isPlaying
              ? 'bg-forge-100 text-forge-700 dark:bg-forge-900/40 dark:text-forge-300'
              : 'bg-gray-100 text-gray-600 hover:bg-forge-100 hover:text-forge-700 dark:bg-surface-dark-2 dark:text-gray-300 dark:hover:bg-forge-900/40',
          )}
          aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => { setIsPlaying(false); goTo(activeIndex + 1); }}
          disabled={activeIndex >= totalTurns - 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-surface-dark-2 disabled:opacity-30 transition-colors"
          aria-label="Next turn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Speed control */}
        <button
          onClick={cycleSpeed}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark-2 transition-colors"
          aria-label={`Playback speed: ${SPEEDS[speedIdx].label}`}
        >
          <Gauge className="w-3.5 h-3.5" />
          {SPEEDS[speedIdx].label}
        </button>

        {/* Turn counter */}
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          {activeIndex + 1} / {totalTurns}
        </span>
      </div>

      {/* ── Slider track ─────────────────────────────────── */}
      <div className="relative px-2">
        {/* Background track */}
        <div className="absolute top-1/2 left-2 right-2 h-0.5 -translate-y-1/2 bg-gray-200 dark:bg-surface-dark-3 rounded-full" />

        {/* Progress fill */}
        <div
          className="absolute top-1/2 left-2 h-0.5 -translate-y-1/2 bg-forge-400 dark:bg-forge-500 rounded-full transition-all duration-300"
          style={{ width: `${totalTurns > 1 ? (activeIndex / (totalTurns - 1)) * 100 : 0}%` }}
        />

        {/* Turn dots */}
        <div className="relative flex justify-between" style={{ minHeight: 24 }}>
          {turnMeta.map((meta) => {
            const isActive = meta.index === activeIndex;
            const isHovered = meta.index === hoveredIdx;
            const colors = ROLE_DOT_COLORS[meta.role] ?? ROLE_DOT_COLORS.housemaster;

            return (
              <button
                key={meta.index}
                onClick={() => { setIsPlaying(false); goTo(meta.index); }}
                onMouseEnter={() => setHoveredIdx(meta.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={clsx(
                  'relative z-10 rounded-full transition-all duration-200 focus:outline-none',
                  isActive
                    ? clsx('w-4 h-4 ring-2 shadow-lg', colors.active, colors.ring)
                    : clsx('w-2.5 h-2.5 mt-[3px] hover:scale-150', colors.fill),
                )}
                style={{ flex: '0 0 auto' }}
                aria-label={`Turn ${meta.index + 1}: ${meta.speaker} (${meta.phase})`}
              />
            );
          })}
        </div>
      </div>

      {/* ── Tooltip / info strip ─────────────────────────── */}
      <div className="mt-3 flex items-start gap-2 min-h-[36px]">
        {(hoveredMeta ?? currentMeta) && (
          <>
            <span
              className={clsx(
                'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                (hoveredMeta ?? currentMeta).role === 'proposition'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : (hoveredMeta ?? currentMeta).role === 'opposition'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-surface-dark-2 dark:text-gray-400',
              )}
            >
              {(hoveredMeta ?? currentMeta).role}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                {(hoveredMeta ?? currentMeta).speaker}
                <span className="ml-1.5 text-gray-400 dark:text-gray-500 font-normal">
                  {(hoveredMeta ?? currentMeta).phase}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {(hoveredMeta ?? currentMeta).preview}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebateRewindSlider;
