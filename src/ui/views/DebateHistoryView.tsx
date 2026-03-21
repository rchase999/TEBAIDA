import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  Search, X, Filter, Grid3X3, List, Table, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Trash2, Download, Archive, Upload, Clock, Trophy,
  Swords, MessageSquare, Calendar, SlidersHorizontal,
  ArrowUpDown, Eye, MoreHorizontal, Check, XCircle,
  Target, Play, LayoutGrid, LayoutList,
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { EmptyState } from '../components/EmptyState';
import type { Debate, DebateFormat, DebateStatus } from '../../types';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

type ViewMode = 'cards' | 'list' | 'table';
type SortField = 'date' | 'topic' | 'turns';
type SortDir = 'asc' | 'desc';

const FORMAT_LABELS: Record<DebateFormat, string> = {
  'oxford-union': 'Oxford Union',
  'lincoln-douglas': 'Lincoln-Douglas',
  'parliamentary': 'Parliamentary',
};

const STATUS_CONFIG: Record<
  DebateStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }
> = {
  setup: { label: 'Setup', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'info' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

const STATUS_ICONS: Record<DebateStatus, React.FC<{ className?: string }>> = {
  setup: Target,
  'in-progress': Play,
  paused: Clock,
  completed: Trophy,
  cancelled: XCircle,
};

const PAGE_SIZES = [10, 25, 50] as const;

const VIEW_MODE_STORAGE_KEY = 'debateforge-history-view-mode';

function getRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  } catch {
    return iso;
  }
}

function getAvatarColor(id: string): string {
  const colors = [
    'bg-blue-500', 'bg-rose-500', 'bg-emerald-500',
    'bg-purple-500', 'bg-amber-500', 'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ------------------------------------------------------------------ */
/*  Debounced search hook                                             */
/* ------------------------------------------------------------------ */

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/* ------------------------------------------------------------------ */
/*  Filter chip                                                       */
/* ------------------------------------------------------------------ */

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-forge-100 px-2.5 py-0.5 text-xs font-medium text-forge-700 dark:bg-forge-900/30 dark:text-forge-400">
    {label}
    <button
      onClick={onRemove}
      className="ml-0.5 rounded-full p-0.5 hover:bg-forge-200 dark:hover:bg-forge-800/50"
      aria-label={`Remove filter: ${label}`}
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

/* ------------------------------------------------------------------ */
/*  Card View                                                         */
/* ------------------------------------------------------------------ */

interface DebateCardProps {
  debate: Debate;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
}

const DebateCard: React.FC<DebateCardProps> = ({ debate, selected, onToggle, onView }) => {
  const sc = STATUS_CONFIG[debate.status];
  const formatLabel = FORMAT_LABELS[debate.format.id] ?? debate.format.id;

  return (
    <Card hover className="relative" onClick={onView}>
      {/* Selection checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={clsx(
          'absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded border transition-colors',
          selected
            ? 'border-forge-500 bg-forge-500 text-white'
            : 'border-gray-300 bg-white hover:border-forge-400 dark:border-surface-dark-4 dark:bg-surface-dark-2',
        )}
        aria-label="Select debate"
      >
        {selected && <Check className="h-3 w-3" />}
      </button>

      {/* Badges */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={sc.variant} size="sm">
          {sc.label}
        </Badge>
        <Badge size="sm">{formatLabel}</Badge>
      </div>

      {/* Topic */}
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 pr-6">
        {debate.topic}
      </h3>

      {/* Debater avatars */}
      <div className="mb-2 flex -space-x-1.5">
        {debate.debaters
          .filter((d) => d.position !== 'housemaster')
          .map((d) => (
            <div
              key={d.id}
              className={clsx(
                'flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white dark:border-surface-dark-1',
                getAvatarColor(d.id),
              )}
              title={d.name}
            >
              {d.name.charAt(0).toUpperCase()}
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {getRelativeTime(debate.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {debate.turns.length} turns
        </span>
      </div>

      {/* Verdict preview */}
      {debate.scores && debate.scores.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-1 italic">
          {debate.scores.map((s) => s.notes).filter(Boolean).join(' ').slice(0, 100)}
        </p>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  List View Row                                                     */
/* ------------------------------------------------------------------ */

interface ListRowProps {
  debate: Debate;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
}

const ListRow: React.FC<ListRowProps> = ({ debate, selected, onToggle, onView }) => {
  const sc = STATUS_CONFIG[debate.status];
  const formatLabel = FORMAT_LABELS[debate.format.id] ?? debate.format.id;

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors cursor-pointer',
        selected
          ? 'border-forge-300 bg-forge-50 dark:border-forge-700 dark:bg-forge-900/10'
          : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:bg-surface-dark-2',
      )}
      onClick={onView}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={clsx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
          selected
            ? 'border-forge-500 bg-forge-500 text-white'
            : 'border-gray-300 bg-white hover:border-forge-400 dark:border-surface-dark-4 dark:bg-surface-dark-2',
        )}
        aria-label="Select debate"
      >
        {selected && <Check className="h-3 w-3" />}
      </button>

      {/* Topic */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {debate.topic}
        </p>
      </div>

      {/* Format */}
      <Badge size="sm">{formatLabel}</Badge>

      {/* Status */}
      <Badge variant={sc.variant} size="sm">
        {sc.label}
      </Badge>

      {/* Debater avatars */}
      <div className="hidden sm:flex -space-x-1.5">
        {debate.debaters
          .filter((d) => d.position !== 'housemaster')
          .slice(0, 3)
          .map((d) => (
            <div
              key={d.id}
              className={clsx(
                'flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white dark:border-surface-dark-1',
                getAvatarColor(d.id),
              )}
              title={d.name}
            >
              {d.name.charAt(0).toUpperCase()}
            </div>
          ))}
      </div>

      {/* Date */}
      <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:block whitespace-nowrap">
        {getRelativeTime(debate.createdAt)}
      </span>

      {/* View */}
      <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />} onClick={onView}>
        View
      </Button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Table View                                                        */
/* ------------------------------------------------------------------ */

interface TableViewProps {
  debates: Debate[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onView: (debate: Debate) => void;
}

const SortIcon: React.FC<{
  field: SortField;
  activeField: SortField;
  dir: SortDir;
}> = ({ field, activeField, dir }) => {
  if (field !== activeField) {
    return <ArrowUpDown className="h-3 w-3 text-gray-300 dark:text-gray-600" />;
  }
  return dir === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-forge-500" />
  ) : (
    <ChevronDown className="h-3 w-3 text-forge-500" />
  );
};

const DebateTable: React.FC<TableViewProps> = ({
  debates,
  selected,
  onToggle,
  onToggleAll,
  allSelected,
  sortField,
  sortDir,
  onSort,
  onView,
}) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-surface-dark-3">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-2">
          <th className="w-10 px-4 py-3">
            <button
              onClick={onToggleAll}
              className={clsx(
                'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                allSelected
                  ? 'border-forge-500 bg-forge-500 text-white'
                  : 'border-gray-300 bg-white dark:border-surface-dark-4 dark:bg-surface-dark-1',
              )}
              aria-label="Select all"
            >
              {allSelected && <Check className="h-3 w-3" />}
            </button>
          </th>
          <th className="px-4 py-3">
            <button
              onClick={() => onSort('topic')}
              className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Topic
              <SortIcon field="topic" activeField={sortField} dir={sortDir} />
            </button>
          </th>
          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Format</th>
          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Debaters</th>
          <th className="px-4 py-3">
            <button
              onClick={() => onSort('turns')}
              className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Turns
              <SortIcon field="turns" activeField={sortField} dir={sortDir} />
            </button>
          </th>
          <th className="px-4 py-3">
            <button
              onClick={() => onSort('date')}
              className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Date
              <SortIcon field="date" activeField={sortField} dir={sortDir} />
            </button>
          </th>
          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-3">
        {debates.map((d) => {
          const sc = STATUS_CONFIG[d.status];
          const formatLabel = FORMAT_LABELS[d.format.id] ?? d.format.id;
          const isSelected = selected.has(d.id);

          return (
            <tr
              key={d.id}
              className={clsx(
                'transition-colors cursor-pointer',
                isSelected
                  ? 'bg-forge-50 dark:bg-forge-900/10'
                  : 'bg-white hover:bg-gray-50 dark:bg-surface-dark-1 dark:hover:bg-surface-dark-2',
              )}
              onClick={() => onView(d)}
            >
              <td className="px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(d.id);
                  }}
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                    isSelected
                      ? 'border-forge-500 bg-forge-500 text-white'
                      : 'border-gray-300 bg-white dark:border-surface-dark-4 dark:bg-surface-dark-2',
                  )}
                  aria-label="Select"
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              </td>
              <td className="max-w-xs px-4 py-3">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{d.topic}</p>
              </td>
              <td className="px-4 py-3">
                <Badge size="sm">{formatLabel}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={sc.variant} size="sm">
                  {sc.label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex -space-x-1.5">
                  {d.debaters
                    .filter((db) => db.position !== 'housemaster')
                    .slice(0, 3)
                    .map((db) => (
                      <div
                        key={db.id}
                        className={clsx(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white dark:border-surface-dark-1',
                          getAvatarColor(db.id),
                        )}
                        title={db.name}
                      >
                        {db.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">
                {d.turns.length}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {getRelativeTime(d.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye className="h-4 w-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(d);
                  }}
                >
                  View
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main DebateHistoryView                                            */
/* ------------------------------------------------------------------ */

const DebateHistoryView: React.FC = () => {
  const debates = useStore((s) => s.debates);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const deleteDebate = useStore((s) => s.deleteDebate);

  // View mode (persisted)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored === 'cards' || stored === 'list' || stored === 'table') return stored;
    } catch { /* ignore */ }
    return 'cards';
  });

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch { /* ignore */ }
  }, [viewMode]);

  // Search
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Filters
  const [statusFilter, setStatusFilter] = useState<DebateStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<DebateFormat | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, formatFilter, sortField, sortDir, pageSize]);

  // Handle sort toggle
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir(field === 'topic' ? 'asc' : 'desc');
      }
    },
    [sortField],
  );

  // Filtered + sorted debates
  const filteredDebates = useMemo(() => {
    let result = [...debates];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (d) =>
          d.topic.toLowerCase().includes(q) ||
          d.debaters.some((db) => db.name.toLowerCase().includes(q)) ||
          d.debaters.some((db) => db.model.displayName.toLowerCase().includes(q)),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Format filter
    if (formatFilter !== 'all') {
      result = result.filter((d) => d.format.id === formatFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'topic':
          cmp = a.topic.localeCompare(b.topic);
          break;
        case 'turns':
          cmp = a.turns.length - b.turns.length;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [debates, debouncedSearch, statusFilter, formatFilter, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDebates.length / pageSize));
  const paginatedDebates = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDebates.slice(start, start + pageSize);
  }, [filteredDebates, page, pageSize]);

  const rangeStart = filteredDebates.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredDebates.length);

  // Selection helpers
  const toggleSelection = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === paginatedDebates.length) return new Set();
      return new Set(paginatedDebates.map((d) => d.id));
    });
  }, [paginatedDebates]);

  const allSelected = paginatedDebates.length > 0 && selected.size === paginatedDebates.length;

  // Active filters
  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (statusFilter !== 'all') {
    activeFilters.push({
      label: `Status: ${STATUS_CONFIG[statusFilter].label}`,
      onRemove: () => setStatusFilter('all'),
    });
  }
  if (formatFilter !== 'all') {
    activeFilters.push({
      label: `Format: ${FORMAT_LABELS[formatFilter]}`,
      onRemove: () => setFormatFilter('all'),
    });
  }

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all');
    setFormatFilter('all');
    setSearchInput('');
  }, []);

  // Bulk actions
  const handleBulkDelete = useCallback(() => {
    selected.forEach((id) => deleteDebate(id));
    setSelected(new Set());
  }, [selected, deleteDebate]);

  // View a debate
  const handleViewDebate = useCallback(
    (_debate: Debate) => {
      setCurrentView('home');
    },
    [setCurrentView],
  );

  // Unique model providers in debates for potential filter
  const availableFormats = useMemo(() => {
    const formats = new Set<DebateFormat>();
    debates.forEach((d) => formats.add(d.format.id));
    return Array.from(formats);
  }, [debates]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Debate History</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filteredDebates.length} debate{filteredDebates.length !== 1 ? 's' : ''} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import CSV (scaffold) */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Upload className="h-4 w-4" />}
          >
            Import CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setCurrentView('setup')}
            icon={<Plus className="h-4 w-4" />}
          >
            New Debate
          </Button>
        </div>
      </div>

      {/* Search + View mode toggle + Filter toggle */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search debates by topic, debater, or model..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="sm"
            icon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-forge-500 text-[10px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </Button>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-2">
            {([
              { mode: 'cards' as ViewMode, Icon: LayoutGrid, label: 'Cards' },
              { mode: 'list' as ViewMode, Icon: LayoutList, label: 'List' },
              { mode: 'table' as ViewMode, Icon: Table, label: 'Table' },
            ]).map(({ mode, Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors',
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-surface-dark-1 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                  mode === 'cards' && 'rounded-l-md',
                  mode === 'table' && 'rounded-r-md',
                )}
                aria-label={label}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sort by:</span>
        {([
          { field: 'date' as SortField, label: 'Date' },
          { field: 'topic' as SortField, label: 'Topic (A-Z)' },
          { field: 'turns' as SortField, label: 'Turns' },
        ]).map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={clsx(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              sortField === field
                ? 'bg-forge-100 text-forge-700 dark:bg-forge-900/30 dark:text-forge-400'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200',
            )}
          >
            {label}
            {sortField === field && (
              sortDir === 'asc' ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )
            )}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="mb-4">
          <div className="flex flex-wrap gap-4">
            {/* Status filter */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DebateStatus | 'all')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="setup">Setup</option>
              </select>
            </div>

            {/* Format filter */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Format
              </label>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value as DebateFormat | 'all')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100"
              >
                <option value="all">All</option>
                {availableFormats.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((af) => (
            <FilterChip key={af.label} label={af.label} onRemove={af.onRemove} />
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-forge-200 bg-forge-50 px-4 py-2 dark:border-forge-800 dark:bg-forge-900/20">
          <span className="text-sm font-medium text-forge-700 dark:text-forge-400">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-4 w-4 text-red-500" />}
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
            <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
              Export
            </Button>
            <Button variant="ghost" size="sm" icon={<Archive className="h-4 w-4" />}>
              Archive
            </Button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Content */}
      {filteredDebates.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No debates yet"
          description={
            debouncedSearch || activeFilters.length > 0
              ? 'No debates match your current filters. Try adjusting your search or filters.'
              : 'Start your first debate and it will appear here.'
          }
          action={
            debouncedSearch || activeFilters.length > 0
              ? { label: 'Clear Filters', onClick: clearAllFilters }
              : { label: 'Start a Debate', onClick: () => setCurrentView('setup'), icon: <Plus className="h-4 w-4" /> }
          }
        />
      ) : (
        <>
          {/* Card view */}
          {viewMode === 'cards' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedDebates.map((d) => (
                <DebateCard
                  key={d.id}
                  debate={d}
                  selected={selected.has(d.id)}
                  onToggle={() => toggleSelection(d.id)}
                  onView={() => handleViewDebate(d)}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {paginatedDebates.map((d) => (
                <ListRow
                  key={d.id}
                  debate={d}
                  selected={selected.has(d.id)}
                  onToggle={() => toggleSelection(d.id)}
                  onView={() => handleViewDebate(d)}
                />
              ))}
            </div>
          )}

          {/* Table view */}
          {viewMode === 'table' && (
            <DebateTable
              debates={paginatedDebates}
              selected={selected}
              onToggle={toggleSelection}
              onToggleAll={toggleAll}
              allSelected={allSelected}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onView={handleViewDebate}
            />
          )}

          {/* Pagination */}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Showing {rangeStart}-{rangeEnd} of {filteredDebates.length} debates
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-300"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} / page
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>

              <span className="px-3 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>

              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default DebateHistoryView;
