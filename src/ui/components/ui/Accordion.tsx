import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

interface AccordionPanelProps {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
}

const AccordionPanel: React.FC<AccordionPanelProps> = ({
  item,
  isOpen,
  onToggle,
  id,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(
    item.defaultOpen ? undefined : 0,
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  // Measure and animate height changes
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isOpen) {
      const scrollHeight = el.scrollHeight;
      if (prefersReduced) {
        setHeight(undefined);
        return;
      }
      setHeight(0);
      // Force reflow
      void el.offsetHeight;
      setIsAnimating(true);
      setHeight(scrollHeight);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setHeight(undefined); // Allow content to resize naturally
      }, 300);
      return () => clearTimeout(timer);
    } else {
      if (prefersReduced) {
        setHeight(0);
        return;
      }
      const scrollHeight = el.scrollHeight;
      setHeight(scrollHeight);
      // Force reflow
      void el.offsetHeight;
      setIsAnimating(true);
      setHeight(0);

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div
      className={clsx(
        'border-b border-gray-200 dark:border-surface-dark-3',
        'last:border-b-0',
      )}
    >
      <h3>
        <button
          id={headerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className={clsx(
            'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium',
            'text-gray-900 dark:text-gray-100',
            'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forge-500',
          )}
        >
          <span className="flex-1">{item.title}</span>
          <ChevronDown
            className={clsx(
              'h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500',
              'transition-transform duration-300 motion-reduce:transition-none',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </h3>

      <div
        ref={contentRef}
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={clsx(
          'overflow-hidden',
          isAnimating && 'transition-[height] duration-300 ease-out motion-reduce:transition-none',
        )}
        style={{
          height: height !== undefined ? `${height}px` : 'auto',
        }}
      >
        <div className="px-4 pb-4 pt-0 text-sm text-gray-600 dark:text-gray-400">
          {item.content}
        </div>
      </div>
    </div>
  );
};

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  className,
}) => {
  const baseId = useId();

  const [openIndices, setOpenIndices] = useState<Set<number>>(() => {
    const defaults = new Set<number>();
    items.forEach((item, i) => {
      if (item.defaultOpen) defaults.add(i);
    });
    return defaults;
  });

  const handleToggle = useCallback(
    (index: number) => {
      setOpenIndices((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(index);
        }
        return next;
      });
    },
    [allowMultiple],
  );

  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 bg-white',
        'dark:border-surface-dark-3 dark:bg-surface-dark-1',
        className,
      )}
    >
      {items.map((item, index) => (
        <AccordionPanel
          key={`${baseId}-${index}`}
          item={item}
          isOpen={openIndices.has(index)}
          onToggle={() => handleToggle(index)}
          id={`${baseId}-accordion-${index}`}
        />
      ))}
    </div>
  );
};

export default Accordion;
