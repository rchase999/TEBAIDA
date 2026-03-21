import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';

export interface DropdownMenuItemDef {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItemDef[];
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'left',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Filter actionable (non-divider) items for keyboard nav
  const actionableIndices = items
    .map((item, i) => (!item.divider ? i : -1))
    .filter((i) => i !== -1);

  const toggle = useCallback(() => {
    setOpen((v) => {
      if (!v) setFocusedIndex(-1);
      return !v;
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;

        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const currentActionIndex = actionableIndices.indexOf(prev);
            const nextActionIndex =
              currentActionIndex < actionableIndices.length - 1
                ? currentActionIndex + 1
                : 0;
            return actionableIndices[nextActionIndex];
          });
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const currentActionIndex = actionableIndices.indexOf(prev);
            const prevActionIndex =
              currentActionIndex > 0
                ? currentActionIndex - 1
                : actionableIndices.length - 1;
            return actionableIndices[prevActionIndex];
          });
          break;
        }

        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (focusedIndex >= 0) {
            const item = items[focusedIndex];
            if (item && !item.disabled && !item.divider) {
              item.onClick?.();
              setOpen(false);
            }
          }
          break;
        }

        case 'Home': {
          e.preventDefault();
          if (actionableIndices.length > 0) {
            setFocusedIndex(actionableIndices[0]);
          }
          break;
        }

        case 'End': {
          e.preventDefault();
          if (actionableIndices.length > 0) {
            setFocusedIndex(actionableIndices[actionableIndices.length - 1]);
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, focusedIndex, items, actionableIndices]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      <button
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="cursor-pointer"
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={clsx(
            'absolute z-50 mt-1.5 min-w-[200px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl',
            'dark:border-surface-dark-3 dark:bg-surface-dark-1',
            'motion-safe:animate-scale-in origin-top',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1.5 h-px bg-gray-200 dark:bg-surface-dark-3"
                  role="separator"
                />
              );
            }

            const isFocused = focusedIndex === index;

            return (
              <button
                key={`${item.label}-${index}`}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="menuitem"
                tabIndex={isFocused ? 0 : -1}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick?.();
                  setOpen(false);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-none',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : item.danger
                      ? clsx(
                          'text-red-600 dark:text-red-400',
                          isFocused && 'bg-red-50 dark:bg-red-900/20',
                        )
                      : clsx(
                          'text-gray-700 dark:text-gray-300',
                          isFocused && 'bg-gray-100 dark:bg-surface-dark-2',
                        ),
                )}
              >
                {item.icon && (
                  <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
                )}
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-4 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
