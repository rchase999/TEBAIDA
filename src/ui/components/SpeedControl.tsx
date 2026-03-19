import React from 'react';
import clsx from 'clsx';
import { Zap, Turtle, Rabbit } from 'lucide-react';
import { Tooltip } from './Tooltip';

/**
 * SpeedControl — Adjustable auto-run delay between debate turns.
 * Shows a compact speed indicator with a slider.
 */

export interface SpeedControlProps {
  /** Current delay in milliseconds */
  delay: number;
  /** Callback when delay changes */
  onChange: (delay: number) => void;
  className?: string;
}

const SPEED_PRESETS = [
  { label: 'Fast', delay: 500, icon: Rabbit },
  { label: 'Normal', delay: 1500, icon: Zap },
  { label: 'Slow', delay: 4000, icon: Turtle },
];

function getSpeedLabel(delay: number): string {
  if (delay <= 700) return 'Fast';
  if (delay <= 2000) return 'Normal';
  if (delay <= 3500) return 'Slow';
  return 'Very Slow';
}

export const SpeedControl: React.FC<SpeedControlProps> = ({ delay, onChange, className }) => {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <Tooltip content={`Auto-run speed: ${getSpeedLabel(delay)} (${(delay / 1000).toFixed(1)}s)`}>
        <div className="flex items-center gap-1.5">
          <Rabbit className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="range"
            min={300}
            max={5000}
            step={100}
            value={5300 - delay}
            onChange={(e) => onChange(5300 - Number(e.target.value))}
            className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-gray-200 accent-forge-500 dark:bg-surface-dark-3"
          />
          <Turtle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
        </div>
      </Tooltip>
    </div>
  );
};

export default SpeedControl;
