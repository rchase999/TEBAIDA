import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  maxVisible?: number;
  separator?: React.ReactNode;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  maxVisible,
  separator,
  className,
}) => {
  const [truncatedOpen, setTruncatedOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!truncatedOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTruncatedOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [truncatedOpen]);

  // Close on Esc
  useEffect(() => {
    if (!truncatedOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTruncatedOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [truncatedOpen]);

  if (items.length === 0) return null;

  const shouldTruncate = maxVisible !== undefined && maxVisible > 1 && items.length > maxVisible;

  let visibleItems: BreadcrumbItem[];
  let hiddenItems: BreadcrumbItem[] = [];

  if (shouldTruncate) {
    // Show first item, '...' dropdown, and last (maxVisible - 1) items
    const tailCount = maxVisible - 1;
    visibleItems = [items[0], ...items.slice(items.length - tailCount)];
    hiddenItems = items.slice(1, items.length - tailCount);
  } else {
    visibleItems = items;
  }

  const SeparatorIcon = () =>
    separator ? (
      <span className="mx-1.5 text-gray-300 dark:text-gray-600" aria-hidden="true">
        {separator}
      </span>
    ) : (
      <ChevronRight
        className="mx-1 h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600"
        aria-hidden="true"
      />
    );

  const renderItem = (item: BreadcrumbItem, isLast: boolean) => {
    const content = (
      <>
        {item.icon && (
          <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{item.icon}</span>
        )}
        <span className={isLast ? 'truncate' : undefined}>{item.label}</span>
      </>
    );

    if (isLast) {
      return (
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 text-sm font-semibold',
            'text-gray-900 dark:text-gray-100',
          )}
          aria-current="page"
        >
          {content}
        </span>
      );
    }

    if (item.onClick) {
      return (
        <button
          onClick={item.onClick}
          className={clsx(
            'inline-flex items-center gap-1.5 text-sm font-medium',
            'text-gray-500 dark:text-gray-400',
            'hover:text-gray-700 dark:hover:text-gray-200',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:rounded',
          )}
        >
          {content}
        </button>
      );
    }

    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 text-sm font-medium',
          'text-gray-500 dark:text-gray-400',
        )}
      >
        {content}
      </span>
    );
  };

  return (
    <nav aria-label="Breadcrumb" className={clsx('flex', className)}>
      <ol className="flex items-center flex-wrap">
        {visibleItems.map((item, index) => {
          const isLast =
            index === visibleItems.length - 1 &&
            (!shouldTruncate || hiddenItems.length === 0 || index > 0);

          const isFirstAndTruncated = shouldTruncate && index === 0;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <li className="inline-flex items-center">
                {renderItem(item, index === visibleItems.length - 1)}
              </li>

              {isFirstAndTruncated && (
                <>
                  <li className="inline-flex items-center" aria-hidden="true">
                    <SeparatorIcon />
                  </li>
                  <li className="relative inline-flex items-center" ref={dropdownRef}>
                    <button
                      onClick={() => setTruncatedOpen((v) => !v)}
                      aria-label={`Show ${hiddenItems.length} hidden breadcrumb items`}
                      aria-expanded={truncatedOpen}
                      className={clsx(
                        'inline-flex items-center rounded-md p-0.5 text-gray-400 dark:text-gray-500',
                        'hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300',
                        'transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
                      )}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {truncatedOpen && (
                      <div
                        className={clsx(
                          'absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg',
                          'dark:border-surface-dark-3 dark:bg-surface-dark-1',
                          'motion-safe:animate-scale-in origin-top-left',
                        )}
                        role="menu"
                      >
                        {hiddenItems.map((hItem, hIndex) => (
                          <button
                            key={`hidden-${hItem.label}-${hIndex}`}
                            role="menuitem"
                            onClick={() => {
                              setTruncatedOpen(false);
                              hItem.onClick?.();
                            }}
                            className={clsx(
                              'flex w-full items-center gap-2 px-3 py-1.5 text-sm',
                              'text-gray-700 dark:text-gray-300',
                              'hover:bg-gray-100 dark:hover:bg-surface-dark-2',
                              'transition-colors duration-150',
                            )}
                          >
                            {hItem.icon && (
                              <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
                                {hItem.icon}
                              </span>
                            )}
                            {hItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                </>
              )}

              {!isLast && index < visibleItems.length - 1 && (
                <li className="inline-flex items-center" aria-hidden="true">
                  <SeparatorIcon />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
