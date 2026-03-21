import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import {
  Search,
  Command,
  LayoutDashboard,
  Swords,
  Users,
  Trophy,
  BarChart3,
  PieChart,
  Settings,
  Sun,
  Moon,
  ArrowRight,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Download,
  PanelLeftClose,
  X,
} from 'lucide-react';
import { useStore } from '../store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'page' | 'action' | 'recent';
  icon: React.FC<{ className?: string }>;
  path?: string;
  shortcut?: string;
  onSelect: () => void;
}

// ---------------------------------------------------------------------------
// Fuzzy match scoring
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (q.length === 0) return 1;
  if (t.includes(q)) return 2 + (q.length / t.length);

  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 1;
      // Bonus for consecutive matches
      if (lastMatchIndex === ti - 1) {
        score += 1.5;
      }
      // Bonus for matching at word boundaries
      if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-' || t[ti - 1] === '/') {
        score += 1;
      }
      lastMatchIndex = ti;
      qi++;
    }
  }

  // All query characters must be found
  if (qi < q.length) return 0;

  // Normalize by query length for fair comparison
  return score / q.length;
}

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  page: 'Pages',
  action: 'Actions',
  recent: 'Recent Debates',
};

const CATEGORY_ORDER: string[] = ['page', 'action', 'recent'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const debates = useStore((s) => s.debates);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  // Resolve effective theme for toggle label
  const effectiveTheme = useMemo(() => {
    if (theme === 'light' || theme === 'dark') return theme;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, [theme]);

  // Build command items
  const allItems: CommandItem[] = useMemo(() => {
    const pages: CommandItem[] = [
      {
        id: 'page-home',
        title: 'Home',
        category: 'page',
        icon: LayoutDashboard,
        path: 'Dashboard',
        onSelect: () => onNavigate('home'),
      },
      {
        id: 'page-new-debate',
        title: 'New Debate',
        category: 'page',
        icon: Swords,
        path: 'Setup Wizard',
        shortcut: 'N',
        onSelect: () => onNavigate('setup'),
      },
      {
        id: 'page-personas',
        title: 'Personas',
        category: 'page',
        icon: Users,
        path: 'Persona Editor',
        onSelect: () => onNavigate('personas'),
      },
      {
        id: 'page-tournament',
        title: 'Tournament',
        category: 'page',
        icon: Trophy,
        path: 'Tournament Mode',
        onSelect: () => onNavigate('tournament'),
      },
      {
        id: 'page-leaderboard',
        title: 'Leaderboard',
        category: 'page',
        icon: BarChart3,
        path: 'ELO Rankings',
        onSelect: () => onNavigate('leaderboard'),
      },
      {
        id: 'page-statistics',
        title: 'Statistics',
        category: 'page',
        icon: PieChart,
        path: 'Analytics',
        onSelect: () => onNavigate('statistics'),
      },
      {
        id: 'page-settings',
        title: 'Settings',
        category: 'page',
        icon: Settings,
        path: 'Preferences',
        shortcut: ',',
        onSelect: () => onNavigate('settings'),
      },
    ];

    const actions: CommandItem[] = [
      {
        id: 'action-toggle-theme',
        title: `Toggle Theme`,
        category: 'action',
        icon: effectiveTheme === 'dark' ? Sun : Moon,
        path: effectiveTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        onSelect: () => {
          setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
        },
      },
      {
        id: 'action-toggle-sidebar',
        title: 'Toggle Sidebar',
        category: 'action',
        icon: PanelLeftClose,
        path: 'Show / Hide Sidebar',
        shortcut: 'B',
        onSelect: () => {
          toggleSidebar();
        },
      },
      {
        id: 'action-export-debates',
        title: 'Export Debates',
        category: 'action',
        icon: Download,
        path: 'Download debate data',
        onSelect: () => {
          // Trigger export by navigating to settings where export lives
          onNavigate('settings');
        },
      },
    ];

    const recentDebates: CommandItem[] = debates
      .slice(0, 5)
      .map((debate) => ({
        id: `recent-${debate.id}`,
        title: debate.topic,
        category: 'recent' as const,
        icon: Swords,
        path: `${debate.status === 'completed' ? 'Completed' : debate.status === 'in-progress' ? 'In Progress' : 'Draft'} · ${new Date(debate.updatedAt).toLocaleDateString()}`,
        onSelect: () => {
          useStore.getState().setCurrentDebate(debate);
          onNavigate('debate');
        },
      }));

    return [...pages, ...actions, ...recentDebates];
  }, [debates, effectiveTheme, onNavigate, setTheme, toggleSidebar]);

  // Filter and sort items by fuzzy match
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;

    return allItems
      .map((item) => ({
        item,
        score: Math.max(
          fuzzyMatch(query, item.title),
          fuzzyMatch(query, item.path ?? ''),
          fuzzyMatch(query, item.category),
        ),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [query, allItems]);

  // Group items by category (preserving filtered order within groups)
  const groupedItems = useMemo(() => {
    const groups: { category: string; items: CommandItem[] }[] = [];
    const categoryMap = new Map<string, CommandItem[]>();

    for (const item of filteredItems) {
      const existing = categoryMap.get(item.category);
      if (existing) {
        existing.push(item);
      } else {
        const arr = [item];
        categoryMap.set(item.category, arr);
      }
    }

    for (const cat of CATEGORY_ORDER) {
      const items = categoryMap.get(cat);
      if (items && items.length > 0) {
        groups.push({ category: cat, items });
      }
    }

    return groups;
  }, [filteredItems]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(
    () => groupedItems.flatMap((g) => g.items),
    [groupedItems],
  );

  // Clamp selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to ensure the modal is mounted before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Global keyboard shortcut to open
  useEffect(() => {
    // This effect only handles Escape when open; the Cmd+K trigger
    // is expected to be handled by the parent that controls isOpen.
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      item.onSelect();
      onClose();
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatItems.length - 1 ? prev + 1 : 0,
          );
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatItems.length - 1,
          );
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const item = flatItems[selectedIndex];
          if (item) handleSelect(item);
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }
        case 'Tab': {
          // Trap focus inside the palette
          e.preventDefault();
          break;
        }
        default:
          break;
      }
    },
    [flatItems, selectedIndex, handleSelect, onClose],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  // Calculate which flat index each item is at
  let flatIndex = 0;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]',
        'bg-black/50 backdrop-blur-sm',
        'animate-fade-in',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className={clsx(
          'w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl',
          'border-gray-200 bg-white',
          'dark:border-surface-dark-3 dark:bg-surface-dark-1',
          'animate-slide-up',
          'flex flex-col',
        )}
        style={{ maxHeight: '70vh' }}
        onKeyDown={handleKeyDown}
      >
        {/* ── Search Input ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-surface-dark-3">
          <Search className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className={clsx(
              'flex-1 bg-transparent py-4 text-base font-medium outline-none',
              'text-gray-900 placeholder:text-gray-400',
              'dark:text-gray-100 dark:placeholder:text-gray-500',
            )}
            aria-label="Command palette search"
            aria-activedescendant={
              flatItems[selectedIndex]
                ? `cmd-item-${flatItems[selectedIndex].id}`
                : undefined
            }
            role="combobox"
            aria-expanded={true}
            aria-controls="command-palette-list"
            aria-autocomplete="list"
          />
          <button
            onClick={onClose}
            className={clsx(
              'rounded-lg p-1.5 text-gray-400 transition-colors',
              'hover:bg-gray-100 hover:text-gray-600',
              'dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
            )}
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Results ───────────────────────────────────────────────── */}
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          className="flex-1 overflow-y-auto overscroll-contain px-2 py-2"
        >
          {flatItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-3 h-10 w-10 text-gray-300 dark:text-surface-dark-4" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No results found
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Try a different search term
              </p>
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.category} className="mb-1">
                {/* Category header */}
                <div className="px-3 pb-1 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {CATEGORY_LABELS[group.category] ?? group.category}
                  </span>
                </div>

                {/* Items */}
                {group.items.map((item) => {
                  const currentFlatIndex = flatIndex;
                  flatIndex++;
                  const isSelected = currentFlatIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      id={`cmd-item-${item.id}`}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                      className={clsx(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-75',
                        isSelected
                          ? 'bg-forge-600/10 text-forge-700 dark:bg-forge-600/20 dark:text-forge-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-surface-dark-2',
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={clsx(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isSelected
                            ? 'bg-forge-600/15 text-forge-600 dark:bg-forge-600/25 dark:text-forge-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-surface-dark-3 dark:text-gray-400',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {item.title}
                        </div>
                        {item.path && (
                          <div
                            className={clsx(
                              'truncate text-xs',
                              isSelected
                                ? 'text-forge-600/70 dark:text-forge-400/70'
                                : 'text-gray-400 dark:text-gray-500',
                            )}
                          >
                            {item.path}
                          </div>
                        )}
                      </div>

                      {/* Shortcut hint */}
                      {item.shortcut && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <kbd
                            className={clsx(
                              'inline-flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-xs font-medium',
                              'border border-gray-200 bg-gray-50 text-gray-500',
                              'dark:border-surface-dark-4 dark:bg-surface-dark-3 dark:text-gray-400',
                            )}
                          >
                            {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
                          </kbd>
                          <kbd
                            className={clsx(
                              'inline-flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-xs font-medium',
                              'border border-gray-200 bg-gray-50 text-gray-500',
                              'dark:border-surface-dark-4 dark:bg-surface-dark-3 dark:text-gray-400',
                            )}
                          >
                            {item.shortcut}
                          </kbd>
                        </div>
                      )}

                      {/* Arrow indicator for selected */}
                      {isSelected && (
                        <ArrowRight className="h-4 w-4 shrink-0 text-forge-500 dark:text-forge-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div
          className={clsx(
            'flex items-center justify-between border-t px-4 py-2.5',
            'border-gray-200 bg-gray-50/80',
            'dark:border-surface-dark-3 dark:bg-surface-dark-0/50',
          )}
        >
          <div className="flex items-center gap-3">
            {/* Navigate hint */}
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-0.5">
                <kbd
                  className={clsx(
                    'inline-flex h-[18px] w-[18px] items-center justify-center rounded',
                    'border border-gray-200 bg-white text-xs',
                    'dark:border-surface-dark-4 dark:bg-surface-dark-2',
                  )}
                >
                  <ArrowUp className="h-2.5 w-2.5" />
                </kbd>
                <kbd
                  className={clsx(
                    'inline-flex h-[18px] w-[18px] items-center justify-center rounded',
                    'border border-gray-200 bg-white text-xs',
                    'dark:border-surface-dark-4 dark:bg-surface-dark-2',
                  )}
                >
                  <ArrowDown className="h-2.5 w-2.5" />
                </kbd>
              </span>
              Navigate
            </span>

            {/* Select hint */}
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <kbd
                className={clsx(
                  'inline-flex h-[18px] items-center justify-center rounded px-1',
                  'border border-gray-200 bg-white text-xs',
                  'dark:border-surface-dark-4 dark:bg-surface-dark-2',
                )}
              >
                <CornerDownLeft className="h-2.5 w-2.5" />
              </kbd>
              Select
            </span>

            {/* Close hint */}
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <kbd
                className={clsx(
                  'inline-flex h-[18px] items-center justify-center rounded px-1.5',
                  'border border-gray-200 bg-white text-[11px] font-medium',
                  'dark:border-surface-dark-4 dark:bg-surface-dark-2',
                )}
              >
                Esc
              </kbd>
              Close
            </span>
          </div>

          {/* Branding */}
          <div className="flex items-center gap-1.5 text-xs text-gray-300 dark:text-surface-dark-4">
            <Command className="h-3 w-3" />
            <span>DebateForge</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
