import React, { useEffect } from 'react';
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
import type { AppView as SidebarAppView } from './components/Sidebar';

function sidebarViewToStoreView(sidebarView: SidebarAppView): string {
  if (sidebarView === 'new-debate') return 'setup';
  return sidebarView;
}

function storeViewToSidebarView(storeView: string): SidebarAppView {
  if (storeView === 'setup' || storeView === 'debate') return 'new-debate';
  return storeView as SidebarAppView;
}

export default function App() {
  const currentView = useStore((s) => s.currentView);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const currentDebate = useStore((s) => s.currentDebate);
  const loadApiKeys = useStore((s) => s.loadApiKeys);
  const { theme, effective, setTheme } = useTheme();

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleThemeToggle = () => {
    if (effective === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const handleSidebarViewChange = (view: SidebarAppView) => {
    const mapped = sidebarViewToStoreView(view);
    setCurrentView(mapped as any);
  };

  const handleSettingsClick = () => {
    setCurrentView('settings');
  };

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
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-surface-dark-0" data-theme={effective}>
      <Sidebar
        currentView={storeViewToSidebarView(currentView)}
        onViewChange={handleSidebarViewChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          currentDebateTopic={currentDebate?.topic}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onSettingsClick={handleSettingsClick}
        />
        <main className="flex-1 overflow-auto">
          <div className="h-full animate-fade-in">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
