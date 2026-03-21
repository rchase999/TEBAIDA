import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

// ===========================================================================
// Shared types
// ===========================================================================

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// ===========================================================================
// BarChart
// ===========================================================================

export interface BarChartProps {
  data: BarDatum[];
  /** Upper bound for the bar scale. Defaults to the max value in `data`. */
  maxValue?: number;
  /** Optional title rendered above the chart. */
  title?: string;
  /** Extra className. */
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  title,
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Trigger enter animation on next frame.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={clsx('w-full', className)}>
      {title && (
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </h4>
      )}
      <div className="flex flex-col gap-2">
        {data.map((d, i) => {
          const pct = Math.min((d.value / max) * 100, 100);
          return (
            <div key={`${d.label}-${i}`} className="flex items-center gap-2">
              {/* Label */}
              <span className="w-20 shrink-0 truncate text-xs text-gray-600 dark:text-gray-300">
                {d.label}
              </span>

              {/* Bar track */}
              <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: mounted ? `${pct}%` : '0%',
                    backgroundColor: d.color ?? 'var(--color-forge-500, #6366f1)',
                  }}
                />
              </div>

              {/* Value */}
              <span className="w-8 shrink-0 text-right text-xs font-medium text-gray-700 dark:text-gray-200">
                {d.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===========================================================================
// Sparkline
// ===========================================================================

export interface SparklineProps {
  data: number[];
  /** Stroke color. Defaults to forge accent. */
  color?: string;
  /** SVG height in px. Defaults to 40. */
  height?: number;
  /** Optional title rendered above the chart. */
  title?: string;
  /** Extra className. */
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  height = 40,
  title,
  className,
}) => {
  const pathRef = useRef<SVGPolylineElement>(null);
  const [totalLength, setTotalLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setTotalLength(len);
    }
  }, [data]);

  if (data.length === 0) return null;

  const width = 200;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor = color ?? 'var(--color-forge-500, #6366f1)';

  return (
    <div className={clsx('w-full', className)}>
      {title && (
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </h4>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          ref={pathRef}
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            totalLength
              ? {
                  strokeDasharray: totalLength,
                  strokeDashoffset: 0,
                  animation: 'sparkline-draw 1s ease-out forwards',
                }
              : undefined
          }
        />
        {/* Inline keyframes for the draw animation */}
        <style>{`
          @keyframes sparkline-draw {
            from { stroke-dashoffset: ${totalLength}; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
};

// ===========================================================================
// DonutChart
// ===========================================================================

export interface DonutChartProps {
  segments: DonutSegment[];
  /** Outer diameter in px. Defaults to 120. */
  size?: number;
  /** Ring thickness in px. Defaults to 18. */
  thickness?: number;
  /** Optional title rendered above the chart. */
  title?: string;
  /** Extra className. */
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 120,
  thickness = 18,
  title,
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build arcs: each segment is a circle with a dash pattern offset.
  let cumulativeOffset = 0;

  return (
    <div className={clsx('inline-flex flex-col items-center', className)}>
      {title && (
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </h4>
      )}

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-800"
          strokeWidth={thickness}
        />

        {/* Segment arcs */}
        {segments.map((seg, i) => {
          const segLength = (seg.value / total) * circumference;
          const offset = cumulativeOffset;
          cumulativeOffset += segLength;

          return (
            <circle
              key={`${seg.label}-${i}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-all duration-700 ease-out"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                opacity: mounted ? 1 : 0,
              }}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.map((seg, i) => (
          <div key={`${seg.label}-${i}`} className="flex items-center gap-1 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===========================================================================
// Default export (namespace-like convenience)
// ===========================================================================

const MiniChart = { BarChart, Sparkline, DonutChart };
export default MiniChart;
