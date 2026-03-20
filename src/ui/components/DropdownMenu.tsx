import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      <button onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </button>
      {open && (
        <div
          className={clsx(
            'absolute z-50 mt-1 min-w-[180px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg',
            'dark:border-surface-dark-3 dark:bg-surface-dark-1',
            'animate-scale-in origin-top',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          {items.map((item) => {
            if (item.divider) {
              return <div key={item.id} className="my-1 h-px bg-gray-200 dark:bg-surface-dark-3" />;
            }
            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : item.danger
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-surface-dark-2',
                )}
              >
                {item.icon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
