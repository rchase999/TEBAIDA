import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';

export interface ContextMenuItemDef {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}

export interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItemDef[];
  className?: string;
}

interface MenuPosition {
  x: number;
  y: number;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const actionableIndices = items
    .map((item, i) => (!item.divider ? i : -1))
    .filter((i) => i !== -1);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Adjust position to stay within viewport
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const menuWidth = 220;
      const menuHeight = items.length * 36 + 12;

      let x = e.clientX;
      let y = e.clientY;

      if (x + menuWidth > viewportW) {
        x = viewportW - menuWidth - 8;
      }
      if (y + menuHeight > viewportH) {
        y = viewportH - menuHeight - 8;
      }

      setPosition({ x, y });
      setOpen(true);
      setFocusedIndex(-1);
    },
    [items.length],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeMenu]);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const handler = () => closeMenu();
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open, closeMenu]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeMenu();
          break;

        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const currentIdx = actionableIndices.indexOf(prev);
            const nextIdx =
              currentIdx < actionableIndices.length - 1
                ? currentIdx + 1
                : 0;
            return actionableIndices[nextIdx];
          });
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const currentIdx = actionableIndices.indexOf(prev);
            const prevIdx =
              currentIdx > 0
                ? currentIdx - 1
                : actionableIndices.length - 1;
            return actionableIndices[prevIdx];
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
              closeMenu();
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
  }, [open, focusedIndex, items, actionableIndices, closeMenu]);

  // Focus the focused item
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className={className}
      >
        {children}
      </div>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={clsx(
            'fixed z-[100] min-w-[200px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl',
            'dark:border-surface-dark-3 dark:bg-surface-dark-1',
            'motion-safe:animate-scale-in origin-top-left',
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
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
                  closeMenu();
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
    </>
  );
};

export default ContextMenu;
