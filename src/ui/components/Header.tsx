import React from 'react';
import clsx from 'clsx';
import { Settings, Sun, Moon, Swords } from 'lucide-react';

export interface HeaderProps {
  currentDebateTopic?: string;
  theme: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentDebateTopic,
  theme,
  onThemeToggle,
  onSettingsClick,
  className,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={clsx(
        'flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5',
        'dark:border-surface-dark-3 dark:bg-surface-dark-0',
        className,
      )}
    >
      {/* Left: Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-forge-600 dark:text-forge-400 shrink-0" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">DebateForge</h1>
        </div>

        {currentDebateTopic && (
          <>
            <span className="text-gray-300 dark:text-surface-dark-4 shrink-0">/</span>
            <span className="truncate text-sm text-gray-500 dark:text-gray-400">
              {currentDebateTopic}
            </span>
          </>
        )}

        {!currentDebateTopic && (
          <span className="hidden sm:inline text-sm text-gray-400 dark:text-gray-500">
            AI-Powered Debate Arena
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onThemeToggle}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
