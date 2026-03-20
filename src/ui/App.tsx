import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useStore } from './store';
import { useTheme } from './themes';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import HomeView from './views/HomeView';
import SetupWizard from './views/SetupWizard/index';
import DebateView from './views/DebateView/index';
import PersonaEditor from './views/PersonaEditor/index';
import SettingsView from './views/SettingsView';
import TournamentView from './views/TournamentView/index';
import LeaderboardView from './views/LeaderboardView/index';
import StatisticsView from './views/StatisticsView';
import { ToastContainer, useToast } from './components/Toast';
import type { AppView as SidebarAppView } from './components/Sidebar';

// Lazy-load heavy components
const CommandPalette = lazy(() => import('./components/CommandPalette'));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal'));
const WhatsNewModal = lazy(() => import('./components/WhatsNewModal'));
const FeedbackWidget = lazy(() => import('./components/FeedbackWidget'));
const BackToTop = lazy(() => import('./components/BackToTop'));

function sidebarViewToStoreView(sidebarView: SidebarAppView): string {
  if (sidebarView === 'new-debate') return 'setup';
  return sidebarView;
}

function storeViewToSidebarView(storeView: string): SidebarAppView {
  if (storeView === 'setup' || storeView === 'debate') return 'new-debate';
  return storeView as SidebarAppView;
}

// Loading fallback
const ViewLoader: React.FC = () => (
  <div className="flex h-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-forge-500" />
  </div>
);

export default function App() {
  const currentView = useStore((s) => s.currentView);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const currentDebate = useStore((s) => s.currentDebate);
  const debates = useStore((s) => s.debates);
  const loadApiKeys = useStore((s) => s.loadApiKeys);
  const resetSetup = useStore((s) => s.resetSetup);
  const { theme, effective, setTheme } = useTheme();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const mainRef = useRef<HTMLElement>(null);

  // Command palette & shortcuts state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(() => {
    try {
      const seen = localStorage.getItem('debateforge-whatsnew-seen');
      return seen !== '1.0.0';
    } catch { return false; }
  });

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Command palette: Cmd+K
      if (isMod && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
        return;
      }

      // Escape: close modals
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
      }

      // Don't fire shortcuts when typing
      if (isInput) return;

      // ? - keyboard shortcuts
      if (e.key === '?' && !isMod) {
        e.preventDefault();
        setShortcutsModalOpen(true);
        return;
      }

      // Cmd+/ - Toggle sidebar
      if (isMod && e.key === '/') {
        e.preventDefault();
        useStore.getState().toggleSidebar();
        return;
      }

      // Cmd+N - New debate
      if (isMod && e.key === 'n') {
        e.preventDefault();
        resetSetup();
        setCurrentView('setup');
        return;
      }

      // Cmd+D - Toggle dark mode
      if (isMod && e.key === 'd') {
        e.preventDefault();
        handleThemeToggle();
        return;
      }

      // Cmd+E - Export
      if (isMod && e.key === 'e') {
        e.preventDefault();
        handleExportDebates();
        return;
      }

      // Cmd+1-7 - Navigate to views
      const viewMap: Record<string, string> = {
        '1': 'home', '2': 'setup', '3': 'personas', '4': 'tournament',
        '5': 'leaderboard', '6': 'statistics', '7': 'settings',
      };
      if (isMod && viewMap[e.key]) {
        e.preventDefault();
        setCurrentView(viewMap[e.key] as any);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, shortcutsModalOpen, setCurrentView, resetSetup]);

  const handleThemeToggle = useCallback(() => {
    if (effective === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }, [effective, setTheme]);

  const handleSidebarViewChange = (view: SidebarAppView) => {
    const mapped = sidebarViewToStoreView(view);
    setCurrentView(mapped as any);
  };

  const handleSettingsClick = () => {
    setCurrentView('settings');
  };

  const handleSearchClick = () => {
    setCommandPaletteOpen(true);
  };

  const handleShortcutsClick = () => {
    setShortcutsModalOpen(true);
  };

  const handleCommandNavigate = (view: string) => {
    setCommandPaletteOpen(false);
    setCurrentView(view as any);
  };

  const handleExportDebates = useCallback(() => {
    const allDebates = useStore.getState().debates;
    if (allDebates.length === 0) {
      showToast('No debates to export', 'warning');
      return;
    }
    const blob = new Blob([JSON.stringify(allDebates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debateforge-debates-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${allDebates.length} debates`, 'success');
  }, [showToast]);

  const completedCount = debates.filter((d) => d.status === 'completed').length;

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'setup':
        return <SetupWizard />;
      case 'debate':
        return <DebateView />;
      case 'personas':
        return <PersonaEditor />;
      case 'settings':
        return <SettingsView />;
      case 'tournament':
        return <TournamentView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'statistics':
        return <StatisticsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-surface-dark-0" data-theme={effective}>
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent">
        <div
          id="scroll-progress"
          className="h-full bg-gradient-to-r from-forge-500 to-forge-400 transition-all duration-150"
          style={{ width: '0%' }}
        />
      </div>

      <Sidebar
        currentView={storeViewToSidebarView(currentView)}
        onViewChange={handleSidebarViewChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onSearchClick={handleSearchClick}
        debateCount={completedCount}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          currentDebateTopic={currentDebate?.topic}
          currentView={currentView}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onSettingsClick={handleSettingsClick}
          onSearchClick={handleSearchClick}
          onShortcutsClick={handleShortcutsClick}
        />
        <main
          ref={mainRef}
          id="main-content"
          className="flex-1 overflow-auto scroll-smooth"
          onScroll={(e) => {
            const el = e.currentTarget;
            const progress = el.scrollTop / (el.scrollHeight - el.clientHeight) * 100;
            const bar = document.getElementById('scroll-progress');
            if (bar) bar.style.width = `${Math.min(100, Math.max(0, progress || 0))}%`;
          }}
        >
          <div className="h-full animate-fade-in">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <Suspense fallback={null}>
        {commandPaletteOpen && (
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onNavigate={handleCommandNavigate}
          />
        )}
      </Suspense>

      {/* Keyboard Shortcuts Modal */}
      <Suspense fallback={null}>
        {shortcutsModalOpen && (
          <KeyboardShortcutsModal
            isOpen={shortcutsModalOpen}
            onClose={() => setShortcutsModalOpen(false)}
          />
        )}
      </Suspense>

      {/* What's New Modal */}
      <Suspense fallback={null}>
        {whatsNewOpen && (
          <WhatsNewModal
            isOpen={whatsNewOpen}
            onClose={() => {
              setWhatsNewOpen(false);
              try { localStorage.setItem('debateforge-whatsnew-seen', '1.0.0'); } catch {}
            }}
          />
        )}
      </Suspense>

      {/* Feedback Widget */}
      <Suspense fallback={null}>
        <FeedbackWidget />
      </Suspense>

      {/* Back to Top */}
      <Suspense fallback={null}>
        <BackToTop containerRef={mainRef as React.RefObject<HTMLElement>} />
      </Suspense>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Konami code easter egg listener */}
      <KonamiListener />
    </div>
  );
}

// Konami code easter egg
function KonamiListener() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [triggered, setTriggered] = useState(false);
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setSequence((prev) => {
        const next = [...prev, e.key].slice(-10);
        if (next.length === 10 && next.every((k, i) => k === KONAMI[i])) {
          setTriggered(true);
          setTimeout(() => setTriggered(false), 4000);
          return [];
        }
        return next;
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!triggered) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={() => setTriggered(false)}
    >
      <div className="animate-scale-in text-center">
        <div className="text-6xl mb-4">&#9876;&#65039;</div>
        <h2 className="text-3xl font-black text-white mb-2">Secret Found!</h2>
        <p className="text-lg text-gray-300">You've unlocked the Forge Master achievement.</p>
        <p className="mt-4 text-sm text-gray-400">Click anywhere to dismiss</p>
      </div>
    </div>
  );
}
