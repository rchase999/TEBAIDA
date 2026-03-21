import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { X, Search, Keyboard, Command } from 'lucide-react';
import {
  DEFAULT_SHORTCUTS,
  formatKey,
} from '../hooks/useKeyboardShortcuts';
import type { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Category ordering and icons
// ---------------------------------------------------------------------------

const CATEGORY_ORDER = ['Navigation', 'Views', 'Actions'] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Navigation: <Command className="h-4 w-4" />,
  Views: <Keyboard className="h-4 w-4" />,
  Actions: <Keyboard className="h-4 w-4" />,
};

// ---------------------------------------------------------------------------
// Keycap component — renders a single styled keyboard key
// ---------------------------------------------------------------------------

const Keycap: React.FC<{ label: string }> = ({ label }) => (
  <kbd
    className={clsx(
      'inline-flex min-w-[1.75rem] items-center justify-center rounded-md',
      'border border-gray-300 bg-gray-100 px-1.5 py-0.5',
      'text-[11px] font-semibold leading-none text-gray-600',
      'shadow-[0_1px_0_1px_rgba(0,0,0,0.08)]',
      'dark:border-surface-dark-4 dark:bg-surface-dark-3',
      'dark:text-gray-300 dark:shadow-[0_1px_0_1px_rgba(0,0,0,0.4)]',
    )}
  >
    {label}
  </kbd>
);

// ---------------------------------------------------------------------------
// ShortcutRow component
// ---------------------------------------------------------------------------

const ShortcutRow: React.FC<{
  shortcut: Omit<KeyboardShortcut, 'action'>;
}> = ({ shortcut }) => {
  const parts = formatKey(shortcut);

  return (
    <div
      className={clsx(
        'flex items-center justify-between rounded-lg px-3 py-2',
        'transition-colors duration-100',
        'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
      )}
    >
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {shortcut.description}
      </span>

      <div className="flex items-center gap-1 ml-4 shrink-0">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
            )}
            <Keycap label={part} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// KeyboardShortcutsModal
// ---------------------------------------------------------------------------

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Reset filter and focus search on open ────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setFilter('');
      // Small delay to wait for the animation frame so the input is mounted
      const t = setTimeout(() => searchRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(t);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // ── Close on Escape ──────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  // ── Overlay click ────────────────────────────────────────────────────
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // ── Filtered & grouped shortcuts ─────────────────────────────────────
  const grouped = useMemo(() => {
    const lowerFilter = filter.toLowerCase().trim();

    const filtered = DEFAULT_SHORTCUTS.filter((s) => {
      if (!lowerFilter) return true;
      return (
        s.description.toLowerCase().includes(lowerFilter) ||
        s.category.toLowerCase().includes(lowerFilter) ||
        s.key.toLowerCase().includes(lowerFilter)
      );
    });

    const groups: Record<string, Omit<KeyboardShortcut, 'action'>[]> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }

    // Return ordered categories
    return CATEGORY_ORDER
      .filter((cat) => groups[cat] && groups[cat].length > 0)
      .map((cat) => ({
        category: cat,
        shortcuts: groups[cat],
      }));
  }, [filter]);

  // ── Render nothing when closed ───────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-[60] flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'animate-fade-in',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className={clsx(
          'w-full max-w-xl rounded-2xl border shadow-2xl',
          'border-gray-200 bg-white',
          'dark:border-surface-dark-3 dark:bg-surface-dark-1',
          'animate-slide-up',
          'flex flex-col max-h-[80vh]',
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-surface-dark-3">
          <div className="flex items-center gap-2.5">
            <div
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'bg-forge-100 text-forge-600',
                'dark:bg-forge-900/30 dark:text-forge-400',
              )}
            >
              <Keyboard className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h2>
          </div>

          <button
            onClick={onClose}
            className={clsx(
              'rounded-lg p-1.5 text-gray-400 transition-colors',
              'hover:bg-gray-100 hover:text-gray-600',
              'dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <div className="border-b border-gray-200 px-6 py-3 dark:border-surface-dark-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search shortcuts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={clsx(
                'w-full rounded-lg border py-2 pl-9 pr-3 text-sm',
                'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400',
                'focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500',
                'dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:text-gray-100',
                'dark:placeholder-gray-500 dark:focus:border-forge-400 dark:focus:ring-forge-400',
                'transition-colors duration-150',
              )}
            />
          </div>
        </div>

        {/* ── Shortcut list ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No shortcuts match &ldquo;{filter}&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ category, shortcuts }) => (
                <section key={category}>
                  {/* Category header */}
                  <div className="mb-2 flex items-center gap-2 px-3">
                    <span className="text-gray-400 dark:text-gray-500">
                      {CATEGORY_ICONS[category]}
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {category}
                    </h3>
                  </div>

                  {/* Shortcut rows */}
                  <div className="space-y-0.5">
                    {shortcuts.map((shortcut, idx) => (
                      <ShortcutRow key={`${category}-${idx}`} shortcut={shortcut} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div
          className={clsx(
            'flex items-center justify-between border-t px-6 py-3 text-xs',
            'border-gray-200 text-gray-400',
            'dark:border-surface-dark-3 dark:text-gray-500',
          )}
        >
          <span>
            Press <Keycap label="?" /> anywhere to toggle this panel
          </span>
          <span>
            <Keycap label="Esc" /> to close
          </span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
