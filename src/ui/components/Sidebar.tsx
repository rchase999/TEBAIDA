import React, { useState } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Swords,
  User,
  HelpCircle,
  Info,
  FileText,
  Users,
  Trophy,
  Settings,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  BarChart3,
  PieChart,
  Search,
  Sparkles,
  ChevronDown,
  Monitor,
  History,
  Library,
} from 'lucide-react';

export type AppView = 'home' | 'new-debate' | 'history' | 'personas' | 'tournament' | 'leaderboard' | 'statistics' | 'settings' | 'profile' | 'about' | 'help' | 'changelog';

export interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  theme: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
  onSearchClick?: () => void;
  debateCount?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'new-debate', label: 'New Debate', icon: Swords },
      { id: 'history', label: 'History', icon: History },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { id: 'personas', label: 'Personas', icon: Users },
      { id: 'tournament', label: 'Tournament', icon: Trophy, badge: 'Beta', badgeColor: 'text-purple-400 bg-purple-400/10' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
      { id: 'statistics', label: 'Statistics', icon: PieChart },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'profile', label: 'My Profile', icon: User },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  theme,
  onThemeToggle,
  onSearchClick,
  debateCount = 0,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const isDark = theme === 'dark' || theme === 'system';
  const themeIcon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor;
  const ThemeIcon = themeIcon;
  const themeLabel = theme === 'dark' ? 'Light Mode' : theme === 'light' ? 'Dark Mode' : 'System';

  return (
    <aside
      className={clsx(
        'flex h-full flex-col border-r border-gray-200/80 bg-white/80 backdrop-blur-xl transition-all duration-300 ease-in-out',
        'dark:border-surface-dark-3/80 dark:bg-surface-dark-0/80',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Brand + collapse */}
      <div className="flex items-center justify-between border-b border-gray-200/60 px-3 py-4 dark:border-surface-dark-3/60">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-forge-500 to-forge-700 shadow-sm">
              <Swords className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                DebateForge
              </span>
              <span className="block text-[10px] font-medium text-gray-400 dark:text-gray-500">
                AI Debate Arena
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={clsx(
            'rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600',
            'dark:text-gray-500 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Search trigger */}
      {!collapsed && onSearchClick && (
        <div className="px-3 pt-3">
          <button
            onClick={onSearchClick}
            className={clsx(
              'flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400',
              'transition-all duration-200 hover:border-forge-300 hover:bg-white hover:text-gray-500',
              'dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:text-gray-500',
              'dark:hover:border-forge-700 dark:hover:bg-surface-dark-1 dark:hover:text-gray-400',
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-surface-dark-4 dark:bg-surface-dark-3 dark:text-gray-500">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </button>
        </div>
      )}

      {collapsed && onSearchClick && (
        <div className="px-2 pt-3">
          <button
            onClick={onSearchClick}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300"
            title="Search (Cmd+K)"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navSections.map((section, sIdx) => (
          <div key={section.title} className={clsx(sIdx > 0 && 'mt-4')}>
            {/* Section header */}
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {section.title}
              </p>
            )}
            {collapsed && sIdx > 0 && (
              <div className="mx-3 my-2 h-px bg-gray-200 dark:bg-surface-dark-3" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={clsx(
                      'group relative flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-forge-600/10 text-forge-600 dark:bg-forge-500/15 dark:text-forge-400'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200',
                      collapsed && 'justify-center px-2',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-forge-600 dark:bg-forge-400 transition-all" />
                    )}
                    <Icon
                      className={clsx(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        isActive ? 'text-forge-600 dark:text-forge-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300',
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="ml-3 truncate">{item.label}</span>
                        {item.badge && (
                          <span className={clsx(
                            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                            item.badgeColor || 'text-forge-600 bg-forge-100 dark:text-forge-400 dark:bg-forge-900/30',
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200/60 px-2 py-2 dark:border-surface-dark-3/60">
        {/* Help & About links */}
        {!collapsed && (
          <div className="flex items-center gap-1 px-1 mb-1">
            <button onClick={() => onViewChange('help')} className="flex-1 rounded-md px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-surface-dark-2 transition-colors">
              Help
            </button>
            <button onClick={() => onViewChange('about')} className="flex-1 rounded-md px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-surface-dark-2 transition-colors">
              About
            </button>
            <button onClick={() => onViewChange('changelog')} className="flex-1 rounded-md px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-surface-dark-2 transition-colors">
              Changelog
            </button>
          </div>
        )}

        {/* Settings */}
        <button
          onClick={() => onViewChange('settings')}
          className={clsx(
            'flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            currentView === 'settings'
              ? 'bg-forge-600/10 text-forge-600 dark:bg-forge-500/15 dark:text-forge-400'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="ml-3">Settings</span>}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className={clsx(
            'flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-all duration-150',
            'hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? themeLabel : undefined}
        >
          <ThemeIcon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="ml-3">{themeLabel}</span>}
        </button>
      </div>

      {/* Debate count footer */}
      {!collapsed && debateCount > 0 && (
        <div className="border-t border-gray-200/60 px-4 py-3 dark:border-surface-dark-3/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-forge-500" />
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              {debateCount} debate{debateCount !== 1 ? 's' : ''} completed
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
