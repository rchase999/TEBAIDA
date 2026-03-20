import { useEffect, useCallback, useRef, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeyboardShortcut {
  /** The key to listen for (case-insensitive, e.g. "k", "Escape", "1") */
  key: string;
  /** Whether Ctrl (Windows/Linux) or Cmd (Mac) must be held. */
  ctrl?: boolean;
  /** Whether Shift must be held. */
  shift?: boolean;
  /** Whether Alt (Option on Mac) must be held. */
  alt?: boolean;
  /** Callback invoked when the shortcut fires. */
  action: () => void;
  /** Human-readable description shown in the shortcuts modal. */
  description: string;
  /** Category for grouping (e.g. "Navigation", "Actions", "Views"). */
  category: string;
}

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform ?? navigator.userAgent);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when the active element is a text input or editable area. */
function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Normalise the primary modifier: on macOS we treat metaKey as the
 * "ctrl" modifier so that Cmd behaves the same as Ctrl on other platforms.
 */
function hasPrimaryModifier(e: KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey;
}

// ---------------------------------------------------------------------------
// useKeyboardShortcuts
//
// Registers a set of keyboard shortcuts on the window. Shortcuts whose
// `ctrl` flag is set will match both Ctrl (Win/Linux) and Cmd (Mac).
// While the user is typing in an input / textarea, all shortcuts are
// suppressed EXCEPT Escape.
// ---------------------------------------------------------------------------

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  // Keep a stable ref so the keydown handler always sees the latest shortcuts
  // without needing to re-attach the listener.
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const current = shortcutsRef.current;
    if (current.length === 0) return;

    const inEditable = isEditableTarget(e.target);
    const pressedKey = e.key.toLowerCase();

    for (const shortcut of current) {
      // ── Modifier checks ────────────────────────────────────────────────
      const wantsCtrl = shortcut.ctrl === true;
      const wantsShift = shortcut.shift === true;
      const wantsAlt = shortcut.alt === true;

      const ctrlMatch = wantsCtrl ? hasPrimaryModifier(e) : !hasPrimaryModifier(e);
      const shiftMatch = wantsShift ? e.shiftKey : !e.shiftKey;
      const altMatch = wantsAlt ? e.altKey : !e.altKey;

      if (!ctrlMatch || !shiftMatch || !altMatch) continue;

      // ── Key match ──────────────────────────────────────────────────────
      if (pressedKey !== shortcut.key.toLowerCase()) continue;

      // ── Input suppression ──────────────────────────────────────────────
      // When the user is focused in an editable field, only Escape fires.
      if (inEditable && pressedKey !== 'escape') continue;

      // ── Fire! ──────────────────────────────────────────────────────────
      e.preventDefault();
      e.stopPropagation();
      shortcut.action();
      return; // first match wins
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);
}

// ---------------------------------------------------------------------------
// DEFAULT_SHORTCUTS
//
// A static list of all app-wide shortcuts. Actions are no-ops by default;
// they are meant to be overridden at the call site via useGlobalShortcuts
// or by wiring them in useKeyboardShortcuts directly.
// ---------------------------------------------------------------------------

export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  // ── Navigation ──────────────────────────────────────────────────────────
  { key: 'k', ctrl: true, description: 'Command palette', category: 'Navigation' },
  { key: '/', ctrl: true, description: 'Toggle sidebar', category: 'Navigation' },
  { key: '?', description: 'Keyboard shortcuts', category: 'Navigation' },

  // ── Views ───────────────────────────────────────────────────────────────
  { key: '1', ctrl: true, description: 'Home', category: 'Views' },
  { key: '2', ctrl: true, description: 'New Debate', category: 'Views' },
  { key: '3', ctrl: true, description: 'Personas', category: 'Views' },
  { key: '4', ctrl: true, description: 'Tournament', category: 'Views' },
  { key: '5', ctrl: true, description: 'Leaderboard', category: 'Views' },
  { key: '6', ctrl: true, description: 'Statistics', category: 'Views' },
  { key: '7', ctrl: true, description: 'Settings', category: 'Views' },

  // ── Actions ─────────────────────────────────────────────────────────────
  { key: 'n', ctrl: true, description: 'New debate', category: 'Actions' },
  { key: 'e', ctrl: true, description: 'Export debates', category: 'Actions' },
  { key: 'd', ctrl: true, description: 'Toggle dark mode', category: 'Actions' },
  { key: 'Escape', description: 'Close modal / palette', category: 'Actions' },
];

// ---------------------------------------------------------------------------
// useGlobalShortcuts
//
// Returns the canonical list of shortcuts (without bound actions) so that
// the KeyboardShortcutsModal can render them.  Each consumer can call
// useKeyboardShortcuts separately with their own action bindings.
// ---------------------------------------------------------------------------

export function useGlobalShortcuts(): {
  shortcuts: Omit<KeyboardShortcut, 'action'>[];
} {
  const shortcuts = useMemo(() => DEFAULT_SHORTCUTS, []);
  return { shortcuts };
}

// ---------------------------------------------------------------------------
// formatShortcut  — utility for rendering key labels
// ---------------------------------------------------------------------------

export function formatModifier(): string {
  return isMac ? '\u2318' : 'Ctrl';
}

export function formatKey(shortcut: Omit<KeyboardShortcut, 'action'>): string[] {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(formatModifier());
  if (shortcut.shift) parts.push(isMac ? '\u21E7' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '\u2325' : 'Alt');

  // Normalise display for special keys
  const keyMap: Record<string, string> = {
    escape: 'Esc',
    arrowup: '\u2191',
    arrowdown: '\u2193',
    arrowleft: '\u2190',
    arrowright: '\u2192',
    enter: '\u21B5',
    backspace: '\u232B',
    delete: '\u2326',
    tab: '\u21E5',
    ' ': 'Space',
  };

  const display = keyMap[shortcut.key.toLowerCase()] ?? shortcut.key.toUpperCase();
  parts.push(display);

  return parts;
}
