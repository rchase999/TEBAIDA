import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { MomentumPoint } from '../../types';

/* ======================================================================
   MomentumGraph — Animated SVG line chart showing debate momentum
   ======================================================================
   X-axis: turn steps (1-10)
   Y-axis: momentum (-100 to +100)
   - Zero line in the middle labeled "Neutral"
   - Positive area colored blue (proposition winning)
   - Negative area colored rose (opposition winning)
   - Housemaster turns shown as neutral dots on the line
   - Current position highlighted with a glowing dot
   ====================================================================== */

interface MomentumGraphProps {
  /** Momentum data points, one per completed turn */
  points: MomentumPoint[];
  /** Total number of turns in the debate format */
  totalSteps: number;
  /** Optional className for the container */
  className?: string;
}

// Layout constants
const SVG_WIDTH = 800;
const SVG_HEIGHT = 200;
const PADDING_LEFT = 50;
const PADDING_RIGHT = 30;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 30;

const CHART_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const CENTER_Y = PADDING_TOP + CHART_HEIGHT / 2;

function mapX(stepIndex: number, totalSteps: number): number {
  // Steps are 0-indexed internally, display as 1-indexed
  const usableSteps = Math.max(totalSteps - 1, 1);
  return PADDING_LEFT + (stepIndex / usableSteps) * CHART_WIDTH;
}

function mapY(score: number): number {
  // score ranges from -100 to +100
  // -100 -> bottom (PADDING_TOP + CHART_HEIGHT)
  // +100 -> top (PADDING_TOP)
  const normalized = (score + 100) / 200; // 0 to 1
  return PADDING_TOP + CHART_HEIGHT - normalized * CHART_HEIGHT;
}

export const MomentumGraph: React.FC<MomentumGraphProps> = ({ points, totalSteps, className }) => {
  // Build the line path and gradient fill paths
  const { linePath, positiveAreaPath, negativeAreaPath, dotData } = useMemo(() => {
    if (points.length === 0) {
      return { linePath: '', positiveAreaPath: '', negativeAreaPath: '', dotData: [] };
    }

    const coords = points.map((p) => ({
      x: mapX(p.turnIndex, totalSteps),
      y: mapY(p.score),
      point: p,
    }));

    // Build the main line path
    const lineSegments = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`));
    const lPath = lineSegments.join(' ');

    // Build positive area (above center line, clipped)
    // We draw the line, then close back along the center line
    const pAreaSegments = [...lineSegments, `L ${coords[coords.length - 1].x} ${CENTER_Y}`, `L ${coords[0].x} ${CENTER_Y}`, 'Z'];
    const pArea = pAreaSegments.join(' ');

    // Build negative area (below center line, clipped)
    const nAreaSegments = [...lineSegments, `L ${coords[coords.length - 1].x} ${CENTER_Y}`, `L ${coords[0].x} ${CENTER_Y}`, 'Z'];
    const nArea = nAreaSegments.join(' ');

    const dots = coords.map((c) => ({
      x: c.x,
      y: c.y,
      role: c.point.role,
      score: c.point.score,
      turnIndex: c.point.turnIndex,
      phase: c.point.phase,
      isLast: false,
    }));

    if (dots.length > 0) {
      dots[dots.length - 1].isLast = true;
    }

    return {
      linePath: lPath,
      positiveAreaPath: pArea,
      negativeAreaPath: nArea,
      dotData: dots,
    };
  }, [points, totalSteps]);

  // Phase labels for display
  const PHASE_SHORT: Record<string, string> = {
    introduction: 'Intro',
    opening: 'Open',
    transition: 'Trans',
    rebuttal: 'Rebut',
    'cross-examination': 'Cross',
    closing: 'Close',
    verdict: 'Verdict',
  };

  // Role-specific colors
  const ROLE_DOT_COLORS: Record<string, { fill: string; stroke: string }> = {
    proposition: { fill: '#3B82F6', stroke: '#1D4ED8' },
    opposition: { fill: '#F43F5E', stroke: '#BE123C' },
    housemaster: { fill: '#D97706', stroke: '#92400E' },
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2 dark:border-surface-dark-3 dark:bg-surface-dark-1/80">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between px-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Argument Momentum
          </h4>
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Proposition
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
              Opposition
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Housemaster
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          style={{ height: 'auto', maxHeight: '180px' }}
        >
          <defs>
            {/* Positive gradient (blue, proposition) */}
            <linearGradient id="momentum-positive-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>

            {/* Negative gradient (rose, opposition) */}
            <linearGradient id="momentum-negative-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.3" />
            </linearGradient>

            {/* Glow filter for the current position dot */}
            <filter id="momentum-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Clip path for positive area (above center) */}
            <clipPath id="clip-positive">
              <rect x={PADDING_LEFT} y={PADDING_TOP} width={CHART_WIDTH} height={CHART_HEIGHT / 2} />
            </clipPath>

            {/* Clip path for negative area (below center) */}
            <clipPath id="clip-negative">
              <rect x={PADDING_LEFT} y={CENTER_Y} width={CHART_WIDTH} height={CHART_HEIGHT / 2} />
            </clipPath>
          </defs>

          {/* Y-axis labels */}
          <text x={PADDING_LEFT - 8} y={PADDING_TOP + 4} textAnchor="end" className="fill-gray-400 dark:fill-gray-500" fontSize="9" fontFamily="inherit">+100</text>
          <text x={PADDING_LEFT - 8} y={CENTER_Y + 3} textAnchor="end" className="fill-gray-500 dark:fill-gray-400" fontSize="9" fontWeight="600" fontFamily="inherit">0</text>
          <text x={PADDING_LEFT - 8} y={PADDING_TOP + CHART_HEIGHT + 4} textAnchor="end" className="fill-gray-400 dark:fill-gray-500" fontSize="9" fontFamily="inherit">-100</text>

          {/* Grid lines */}
          {/* +50 line */}
          <line
            x1={PADDING_LEFT} y1={mapY(50)} x2={PADDING_LEFT + CHART_WIDTH} y2={mapY(50)}
            stroke="currentColor" strokeDasharray="3,6" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5"
          />
          {/* -50 line */}
          <line
            x1={PADDING_LEFT} y1={mapY(-50)} x2={PADDING_LEFT + CHART_WIDTH} y2={mapY(-50)}
            stroke="currentColor" strokeDasharray="3,6" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5"
          />

          {/* Center / Neutral line */}
          <line
            x1={PADDING_LEFT} y1={CENTER_Y} x2={PADDING_LEFT + CHART_WIDTH} y2={CENTER_Y}
            stroke="currentColor" strokeDasharray="4,4" className="text-gray-300 dark:text-gray-600" strokeWidth="1"
          />
          <text
            x={PADDING_LEFT + CHART_WIDTH + 6} y={CENTER_Y + 3}
            className="fill-gray-400 dark:fill-gray-500" fontSize="8" fontFamily="inherit"
          >
            Neutral
          </text>

          {/* Positive label */}
          <text
            x={PADDING_LEFT + CHART_WIDTH + 6} y={PADDING_TOP + CHART_HEIGHT * 0.2}
            className="fill-blue-400 dark:fill-blue-500" fontSize="7" fontFamily="inherit"
          >
            Prop.
          </text>

          {/* Negative label */}
          <text
            x={PADDING_LEFT + CHART_WIDTH + 6} y={PADDING_TOP + CHART_HEIGHT * 0.85}
            className="fill-rose-400 dark:fill-rose-500" fontSize="7" fontFamily="inherit"
          >
            Opp.
          </text>

          {/* X-axis step markers */}
          {Array.from({ length: totalSteps }, (_, i) => {
            const x = mapX(i, totalSteps);
            return (
              <g key={i}>
                {/* Vertical grid line */}
                <line
                  x1={x} y1={PADDING_TOP} x2={x} y2={PADDING_TOP + CHART_HEIGHT}
                  stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="0.5"
                />
                {/* Step number */}
                <text
                  x={x} y={PADDING_TOP + CHART_HEIGHT + 14}
                  textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" fontSize="8" fontFamily="inherit"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Filled areas (only render if we have data) */}
          {positiveAreaPath && (
            <path
              d={positiveAreaPath}
              fill="url(#momentum-positive-grad)"
              clipPath="url(#clip-positive)"
            >
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="0.6s"
                fill="freeze"
              />
            </path>
          )}
          {negativeAreaPath && (
            <path
              d={negativeAreaPath}
              fill="url(#momentum-negative-grad)"
              clipPath="url(#clip-negative)"
            >
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="0.6s"
                fill="freeze"
              />
            </path>
          )}

          {/* Main line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              className="text-gray-600 dark:text-gray-300"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="2000"
                to="0"
                dur="1s"
                fill="freeze"
              />
              <animate
                attributeName="stroke-dasharray"
                from="2000"
                to="2000"
                dur="0.01s"
                fill="freeze"
              />
            </path>
          )}

          {/* Data points */}
          {dotData.map((dot, i) => {
            const colors = ROLE_DOT_COLORS[dot.role] ?? ROLE_DOT_COLORS.housemaster;
            const isLast = dot.isLast;

            return (
              <g key={i}>
                {/* Glow effect for the last dot */}
                {isLast && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={8}
                    fill={colors.fill}
                    opacity={0.3}
                    filter="url(#momentum-glow)"
                  >
                    <animate
                      attributeName="r"
                      values="6;10;6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0.15;0.3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Main dot */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isLast ? 5 : dot.role === 'housemaster' ? 3.5 : 4}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isLast ? 2 : 1.5}
                >
                  {/* Entry animation */}
                  <animate
                    attributeName="r"
                    from="0"
                    to={isLast ? 5 : dot.role === 'housemaster' ? 3.5 : 4}
                    dur="0.3s"
                    begin={`${i * 0.08}s`}
                    fill="freeze"
                  />
                </circle>

                {/* Score label on hover (shown for last point always) */}
                {isLast && (
                  <text
                    x={dot.x}
                    y={dot.y - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="inherit"
                    className={clsx(
                      dot.score > 0 ? 'fill-blue-600 dark:fill-blue-400' :
                      dot.score < 0 ? 'fill-rose-600 dark:fill-rose-400' :
                      'fill-gray-500 dark:fill-gray-400'
                    )}
                  >
                    {dot.score > 0 ? '+' : ''}{Math.round(dot.score)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Empty state — show a flat line when no data yet */}
          {points.length === 0 && (
            <>
              <line
                x1={PADDING_LEFT} y1={CENTER_Y} x2={PADDING_LEFT + CHART_WIDTH} y2={CENTER_Y}
                stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1.5"
                strokeDasharray="8,4"
              />
              <text
                x={PADDING_LEFT + CHART_WIDTH / 2} y={CENTER_Y - 12}
                textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" fontSize="10" fontFamily="inherit"
              >
                Momentum will appear as the debate progresses
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

export default MomentumGraph;
