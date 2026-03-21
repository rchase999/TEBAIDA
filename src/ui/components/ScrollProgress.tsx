import React, { useEffect, useState, useCallback, useRef } from 'react';
import clsx from 'clsx';

export interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement>;
  className?: string;
  visible?: boolean;
}

/**
 * Enhanced scroll progress bar fixed at the very top of the viewport.
 * Shows a gradient bar (forge-500 to forge-400) indicating scroll position.
 * Displays a percentage tooltip on hover. Can be toggled via the `visible` prop.
 */
export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  containerRef,
  className,
  visible = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [tooltipX, setTooltipX] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef?.current ?? document.documentElement;

    const scrollTop = containerRef?.current
      ? el.scrollTop
      : window.scrollY || document.documentElement.scrollTop;

    const scrollHeight = el.scrollHeight - el.clientHeight;

    if (scrollHeight <= 0) {
      setProgress(0);
      return;
    }

    const pct = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
    setProgress(pct);
  }, [containerRef]);

  useEffect(() => {
    const target = containerRef?.current ?? window;

    target.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, handleScroll]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      setTooltipX(e.clientX - rect.left);
    }
  }, []);

  if (!visible) return null;

  const roundedProgress = Math.round(progress);

  return (
    <div
      ref={barRef}
      className={clsx(
        'fixed top-0 left-0 z-50 h-1 w-full',
        'bg-transparent',
        'transition-opacity duration-200',
        hovering ? 'h-1.5' : 'h-1',
        className,
      )}
      role="progressbar"
      aria-valuenow={roundedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Scroll progress"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <div
        className={clsx(
          'h-full bg-gradient-to-r from-forge-500 to-forge-400',
          'transition-[width,height] duration-100 ease-out',
          'shadow-[0_0_6px_rgba(92,124,250,0.4)]',
        )}
        style={{ width: `${progress}%` }}
      />

      {/* Percentage tooltip on hover */}
      {hovering && (
        <div
          className={clsx(
            'absolute top-2 -translate-x-1/2 pointer-events-none',
            'rounded-md bg-gray-900 px-2 py-0.5 text-2xs font-medium text-white shadow-lg',
            'dark:bg-surface-dark-3',
            'animate-fade-in',
          )}
          style={{ left: tooltipX }}
        >
          {roundedProgress}%
        </div>
      )}
    </div>
  );
};

export default ScrollProgress;
