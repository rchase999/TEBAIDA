import React from 'react';
import clsx from 'clsx';
import { ArrowUp, ArrowDown, ArrowUpDown, Inbox } from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
  onSort?: (key: string, direction: SortDirection) => void;
  sortBy?: string;
  sortDir?: SortDirection;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T, index: number) => void;
  stickyHeader?: boolean;
  className?: string;
}

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className="border-b border-gray-100 dark:border-surface-dark-3">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className={clsx(
              'h-4 rounded bg-gray-200 dark:bg-surface-dark-3',
              'animate-shimmer bg-[length:200%_100%] bg-shimmer-gradient',
            )}
            style={{ width: `${50 + Math.random() * 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  sortBy,
  sortDir,
  loading = false,
  loadingRows = 5,
  emptyTitle = 'No data',
  emptyDescription = 'There are no records to display.',
  onRowClick,
  stickyHeader = true,
  className,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    let nextDir: SortDirection = 'asc';
    if (sortBy === key && sortDir === 'asc') nextDir = 'desc';
    onSort(key, nextDir);
  };

  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;

    if (sortBy === column.key) {
      return sortDir === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      );
    }
    return <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />;
  };

  const isEmpty = !loading && data.length === 0;

  return (
    <div
      className={clsx(
        'overflow-x-auto rounded-xl border border-gray-200 bg-white',
        'dark:border-surface-dark-3 dark:bg-surface-dark-1',
        className,
      )}
    >
      <table className="w-full text-sm" role="table">
        <thead>
          <tr
            className={clsx(
              'border-b border-gray-200 dark:border-surface-dark-3',
              stickyHeader && 'sticky top-0 z-10 bg-gray-50 dark:bg-surface-dark-2',
              !stickyHeader && 'bg-gray-50 dark:bg-surface-dark-2',
            )}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
                  'text-gray-500 dark:text-gray-400',
                  col.sortable && 'cursor-pointer select-none',
                  col.headerClassName,
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  sortBy === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  {renderSortIcon(col)}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <SkeletonRow key={`skeleton-${i}`} colCount={columns.length} />
            ))
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {emptyTitle}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {emptyDescription}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                className={clsx(
                  'border-b border-gray-100 dark:border-surface-dark-3 last:border-b-0',
                  'transition-colors duration-100',
                  'hover:bg-gray-50 dark:hover:bg-surface-dark-2',
                  rowIndex % 2 === 1 && 'bg-gray-50/50 dark:bg-surface-dark-2/30',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => {
                  const value = row[col.key as keyof T];
                  return (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4 py-3 text-gray-700 dark:text-gray-300',
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(value, row, rowIndex)
                        : (value as React.ReactNode) ?? '\u2014'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
