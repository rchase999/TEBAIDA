import React, { useState } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Swords,
  Users,
  Trophy,
  Settings,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  BarChart3,
  PieChart,
} from 'lucide-react';

export type AppView = 'home' | 'new-debate' | 'personas' | 'tournament' | 'leaderboard' | 'statistics' | 'settings';

export interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  theme: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'new-debate', label: 'New Debate', icon: Swords },
  { id: 'personas', label: 'Personas', icon: Users },
  { id: 'tournament', label: 'Tournament', icon: Trophy },
  { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { id: 'statistics', label: 'Statistics', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  theme,
  onThemeToggle,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const isDark = theme === 'dark';

  return (
    <aside
      className={clsx(
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300',
        'dark:border-surface-dark-3 dark:bg-surface-dark-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Top: brand + collapse */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-4 dark:border-surface-dark-3">
        {!collapsed && (
          <span className="text-lg font-bold text-forge-600 dark:text-forge-400 truncate">
            DebateForge
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={clsx(
            'rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-surface-dark-2',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx(
                'flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-forge-600/10 text-forge-600 dark:bg-forge-600/20 dark:text-forge-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={clsx(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-forge-600 dark:text-forge-400' : '',
                )}
              />
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-2 w-2 rounded-full bg-forge-600 dark:bg-forge-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: theme toggle */}
      <div className="border-t border-gray-200 px-2 py-3 dark:border-surface-dark-3">
        <button
          onClick={onThemeToggle}
          className={clsx(
            'flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors',
            'hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-surface-dark-2',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
        >
          {isDark ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && (
            <span className="ml-3">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
