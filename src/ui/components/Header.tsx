import React, { useState } from 'react';
import clsx from 'clsx';
import {
  Settings, Sun, Moon, Swords, Search, Bell,
  Command, ChevronRight, Monitor, Keyboard,
  HelpCircle, ExternalLink, Bug,
} from 'lucide-react';

export interface HeaderProps {
  currentDebateTopic?: string;
  currentView?: string;
  theme: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
  onShortcutsClick?: () => void;
  className?: string;
}

const VIEW_LABELS: Record<string, string> = {
  home: 'Dashboard',
  setup: 'New Debate',
  debate: 'Debate',
  personas: 'Personas',
  settings: 'Settings',
  tournament: 'Tournament',
  leaderboard: 'Leaderboard',
  statistics: 'Statistics',
};

export const Header: React.FC<HeaderProps> = ({
  currentDebateTopic,
  currentView = 'home',
  theme,
  onThemeToggle,
  onSettingsClick,
  onSearchClick,
  onShortcutsClick,
  className,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isDark = theme === 'dark';

  const viewLabel = VIEW_LABELS[currentView] ?? 'DebateForge';

  return (
    <header
      className={clsx(
        'flex h-14 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/80 px-5 backdrop-blur-xl',
        'dark:border-surface-dark-3/80 dark:bg-surface-dark-0/80',
        className,
      )}
      role="banner"
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <span className="font-medium text-gray-500 dark:text-gray-400">
            {viewLabel}
          </span>
          {currentDebateTopic && currentView === 'debate' && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-surface-dark-4 shrink-0" />
              <span className="truncate text-gray-900 dark:text-gray-100 font-medium max-w-xs">
                {currentDebateTopic}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search trigger */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className={clsx(
              'hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400',
              'transition-all duration-200 hover:border-forge-300 hover:bg-white hover:text-gray-500',
              'dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:text-gray-500',
              'dark:hover:border-forge-700 dark:hover:bg-surface-dark-1 dark:hover:text-gray-400',
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="flex items-center gap-0.5 rounded border border-gray-300 bg-white px-1 py-0.5 text-[10px] font-medium text-gray-400 dark:border-surface-dark-4 dark:bg-surface-dark-3 dark:text-gray-500">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </button>
        )}

        {/* Mobile search */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="sm:hidden rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {/* Keyboard shortcuts */}
        {onShortcutsClick && (
          <button
            onClick={onShortcutsClick}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-5 w-5" />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Settings */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}

        {/* Profile avatar */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-forge-500 to-forge-700 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
            aria-label="User menu"
          >
            DF
          </button>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
              <div className={clsx(
                'absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg',
                'dark:border-surface-dark-3 dark:bg-surface-dark-1',
                'animate-scale-in',
              )}>
                <div className="border-b border-gray-100 px-3 py-2 dark:border-surface-dark-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">DebateForge</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</p>
                </div>
                <div className="py-1">
                  {onSettingsClick && (
                    <button
                      onClick={() => { setShowProfileMenu(false); onSettingsClick(); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-surface-dark-2"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                  )}
                  {onShortcutsClick && (
                    <button
                      onClick={() => { setShowProfileMenu(false); onShortcutsClick(); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-surface-dark-2"
                    >
                      <Keyboard className="h-4 w-4" /> Keyboard Shortcuts
                    </button>
                  )}
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-surface-dark-2"
                  >
                    <HelpCircle className="h-4 w-4" /> Help & Docs
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
