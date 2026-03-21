import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Bell, Trophy, Swords, AlertTriangle, CheckCircle,
  Clock, X, ChevronRight, Sparkles,
} from 'lucide-react';
import type { Debate } from '../../types';

export interface NotificationItem {
  id: string;
  type: 'debate_complete' | 'achievement' | 'fallacy' | 'milestone';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  icon: React.FC<{ className?: string }>;
  color: string;
}

export interface NotificationCenterProps {
  debates: Debate[];
  className?: string;
}

/**
 * Generates notifications from debate history for the bell dropdown.
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ debates, className }) => {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    const items: NotificationItem[] = [];

    // Generate notifications from completed debates
    const completed = debates
      .filter((d) => d.status === 'completed')
      .sort((a, b) => new Date(b.completedAt ?? b.updatedAt).getTime() - new Date(a.completedAt ?? a.updatedAt).getTime())
      .slice(0, 5);

    completed.forEach((d) => {
      items.push({
        id: `complete-${d.id}`,
        type: 'debate_complete',
        title: 'Debate Completed',
        description: d.topic?.slice(0, 60) ?? 'Unknown topic',
        timestamp: d.completedAt ?? d.updatedAt,
        read: readIds.has(`complete-${d.id}`),
        icon: Trophy,
        color: 'text-amber-500',
      });
    });

    // Fallacy milestones
    const totalFallacies = debates.reduce((sum, d) =>
      sum + (d.turns?.reduce((s, t) => s + (t.fallacies?.length ?? 0), 0) ?? 0), 0);
    if (totalFallacies >= 10) {
      items.push({
        id: 'fallacy-10',
        type: 'milestone',
        title: 'Fallacy Hunter',
        description: `${totalFallacies} logical fallacies detected across all debates`,
        timestamp: new Date().toISOString(),
        read: readIds.has('fallacy-10'),
        icon: AlertTriangle,
        color: 'text-amber-500',
      });
    }

    // Debate milestones
    if (debates.length >= 5) {
      items.push({
        id: 'debates-5',
        type: 'milestone',
        title: 'Debate Enthusiast',
        description: `You've run ${debates.length} debates! Keep going.`,
        timestamp: new Date().toISOString(),
        read: readIds.has('debates-5'),
        icon: Sparkles,
        color: 'text-forge-500',
      });
    }

    return items.slice(0, 8);
  }, [debates, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const getRelativeTime = (iso: string): string => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch { return ''; }
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={clsx(
            'absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg',
            'dark:border-surface-dark-3 dark:bg-surface-dark-1',
            'animate-scale-in origin-top-right',
          )}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-surface-dark-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-forge-600 hover:text-forge-700 dark:text-forge-400"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Items */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="mx-auto mb-2 h-6 w-6 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className={clsx(
                        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2',
                        !n.read && 'bg-forge-50/50 dark:bg-forge-900/5',
                      )}
                    >
                      <Icon className={clsx('h-5 w-5 shrink-0 mt-0.5', n.color)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-forge-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.description}</p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {getRelativeTime(n.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
