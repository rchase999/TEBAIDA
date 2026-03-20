import React, { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';

export interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * A thin progress bar fixed at the very top of the viewport that
 * indicates how far the user has scrolled through the content area.
 */
export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  containerRef,
  className,
}) => {
  const [progress, setProgress] = useState(0);

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
    // Compute initial value
    handleScroll();

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, handleScroll]);

  return (
    <div
      className={clsx(
        'fixed top-0 left-0 z-50 h-1 w-full pointer-events-none',
        'bg-transparent',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Scroll progress"
    >
      <div
        className="h-full bg-gradient-to-r from-forge-500 via-forge-400 to-forge-600 transition-[width] duration-100 ease-out shadow-[0_0_6px_rgba(92,124,250,0.4)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ScrollProgress;
