import React, { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { ArrowUp } from 'lucide-react';

export interface BackToTopProps {
  containerRef?: React.RefObject<HTMLElement>;
  /** Scroll distance in pixels before the button appears. Default: 500 */
  threshold?: number;
  className?: string;
}

/**
 * A floating back-to-top button that appears after the user scrolls
 * past a configurable threshold (default 500px). Smooth-scrolls to
 * the top of the container (or the page) on click.
 */
export const BackToTop: React.FC<BackToTopProps> = ({
  containerRef,
  threshold = 500,
  className,
}) => {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = containerRef?.current
      ? containerRef.current.scrollTop
      : window.scrollY || document.documentElement.scrollTop;

    setVisible(scrollTop > threshold);
  }, [containerRef, threshold]);

  useEffect(() => {
    const target = containerRef?.current ?? window;

    target.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, handleScroll]);

  const scrollToTop = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={clsx(
        'fixed bottom-6 right-6 z-40',
        'h-11 w-11 rounded-full',
        'flex items-center justify-center',
        'bg-forge-600 text-white shadow-lg shadow-forge-600/30',
        'hover:bg-forge-700 active:bg-forge-800',
        'dark:bg-forge-500 dark:hover:bg-forge-600 dark:active:bg-forge-700',
        'dark:shadow-forge-500/20',
        'transition-all duration-300 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-surface-dark-0',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none',
        className,
      )}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
};

export default BackToTop;
