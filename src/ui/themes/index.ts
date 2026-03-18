import { useEffect } from 'react';
import { useStore } from '../store';
import type { ThemeMode } from '../store';

// ---------------------------------------------------------------------------
// Theme token objects
// ---------------------------------------------------------------------------

export interface ThemeTokens {
  /** Human-readable label */
  name: string;

  // Surface / background
  bg: string;
  bgAlt: string;
  bgElevated: string;
  bgOverlay: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand / accent
  accent: string;
  accentHover: string;
  accentMuted: string;

  // Borders
  border: string;
  borderFocus: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Debate specific
  debaterFor: string;
  debaterAgainst: string;
  debaterNeutral: string;

  // Scrollbar
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;

  // Shadows
  shadow: string;
  shadowLg: string;
}

export const lightTheme: ThemeTokens = {
  name: 'Light',

  bg: '#ffffff',
  bgAlt: '#f8f9fa',
  bgElevated: '#ffffff',
  bgOverlay: 'rgba(0, 0, 0, 0.5)',

  text: '#1a1b1e',
  textSecondary: '#495057',
  textMuted: '#868e96',
  textInverse: '#ffffff',

  accent: '#4c6ef5',
  accentHover: '#4263eb',
  accentMuted: '#dbe4ff',

  border: '#dee2e6',
  borderFocus: '#4c6ef5',

  success: '#40c057',
  warning: '#fab005',
  error: '#fa5252',
  info: '#339af0',

  debaterFor: '#40c057',
  debaterAgainst: '#fa5252',
  debaterNeutral: '#868e96',

  scrollbarTrack: '#f1f3f5',
  scrollbarThumb: '#ced4da',
  scrollbarThumbHover: '#adb5bd',

  shadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
};

export const darkTheme: ThemeTokens = {
  name: 'Dark',

  bg: '#1a1b1e',
  bgAlt: '#25262b',
  bgElevated: '#2c2e33',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',

  text: '#f1f3f5',
  textSecondary: '#ced4da',
  textMuted: '#868e96',
  textInverse: '#1a1b1e',

  accent: '#5c7cfa',
  accentHover: '#748ffc',
  accentMuted: '#364fc7',

  border: '#373a40',
  borderFocus: '#5c7cfa',

  success: '#51cf66',
  warning: '#fcc419',
  error: '#ff6b6b',
  info: '#4dabf7',

  debaterFor: '#51cf66',
  debaterAgainst: '#ff6b6b',
  debaterNeutral: '#909296',

  scrollbarTrack: '#25262b',
  scrollbarThumb: '#495057',
  scrollbarThumbHover: '#5c5f66',

  shadow: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
};

// ---------------------------------------------------------------------------
// Resolve the effective theme (light or dark) from the mode setting
// ---------------------------------------------------------------------------
function resolveEffective(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

// ---------------------------------------------------------------------------
// useTheme hook
//
// Reads the store's theme mode, applies the correct 'dark' class on
// <html>, and returns the active token object plus a setter.
// Also listens for OS-level preference changes when mode is 'system'.
// ---------------------------------------------------------------------------
export function useTheme() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const effective = resolveEffective(theme);
  const tokens = effective === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    const root = document.documentElement;

    // Apply / remove the class
    if (effective === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = effective;
  }, [effective]);

  // Listen for OS-level changes when using 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      const root = document.documentElement;
      const nowDark = mq.matches;
      if (nowDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.style.colorScheme = nowDark ? 'dark' : 'light';
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, effective, tokens, setTheme } as const;
}

// Re-export for convenience
export type { ThemeMode };
