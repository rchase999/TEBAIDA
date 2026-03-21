import React, { useState, useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import {
  Key, Eye, EyeOff, CheckCircle, XCircle, Loader2,
  Server, Monitor, Sun, Moon, Palette, Database,
  Download, Trash2, RefreshCw, Info, Zap, Shield,
  Upload, Globe, Lock, Keyboard, Code,
  ChevronRight, ExternalLink, Sliders, HardDrive,
  FileJson, Paintbrush, Volume2, VolumeX,
  ShieldCheck, AlertTriangle, Swords, Check,
  Calendar, Clock, Languages, Type, Minimize2,
  Sparkles, PanelLeft, ScrollText, Brain, Gauge,
  BarChart3, Github, Bug, Lightbulb, Scale,
  Heart, Package, ArrowRight, RotateCcw,
  Users, MessageSquare, Hash, Activity,
  Bell, BellOff, Search,
} from 'lucide-react';
import { useStore } from '../store';
import { useTheme } from '../themes';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import type { ModelProvider, DebateFormat } from '../../types';

/* ============================================================
   Constants
   ============================================================ */

type SettingsTab = 'general' | 'api-keys' | 'appearance' | 'debates' | 'data' | 'about' | 'notifications' | 'privacy' | 'shortcuts';

interface TabDef {
  id: SettingsTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'general', label: 'General', icon: Sliders, description: 'Language, formats & preferences' },
  { id: 'api-keys', label: 'API Keys', icon: Key, description: 'Provider credentials' },
  { id: 'appearance', label: 'Appearance', icon: Paintbrush, description: 'Theme, colors & layout' },
  { id: 'debates', label: 'Debates', icon: Swords, description: 'Debate defaults & features' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts, sounds & preferences' },
  { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Data & privacy preferences' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, description: 'View all shortcuts' },
  { id: 'data', label: 'Data', icon: HardDrive, description: 'Storage, export & import' },
  { id: 'about', label: 'About', icon: Info, description: 'Version & credits' },
];

/* ------- Provider config ------- */

interface ProviderInfo {
  id: ModelProvider;
  label: string;
  shortName: string;
  placeholder: string;
  description: string;
  color: string;
  textColor: string;
}

const PROVIDERS: ProviderInfo[] = [
  { id: 'anthropic', label: 'Anthropic', shortName: 'AN', placeholder: 'sk-ant-...', description: 'Claude 3.5 / 4 models with extended thinking', color: 'bg-amber-600', textColor: 'text-white' },
  { id: 'openai', label: 'OpenAI', shortName: 'OA', placeholder: 'sk-...', description: 'GPT-4o, o1, o3 reasoning models', color: 'bg-emerald-600', textColor: 'text-white' },
  { id: 'google', label: 'Google (Gemini)', shortName: 'GG', placeholder: 'AI...', description: 'Gemini 2.5 Pro / Flash models', color: 'bg-blue-600', textColor: 'text-white' },
  { id: 'mistral', label: 'Mistral', shortName: 'MI', placeholder: 'Bearer ...', description: 'Mistral Large, Codestral models', color: 'bg-orange-600', textColor: 'text-white' },
  { id: 'groq', label: 'Groq', shortName: 'GQ', placeholder: 'gsk_...', description: 'Ultra-fast inference with Groq', color: 'bg-purple-600', textColor: 'text-white' },
];

/* ------- Languages ------- */

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: 'Japanese' },
];

/* ------- Accent colors ------- */

const ACCENT_COLORS = [
  { name: 'Forge', value: '#4c6ef5', tw: 'bg-indigo-500' },
  { name: 'Blue', value: '#3b82f6', tw: 'bg-blue-500' },
  { name: 'Purple', value: '#7c3aed', tw: 'bg-purple-500' },
  { name: 'Rose', value: '#f43f5e', tw: 'bg-rose-500' },
  { name: 'Emerald', value: '#10b981', tw: 'bg-emerald-500' },
  { name: 'Amber', value: '#f59e0b', tw: 'bg-amber-500' },
  { name: 'Cyan', value: '#06b6d4', tw: 'bg-cyan-500' },
  { name: 'Orange', value: '#f97316', tw: 'bg-orange-500' },
];

/* ------- Debate format options ------- */

const DEBATE_FORMATS: { value: DebateFormat; label: string }[] = [
  { value: 'oxford-union', label: 'Oxford Union' },
  { value: 'lincoln-douglas', label: 'Lincoln-Douglas' },
  { value: 'parliamentary', label: 'Parliamentary' },
];

/* ------- Keyboard shortcuts ------- */

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], action: 'Open command palette' },
  { keys: ['Ctrl', 'N'], action: 'New debate' },
  { keys: ['Ctrl', 'S'], action: 'Save current debate' },
  { keys: ['Ctrl', ','], action: 'Open settings' },
  { keys: ['Ctrl', '/'], action: 'Toggle sidebar' },
  { keys: ['Ctrl', 'Enter'], action: 'Send / continue debate' },
  { keys: ['Ctrl', 'Shift', 'T'], action: 'Toggle theme' },
  { keys: ['Ctrl', 'E'], action: 'Export debate' },
  { keys: ['Escape'], action: 'Close modal / cancel' },
  { keys: ['Ctrl', '?'], action: 'Show all shortcuts' },
];

/* ------- Full keyboard shortcuts for dedicated tab ------- */

interface ShortcutEntry {
  keys: string[];
  action: string;
  category: 'Navigation' | 'Debate' | 'General' | 'Views';
}

const FULL_SHORTCUTS: ShortcutEntry[] = [
  // Navigation
  { keys: ['Ctrl', 'K'], action: 'Open command palette', category: 'Navigation' },
  { keys: ['Ctrl', '/'], action: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Ctrl', ','], action: 'Open settings', category: 'Navigation' },
  { keys: ['Ctrl', 'F'], action: 'Focus search bar', category: 'Navigation' },
  { keys: ['Ctrl', 'P'], action: 'Quick switch panel', category: 'Navigation' },
  { keys: ['Tab'], action: 'Next focusable element', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], action: 'Previous focusable element', category: 'Navigation' },
  // Debate
  { keys: ['Ctrl', 'N'], action: 'New debate', category: 'Debate' },
  { keys: ['Ctrl', 'S'], action: 'Save current debate', category: 'Debate' },
  { keys: ['Ctrl', 'Enter'], action: 'Send / continue debate', category: 'Debate' },
  { keys: ['Ctrl', 'E'], action: 'Export debates', category: 'Debate' },
  { keys: ['Ctrl', 'Shift', 'E'], action: 'Export as PDF', category: 'Debate' },
  { keys: ['Ctrl', 'Shift', 'N'], action: 'New debate from template', category: 'Debate' },
  { keys: ['Ctrl', 'Shift', 'R'], action: 'Restart current debate', category: 'Debate' },
  { keys: ['Ctrl', 'J'], action: 'Toggle judge panel', category: 'Debate' },
  // General
  { keys: ['Ctrl', 'D'], action: 'Toggle dark mode', category: 'General' },
  { keys: ['Ctrl', 'Shift', 'T'], action: 'Toggle theme', category: 'General' },
  { keys: ['Escape'], action: 'Close modal / cancel', category: 'General' },
  { keys: ['?'], action: 'Keyboard shortcuts', category: 'General' },
  { keys: ['Ctrl', 'Z'], action: 'Undo last action', category: 'General' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo last action', category: 'General' },
  { keys: ['Ctrl', '.'], action: 'Toggle compact mode', category: 'General' },
  { keys: ['F11'], action: 'Toggle fullscreen', category: 'General' },
  // Views
  { keys: ['Ctrl', '1'], action: 'Go to Dashboard', category: 'Views' },
  { keys: ['Ctrl', '2'], action: 'Go to Debates', category: 'Views' },
  { keys: ['Ctrl', '3'], action: 'Go to Analytics', category: 'Views' },
  { keys: ['Ctrl', '4'], action: 'Go to Personas', category: 'Views' },
  { keys: ['Ctrl', '5'], action: 'Go to Tournament', category: 'Views' },
  { keys: ['Ctrl', '6'], action: 'Go to Topic Generator', category: 'Views' },
  { keys: ['Ctrl', '7'], action: 'Go to History', category: 'Views' },
  { keys: ['Ctrl', '8'], action: 'Go to Settings', category: 'Views' },
  { keys: ['Ctrl', '9'], action: 'Go to About', category: 'Views' },
];

const SHORTCUT_CATEGORIES: ShortcutEntry['category'][] = ['Navigation', 'Debate', 'General', 'Views'];

/* ============================================================
   Toast notification (inline, ephemeral)
   ============================================================ */

const Toast: React.FC<{ message: string; type?: 'success' | 'error' | 'info'; onDismiss: () => void }> = ({ message, type = 'success', onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-fade-in',
      type === 'success' && 'bg-emerald-600 text-white',
      type === 'error' && 'bg-red-600 text-white',
      type === 'info' && 'bg-blue-600 text-white',
    )}>
      {type === 'success' && <CheckCircle className="h-4 w-4" />}
      {type === 'error' && <XCircle className="h-4 w-4" />}
      {type === 'info' && <Info className="h-4 w-4" />}
      {message}
    </div>
  );
};

/* ============================================================
   Toggle Switch (reusable)
   ============================================================ */

const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.FC<{ className?: string }>;
  badge?: string;
}> = ({ label, description, checked, onChange, icon: Icon, badge }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {badge && <Badge variant="default" size="sm">{badge}</Badge>}
        </div>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        checked ? 'bg-forge-600' : 'bg-gray-300 dark:bg-surface-dark-4',
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  </div>
);

/* ============================================================
   Section header
   ============================================================ */

const SectionHeader: React.FC<{ icon?: React.FC<{ className?: string }>; title: string; description?: string }> = ({ icon: Icon, title, description }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-5 w-5 text-forge-600 dark:text-forge-400" />}
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    </div>
    {description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">{description}</p>}
  </div>
);

/* ============================================================
   Styled Select dropdown
   ============================================================ */

const StyledSelect: React.FC<{
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.FC<{ className?: string }>;
}> = ({ label, description, value, onChange, options, icon: Icon }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100 min-w-[140px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

/* ============================================================
   Radio Group (horizontal)
   ============================================================ */

const RadioGroup: React.FC<{
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.FC<{ className?: string }>;
}> = ({ label, description, value, onChange, options, icon: Icon }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="flex rounded-lg border border-gray-300 dark:border-surface-dark-4 overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            value === o.value
              ? 'bg-forge-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-surface-dark-1 dark:text-gray-400 dark:hover:bg-surface-dark-2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

/* ============================================================
   API Key Provider Card
   ============================================================ */

const ApiKeyCard: React.FC<{
  provider: ProviderInfo;
  value: string;
  onChange: (key: string) => void;
  onTest: () => void;
  testStatus: 'idle' | 'testing' | 'success' | 'error';
}> = ({ provider, value, onChange, onTest, testStatus }) => {
  const [visible, setVisible] = useState(false);

  const statusIcon = testStatus === 'success'
    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
    : testStatus === 'error'
      ? <XCircle className="h-3.5 w-3.5 text-red-500" />
      : testStatus === 'testing'
        ? <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
        : null;

  const statusLabel = testStatus === 'success' ? 'Valid' : testStatus === 'error' ? 'Invalid' : testStatus === 'testing' ? 'Testing...' : value && value.length > 5 ? 'Untested' : '';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 dark:border-surface-dark-3 dark:bg-surface-dark-1 hover:border-gray-300 dark:hover:border-surface-dark-4 hover:shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        {/* Provider logo circle */}
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold shrink-0', provider.color, provider.textColor)}>
          {provider.shortName}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{provider.label}</p>
            {(statusLabel || value) && (
              <div className="flex items-center gap-1.5">
                {statusIcon}
                <span className={clsx(
                  'text-xs font-medium',
                  testStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                  testStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-400 dark:text-gray-500',
                )}>
                  {statusLabel}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{provider.description}</p>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={provider.placeholder}
            icon={<Key className="h-4 w-4" />}
          />
        </div>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="mb-0.5 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300"
          aria-label={visible ? 'Hide key' : 'Show key'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={!value || value.length < 5 || testStatus === 'testing'}
          loading={testStatus === 'testing'}
          className="mb-0.5 shrink-0"
        >
          {testStatus === 'success' ? (
            <><CheckCircle className="h-4 w-4 text-emerald-500" /> OK</>
          ) : testStatus === 'error' ? (
            <><XCircle className="h-4 w-4 text-red-500" /> Retry</>
          ) : (
            'Test'
          )}
        </Button>
      </div>
    </div>
  );
};

/* ============================================================
   Theme Preview Card
   ============================================================ */

const ThemePreviewCard: React.FC<{
  mode: 'light' | 'dark' | 'system';
  currentTheme: string;
  onSelect: (mode: 'light' | 'dark' | 'system') => void;
}> = ({ mode, currentTheme, onSelect }) => {
  const isActive = currentTheme === mode;
  const config = {
    light: { icon: Sun, label: 'Light', desc: 'Clean & bright', previewBg: 'bg-white', previewBorder: 'border-gray-200', previewBar: 'bg-gray-100', previewText: 'bg-gray-300', previewAccent: 'bg-indigo-500' },
    dark: { icon: Moon, label: 'Dark', desc: 'Easy on the eyes', previewBg: 'bg-gray-900', previewBorder: 'border-gray-700', previewBar: 'bg-gray-800', previewText: 'bg-gray-600', previewAccent: 'bg-indigo-400' },
    system: { icon: Monitor, label: 'System', desc: 'Matches your OS', previewBg: 'bg-gradient-to-r from-white to-gray-900', previewBorder: 'border-gray-400', previewBar: 'bg-gradient-to-r from-gray-100 to-gray-800', previewText: 'bg-gray-400', previewAccent: 'bg-indigo-500' },
  }[mode];

  const Icon = config.icon;

  return (
    <button
      onClick={() => onSelect(mode)}
      className={clsx(
        'group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200',
        isActive
          ? 'border-forge-500 bg-forge-50 shadow-md dark:bg-forge-900/10'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4',
      )}
    >
      {/* Mini mockup preview */}
      <div className={clsx('w-full h-20 rounded-lg border overflow-hidden', config.previewBorder)}>
        <div className={clsx('h-4', config.previewBar)} />
        <div className={clsx('flex h-16', config.previewBg)}>
          <div className={clsx('w-1/4 border-r', config.previewBorder)}>
            <div className={clsx('mx-1 mt-1.5 h-1 rounded', config.previewText)} />
            <div className={clsx('mx-1 mt-1 h-1 rounded', config.previewText)} />
            <div className={clsx('mx-1 mt-1 h-1 rounded', config.previewAccent)} />
            <div className={clsx('mx-1 mt-1 h-1 rounded', config.previewText)} />
          </div>
          <div className="flex-1 p-1.5">
            <div className={clsx('h-1.5 w-3/4 rounded', config.previewText)} />
            <div className={clsx('mt-1 h-1 w-full rounded', config.previewText, 'opacity-50')} />
            <div className={clsx('mt-0.5 h-1 w-2/3 rounded', config.previewText, 'opacity-50')} />
            <div className={clsx('mt-2 h-2 w-1/3 rounded', config.previewAccent)} />
          </div>
        </div>
      </div>

      {/* Icon + Label */}
      <div className="flex items-center gap-2">
        <div className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-lg',
          isActive ? 'bg-forge-100 dark:bg-forge-900/30' : 'bg-gray-100 dark:bg-surface-dark-2',
        )}>
          <Icon className={clsx('h-4 w-4', isActive ? 'text-forge-600 dark:text-forge-400' : 'text-gray-500 dark:text-gray-400')} />
        </div>
        <div className="text-left">
          <p className={clsx('text-sm font-semibold', isActive ? 'text-forge-600 dark:text-forge-400' : 'text-gray-700 dark:text-gray-300')}>{config.label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{config.desc}</p>
        </div>
      </div>

      {/* Check indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-forge-600 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
};

/* ============================================================
   Danger Action Row
   ============================================================ */

const DangerRow: React.FC<{
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  icon?: React.FC<{ className?: string }>;
}> = ({ title, description, buttonLabel, onClick, icon: Icon }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-red-500" />}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
    <Button variant="danger" size="sm" onClick={onClick} icon={Icon && <Trash2 className="h-3.5 w-3.5" />}>
      {buttonLabel}
    </Button>
  </div>
);

/* ============================================================
   localStorage helpers for local-only prefs
   ============================================================ */

function getLocalPref(key: string, fallback: string): string {
  try { return localStorage.getItem(`debateforge-${key}`) ?? fallback; } catch { return fallback; }
}
function setLocalPref(key: string, value: string) {
  try { localStorage.setItem(`debateforge-${key}`, value); } catch { /* noop */ }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const SettingsView: React.FC = () => {
  /* ------ Store ------ */
  const apiKeys = useStore((s) => s.apiKeys);
  const setApiKey = useStore((s) => s.setApiKey);
  const saveApiKeys = useStore((s) => s.saveApiKeys);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const debates = useStore((s) => s.debates);
  const personas = useStore((s) => s.personas);
  const { theme, setTheme } = useTheme();

  /* ------ Local state ------ */
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [testStatuses, setTestStatuses] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Modals
  const [showClearDebatesModal, setShowClearDebatesModal] = useState(false);
  const [showClearPersonasModal, setShowClearPersonasModal] = useState(false);
  const [showResetSettingsModal, setShowResetSettingsModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Import
  const [importPreview, setImportPreview] = useState<{ debates: number; personas: number; size: string } | null>(null);
  const [importData, setImportData] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // Local-only preferences (stored in localStorage)
  const [dateFormat, setDateFormatState] = useState(() => getLocalPref('date-format', 'MM/DD/YYYY'));
  const [timeFormat, setTimeFormatState] = useState(() => getLocalPref('time-format', '12h'));
  const [firstDayOfWeek, setFirstDayOfWeekState] = useState(() => getLocalPref('first-day', 'sunday'));
  const [accentColor, setAccentColorState] = useState(() => getLocalPref('accent-color', '#4c6ef5'));
  const [fontSize, setFontSizeState] = useState(() => getLocalPref('font-size', 'default'));
  const [compactMode, setCompactModeState] = useState(() => getLocalPref('compact-mode', 'false') === 'true');
  const [reducedMotion, setReducedMotionState] = useState(() => getLocalPref('reduced-motion', 'false') === 'true');
  const [sidebarPosition, setSidebarPositionState] = useState(() => getLocalPref('sidebar-position', 'left'));
  const [showScrollProgress, setShowScrollProgressState] = useState(() => getLocalPref('scroll-progress', 'true') === 'true');

  // Debate preferences (localStorage)
  const [defaultFormat, setDefaultFormatState] = useState(() => getLocalPref('default-format', 'oxford-union'));
  const [defaultTurns, setDefaultTurnsState] = useState(() => parseInt(getLocalPref('default-turns', '6'), 10));
  const [extendedThinking, setExtendedThinkingState] = useState(() => getLocalPref('extended-thinking', 'false') === 'true');
  const [evidenceVerification, setEvidenceVerificationState] = useState(() => getLocalPref('evidence-verification', 'true') === 'true');
  const [momentumTracking, setMomentumTrackingState] = useState(() => getLocalPref('momentum-tracking', 'true') === 'true');
  const [defaultPropositionModel, setDefaultPropositionModelState] = useState(() => getLocalPref('default-prop-model', 'anthropic'));
  const [defaultOppositionModel, setDefaultOppositionModelState] = useState(() => getLocalPref('default-opp-model', 'openai'));

  // Notification preferences (localStorage)
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => getLocalPref('notifications-enabled', 'true') === 'true');
  const [soundEnabled, setSoundEnabledState] = useState(() => getLocalPref('sound-enabled', 'true') === 'true');
  const [soundVolume, setSoundVolumeState] = useState(() => getLocalPref('sound-volume', 'medium'));
  const [notifyDebateCompleted, setNotifyDebateCompletedState] = useState(() => getLocalPref('notify-debate-completed', 'true') === 'true');
  const [notifyFallacyDetected, setNotifyFallacyDetectedState] = useState(() => getLocalPref('notify-fallacy-detected', 'true') === 'true');
  const [notifyTurnCompleted, setNotifyTurnCompletedState] = useState(() => getLocalPref('notify-turn-completed', 'false') === 'true');
  const [notifyTournamentUpdate, setNotifyTournamentUpdateState] = useState(() => getLocalPref('notify-tournament-update', 'true') === 'true');
  const [notifyAchievement, setNotifyAchievementState] = useState(() => getLocalPref('notify-achievement', 'true') === 'true');
  const [quietHoursEnabled, setQuietHoursEnabledState] = useState(() => getLocalPref('quiet-hours-enabled', 'false') === 'true');
  const [quietHoursStart, setQuietHoursStartState] = useState(() => getLocalPref('quiet-hours-start', '22:00'));
  const [quietHoursEnd, setQuietHoursEndState] = useState(() => getLocalPref('quiet-hours-end', '08:00'));

  // Privacy preferences (localStorage)
  const [analyticsEnabled, setAnalyticsEnabledState] = useState(() => getLocalPref('analytics-enabled', 'false') === 'true');
  const [crashReportingEnabled, setCrashReportingEnabledState] = useState(() => getLocalPref('crash-reporting', 'false') === 'true');
  const [dataRetention, setDataRetentionState] = useState(() => getLocalPref('data-retention', 'forever'));

  // Keyboard shortcuts search
  const [shortcutSearch, setShortcutSearch] = useState('');

  // Detect OS reduced motion
  const osReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  // Setters that persist to localStorage
  const setDateFormat = (v: string) => { setDateFormatState(v); setLocalPref('date-format', v); };
  const setTimeFormat = (v: string) => { setTimeFormatState(v); setLocalPref('time-format', v); };
  const setFirstDayOfWeek = (v: string) => { setFirstDayOfWeekState(v); setLocalPref('first-day', v); };
  const setAccentColor = (v: string) => { setAccentColorState(v); setLocalPref('accent-color', v); };
  const setFontSize = (v: string) => { setFontSizeState(v); setLocalPref('font-size', v); };
  const setCompactMode = (v: boolean) => { setCompactModeState(v); setLocalPref('compact-mode', String(v)); };
  const setReducedMotion = (v: boolean) => { setReducedMotionState(v); setLocalPref('reduced-motion', String(v)); };
  const setSidebarPosition = (v: string) => { setSidebarPositionState(v); setLocalPref('sidebar-position', v); };
  const setShowScrollProgress = (v: boolean) => { setShowScrollProgressState(v); setLocalPref('scroll-progress', String(v)); };
  const setDefaultFormat = (v: string) => { setDefaultFormatState(v); setLocalPref('default-format', v); };
  const setDefaultTurns = (v: number) => { setDefaultTurnsState(v); setLocalPref('default-turns', String(v)); };
  const setExtendedThinking = (v: boolean) => { setExtendedThinkingState(v); setLocalPref('extended-thinking', String(v)); };
  const setEvidenceVerification = (v: boolean) => { setEvidenceVerificationState(v); setLocalPref('evidence-verification', String(v)); };
  const setMomentumTracking = (v: boolean) => { setMomentumTrackingState(v); setLocalPref('momentum-tracking', String(v)); };
  const setDefaultPropositionModel = (v: string) => { setDefaultPropositionModelState(v); setLocalPref('default-prop-model', v); };
  const setDefaultOppositionModel = (v: string) => { setDefaultOppositionModelState(v); setLocalPref('default-opp-model', v); };

  // Notification setters
  const setNotificationsEnabled = (v: boolean) => { setNotificationsEnabledState(v); setLocalPref('notifications-enabled', String(v)); };
  const setSoundEnabled = (v: boolean) => { setSoundEnabledState(v); setLocalPref('sound-enabled', String(v)); };
  const setSoundVolume = (v: string) => { setSoundVolumeState(v); setLocalPref('sound-volume', v); };
  const setNotifyDebateCompleted = (v: boolean) => { setNotifyDebateCompletedState(v); setLocalPref('notify-debate-completed', String(v)); };
  const setNotifyFallacyDetected = (v: boolean) => { setNotifyFallacyDetectedState(v); setLocalPref('notify-fallacy-detected', String(v)); };
  const setNotifyTurnCompleted = (v: boolean) => { setNotifyTurnCompletedState(v); setLocalPref('notify-turn-completed', String(v)); };
  const setNotifyTournamentUpdate = (v: boolean) => { setNotifyTournamentUpdateState(v); setLocalPref('notify-tournament-update', String(v)); };
  const setNotifyAchievement = (v: boolean) => { setNotifyAchievementState(v); setLocalPref('notify-achievement', String(v)); };
  const setQuietHoursEnabled = (v: boolean) => { setQuietHoursEnabledState(v); setLocalPref('quiet-hours-enabled', String(v)); };
  const setQuietHoursStart = (v: string) => { setQuietHoursStartState(v); setLocalPref('quiet-hours-start', v); };
  const setQuietHoursEnd = (v: string) => { setQuietHoursEndState(v); setLocalPref('quiet-hours-end', v); };

  // Privacy setters
  const setAnalyticsEnabled = (v: boolean) => { setAnalyticsEnabledState(v); setLocalPref('analytics-enabled', String(v)); };
  const setCrashReportingEnabled = (v: boolean) => { setCrashReportingEnabledState(v); setLocalPref('crash-reporting', String(v)); };
  const setDataRetention = (v: string) => { setDataRetentionState(v); setLocalPref('data-retention', v); };

  /* ------ API key testing ------ */
  const handleTestConnection = useCallback(async (providerId: ModelProvider) => {
    setTestStatuses((s) => ({ ...s, [providerId]: 'testing' }));
    const key = (apiKeys as any)[providerId] ?? '';
    if (!key || key.length < 5) {
      setTestStatuses((s) => ({ ...s, [providerId]: 'error' }));
      setTimeout(() => setTestStatuses((s) => ({ ...s, [providerId]: 'idle' })), 3000);
      return;
    }
    try {
      let ok = false;
      switch (providerId) {
        case 'anthropic': {
          const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
            signal: AbortSignal.timeout(10000),
          });
          ok = resp.status === 200 || resp.status === 400;
          break;
        }
        case 'openai': {
          const resp = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` },
            signal: AbortSignal.timeout(10000),
          });
          ok = resp.ok;
          break;
        }
        case 'google': {
          const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`, {
            signal: AbortSignal.timeout(10000),
          });
          ok = resp.ok;
          break;
        }
        case 'mistral': {
          const resp = await fetch('https://api.mistral.ai/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` },
            signal: AbortSignal.timeout(10000),
          });
          ok = resp.ok;
          break;
        }
        case 'groq': {
          const resp = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` },
            signal: AbortSignal.timeout(10000),
          });
          ok = resp.ok;
          break;
        }
        default:
          ok = false;
      }
      setTestStatuses((s) => ({ ...s, [providerId]: ok ? 'success' : 'error' }));
    } catch {
      setTestStatuses((s) => ({ ...s, [providerId]: 'error' }));
    }
    setTimeout(() => setTestStatuses((s) => ({ ...s, [providerId]: 'idle' })), 4000);
  }, [apiKeys]);

  const handleSaveKeys = async () => {
    await saveApiKeys();
    showToast('API keys saved securely');
  };

  const handleTestLocalEndpoint = useCallback(async (endpoint: string, type: 'ollama' | 'lmstudio') => {
    setTestStatuses((s) => ({ ...s, [type]: 'testing' }));
    try {
      const url = type === 'ollama' ? `${endpoint}/api/tags` : `${endpoint}/models`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        setTestStatuses((s) => ({ ...s, [type]: 'success' }));
        showToast(`${type === 'ollama' ? 'Ollama' : 'LM Studio'} connected`);
      } else {
        setTestStatuses((s) => ({ ...s, [type]: 'error' }));
      }
    } catch {
      setTestStatuses((s) => ({ ...s, [type]: 'error' }));
    }
    setTimeout(() => setTestStatuses((s) => ({ ...s, [type]: 'idle' })), 3000);
  }, [showToast]);

  const handleRefreshModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const resp = await fetch(`${settings.localModelEndpoint}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json();
        const models = (data.models ?? []).map((m: any) => m.name ?? m.model ?? 'unknown');
        setLocalModels(models);
        showToast(`Found ${models.length} local model(s)`);
      }
    } catch {
      showToast('Could not reach Ollama', 'error');
    }
    setLoadingModels(false);
  }, [settings.localModelEndpoint, showToast]);

  /* ------ Export / Import ------ */
  const estimatedDataSize = useMemo(() => {
    try {
      const debatesJson = JSON.stringify(debates);
      const personasJson = JSON.stringify(personas);
      const totalBytes = new Blob([debatesJson, personasJson]).size;
      if (totalBytes < 1024) return `${totalBytes} B`;
      if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
      return `${(totalBytes / 1024 / 1024).toFixed(1)} MB`;
    } catch { return 'Unknown'; }
  }, [debates, personas]);

  const handleExportAll = () => {
    const exportPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      debates,
      personas,
      settings: {
        dateFormat, timeFormat, firstDayOfWeek, accentColor, fontSize,
        compactMode, reducedMotion, sidebarPosition, showScrollProgress,
        defaultFormat, defaultTurns, extendedThinking, evidenceVerification,
        momentumTracking, defaultPropositionModel, defaultOppositionModel,
      },
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debateforge-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Support both raw array and wrapped export
        let debateCount = 0;
        let personaCount = 0;
        if (Array.isArray(parsed)) {
          debateCount = parsed.length;
          setImportData({ debates: parsed, personas: [] });
        } else if (parsed && typeof parsed === 'object') {
          debateCount = Array.isArray(parsed.debates) ? parsed.debates.length : 0;
          personaCount = Array.isArray(parsed.personas) ? parsed.personas.length : 0;
          setImportData(parsed);
        }

        const sizeStr = file.size < 1024 ? `${file.size} B` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
        setImportPreview({ debates: debateCount, personas: personaCount, size: sizeStr });
      } catch {
        showToast('Failed to parse the file', 'error');
      }
    };
    input.click();
  };

  const handleConfirmImport = () => {
    if (!importData) return;
    try {
      if (importData.debates && Array.isArray(importData.debates)) {
        const existing = JSON.parse(localStorage.getItem('debateforge-debates') || '[]');
        const merged = [...importData.debates, ...existing];
        localStorage.setItem('debateforge-debates', JSON.stringify(merged));
      }
      if (importData.personas && Array.isArray(importData.personas)) {
        const existing = JSON.parse(localStorage.getItem('debateforge-personas') || '[]');
        const merged = [...importData.personas, ...existing];
        localStorage.setItem('debateforge-personas', JSON.stringify(merged));
      }
      showToast('Data imported successfully. Refresh to see changes.', 'success');
      setImportPreview(null);
      setImportData(null);
    } catch {
      showToast('Import failed', 'error');
    }
  };

  /* ------ Danger zone actions ------ */
  const handleClearDebates = () => {
    if (deleteConfirmText !== 'DELETE') return;
    try { localStorage.removeItem('debateforge-debates'); } catch { /* noop */ }
    setShowClearDebatesModal(false);
    setDeleteConfirmText('');
    showToast('All debates cleared');
    setTimeout(() => window.location.reload(), 800);
  };

  const handleClearPersonas = () => {
    try { localStorage.removeItem('debateforge-personas'); } catch { /* noop */ }
    setShowClearPersonasModal(false);
    showToast('All custom personas cleared');
    setTimeout(() => window.location.reload(), 800);
  };

  const handleResetSettings = () => {
    const keys = [
      'date-format', 'time-format', 'first-day', 'accent-color', 'font-size',
      'compact-mode', 'reduced-motion', 'sidebar-position', 'scroll-progress',
      'default-format', 'default-turns', 'extended-thinking', 'evidence-verification',
      'momentum-tracking', 'default-prop-model', 'default-opp-model', 'theme',
    ];
    keys.forEach((k) => { try { localStorage.removeItem(`debateforge-${k}`); } catch { /* noop */ } });
    setShowResetSettingsModal(false);
    showToast('Settings reset to defaults');
    setTimeout(() => window.location.reload(), 800);
  };

  /* ------ Privacy actions ------ */
  const handleClearDebateHistory = () => {
    try { localStorage.removeItem('debateforge-debates'); } catch { /* noop */ }
    showToast('Debate history cleared');
    setTimeout(() => window.location.reload(), 800);
  };

  const handleClearSearchHistory = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('debateforge-search')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      showToast(`Cleared ${keysToRemove.length} search history item(s)`);
    } catch {
      showToast('Failed to clear search history', 'error');
    }
  };

  const handleExportPersonalData = () => {
    try {
      const allData: Record<string, any> = {};
      // Collect all localStorage data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          try {
            allData[key] = JSON.parse(val!);
          } catch {
            allData[key] = val;
          }
        }
      }
      // Add store data
      allData['__store_debates'] = debates;
      allData['__store_personas'] = personas;
      allData['__store_settings'] = settings;

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debateforge-personal-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Personal data exported successfully');
    } catch {
      showToast('Failed to export personal data', 'error');
    }
  };

  /* ------ Desktop notification permission ------ */
  const handleRequestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          showToast('Desktop notifications enabled');
        } else if (result === 'denied') {
          showToast('Desktop notifications denied by browser', 'error');
        } else {
          showToast('Desktop notification permission dismissed', 'info');
        }
      } else {
        showToast('Desktop notifications not supported in this browser', 'error');
      }
    } catch {
      showToast('Failed to request notification permission', 'error');
    }
  };

  /* ------ Computed ------ */
  const configuredKeyCount = PROVIDERS.filter((p) => {
    const k = (apiKeys as any)[p.id];
    return k && k.length > 5;
  }).length;

  const totalTurns = useMemo(() => debates.reduce((sum, d) => sum + (d.turns?.length ?? 0), 0), [debates]);

  const MODEL_OPTIONS = [
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'openai', label: 'OpenAI (GPT-4)' },
    { value: 'google', label: 'Google (Gemini)' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'groq', label: 'Groq' },
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'lmstudio', label: 'LM Studio (Local)' },
  ];

  // Filtered shortcuts for the shortcuts tab
  const filteredShortcuts = useMemo(() => {
    if (!shortcutSearch.trim()) return FULL_SHORTCUTS;
    const q = shortcutSearch.toLowerCase();
    return FULL_SHORTCUTS.filter(
      (s) =>
        s.action.toLowerCase().includes(q) ||
        s.keys.join(' ').toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [shortcutSearch]);

  const desktopNotificationStatus = useMemo(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }, []);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure API keys, appearance, debates, and app preferences.</p>
      </div>

      <div className="flex gap-6">
        {/* ---- Tab sidebar (desktop) ---- */}
        <nav className="hidden sm:block w-52 shrink-0">
          <div className="sticky top-6 space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all duration-150 group',
                    isActive
                      ? 'bg-forge-600/10 text-forge-600 dark:bg-forge-500/15 dark:text-forge-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200',
                  )}
                >
                  <Icon className={clsx('h-4 w-4 shrink-0', isActive ? 'text-forge-600 dark:text-forge-400' : '')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{tab.label}</p>
                    <p className={clsx(
                      'text-xs leading-tight mt-0.5 truncate',
                      isActive ? 'text-forge-500/70 dark:text-forge-400/60' : 'text-gray-400 dark:text-gray-500',
                    )}>{tab.description}</p>
                  </div>
                  {tab.id === 'api-keys' && configuredKeyCount > 0 && (
                    <Badge variant="success" size="sm">{configuredKeyCount}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ---- Mobile tab bar ---- */}
        <div className="sm:hidden mb-4 flex overflow-x-auto gap-1 border-b border-gray-200 dark:border-surface-dark-3 -mx-6 px-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'shrink-0 flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-forge-500 text-forge-600 dark:text-forge-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ============================================================
           TAB CONTENT
           ============================================================ */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ========== GENERAL ========== */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              {/* Language & Region */}
              <Card>
                <SectionHeader icon={Globe} title="Language & Region" description="Regional preferences for the app interface." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <StyledSelect
                    label="Language"
                    description="AI models will respond in this language."
                    value={(settings as any).language ?? 'en'}
                    onChange={(v) => updateSettings({ language: v } as any)}
                    options={LANGUAGES}
                    icon={Languages}
                  />
                  <StyledSelect
                    label="Date Format"
                    description="How dates are displayed throughout the app."
                    value={dateFormat}
                    onChange={setDateFormat}
                    options={[
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                    ]}
                    icon={Calendar}
                  />
                  <RadioGroup
                    label="Time Format"
                    description="12-hour or 24-hour clock."
                    value={timeFormat}
                    onChange={setTimeFormat}
                    options={[
                      { value: '12h', label: '12h' },
                      { value: '24h', label: '24h' },
                    ]}
                    icon={Clock}
                  />
                  <RadioGroup
                    label="First Day of Week"
                    value={firstDayOfWeek}
                    onChange={setFirstDayOfWeek}
                    options={[
                      { value: 'sunday', label: 'Sunday' },
                      { value: 'monday', label: 'Monday' },
                    ]}
                    icon={Calendar}
                  />
                </div>
              </Card>

              {/* Default Debate Format */}
              <Card>
                <SectionHeader icon={Swords} title="Default Debate Format" />
                <StyledSelect
                  label="Format"
                  description="New debates will use this format by default."
                  value={defaultFormat}
                  onChange={setDefaultFormat}
                  options={DEBATE_FORMATS}
                  icon={Swords}
                />
              </Card>
            </div>
          )}

          {/* ========== API KEYS ========== */}
          {activeTab === 'api-keys' && (
            <div className="space-y-4 animate-fade-in">
              {/* Trust banner */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">All keys are stored locally and never transmitted</p>
                    <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Keys are encrypted and stored on your device. They are only sent to the respective API provider when making model calls.</p>
                  </div>
                </div>
              </div>

              {/* Cloud Providers */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">Cloud Providers</h3>
                {PROVIDERS.map((p) => (
                  <ApiKeyCard
                    key={p.id}
                    provider={p}
                    value={(apiKeys as any)[p.id] ?? ''}
                    onChange={(key) => setApiKey(p.id, key)}
                    onTest={() => handleTestConnection(p.id)}
                    testStatus={testStatuses[p.id] ?? 'idle'}
                  />
                ))}
              </div>

              {/* Local Models */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">Local Models</h3>
                <Card>
                  <div className="space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-[11px] font-bold text-white">OL</div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Ollama</span>
                        </div>
                        <Input
                          value={settings.localModelEndpoint}
                          onChange={(e) => updateSettings({ localModelEndpoint: e.target.value })}
                          placeholder="http://localhost:11434"
                          icon={<Server className="h-4 w-4" />}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestLocalEndpoint(settings.localModelEndpoint, 'ollama')}
                        loading={testStatuses['ollama'] === 'testing'}
                        className="mb-0.5"
                      >
                        {testStatuses['ollama'] === 'success' ? <><CheckCircle className="h-4 w-4 text-emerald-500" /> OK</> : 'Test'}
                      </Button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-surface-dark-3 pt-4">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-[11px] font-bold text-white">LM</div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">LM Studio</span>
                          </div>
                          <Input
                            value={settings.lmStudioEndpoint}
                            onChange={(e) => updateSettings({ lmStudioEndpoint: e.target.value })}
                            placeholder="http://localhost:1234/v1"
                            icon={<Server className="h-4 w-4" />}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestLocalEndpoint(settings.lmStudioEndpoint, 'lmstudio')}
                          loading={testStatuses['lmstudio'] === 'testing'}
                          className="mb-0.5"
                        >
                          {testStatuses['lmstudio'] === 'success' ? <><CheckCircle className="h-4 w-4 text-emerald-500" /> OK</> : 'Test'}
                        </Button>
                      </div>
                    </div>

                    {/* Available models */}
                    <div className="border-t border-gray-100 dark:border-surface-dark-3 pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Models</p>
                          {localModels.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {localModels.map((m) => <Badge key={m} variant="default">{m}</Badge>)}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Click Refresh to discover local models.</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleRefreshModels} loading={loadingModels} icon={<RefreshCw className="h-4 w-4" />}>
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSaveKeys} icon={<CheckCircle className="h-4 w-4" />}>
                  Save All Keys
                </Button>
              </div>
            </div>
          )}

          {/* ========== APPEARANCE ========== */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              {/* Theme */}
              <Card>
                <SectionHeader icon={Sun} title="Theme" description="Choose how DebateForge looks." />
                <div className="grid grid-cols-3 gap-3">
                  <ThemePreviewCard mode="light" currentTheme={theme} onSelect={setTheme} />
                  <ThemePreviewCard mode="dark" currentTheme={theme} onSelect={setTheme} />
                  <ThemePreviewCard mode="system" currentTheme={theme} onSelect={setTheme} />
                </div>
              </Card>

              {/* Accent Color */}
              <Card>
                <SectionHeader icon={Palette} title="Accent Color" description="Highlight color used throughout the interface." />
                <div className="flex flex-wrap gap-4">
                  {ACCENT_COLORS.map((color) => {
                    const isSelected = accentColor === color.value;
                    return (
                      <button
                        key={color.value}
                        className="group flex flex-col items-center gap-1.5"
                        title={color.name}
                        onClick={() => setAccentColor(color.value)}
                      >
                        <div
                          className={clsx(
                            'h-9 w-9 rounded-full border-2 transition-all duration-200 hover:scale-110',
                            isSelected
                              ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 dark:ring-offset-surface-dark-1'
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
                          )}
                          style={{
                            backgroundColor: color.value,
                            ...(isSelected ? { boxShadow: `0 0 0 2px ${color.value}33` } : {}),
                          }}
                        >
                          {isSelected && (
                            <div className="flex h-full items-center justify-center">
                              <Check className="h-4 w-4 text-white drop-shadow" />
                            </div>
                          )}
                        </div>
                        <span className={clsx(
                          'text-xs font-medium',
                          isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500',
                        )}>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Typography & Layout */}
              <Card>
                <SectionHeader icon={Type} title="Typography & Layout" />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <RadioGroup
                    label="Font Size"
                    description="Base font size for the interface."
                    value={fontSize}
                    onChange={setFontSize}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'default', label: 'Default' },
                      { value: 'large', label: 'Large' },
                    ]}
                    icon={Type}
                  />
                  <Toggle
                    label="Compact Mode"
                    description="Reduce spacing and padding for denser layouts."
                    checked={compactMode}
                    onChange={setCompactMode}
                    icon={Minimize2}
                  />
                  <Toggle
                    label="Reduced Motion"
                    description={osReducedMotion ? 'Your OS prefers reduced motion (currently active).' : 'Reduce or disable animations and transitions.'}
                    checked={reducedMotion || osReducedMotion}
                    onChange={setReducedMotion}
                    icon={Sparkles}
                    badge={osReducedMotion ? 'OS Active' : undefined}
                  />
                  <RadioGroup
                    label="Sidebar Position"
                    description="Position of the navigation sidebar."
                    value={sidebarPosition}
                    onChange={setSidebarPosition}
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'right', label: 'Right' },
                    ]}
                    icon={PanelLeft}
                  />
                  <Toggle
                    label="Scroll Progress Bar"
                    description="Show a thin progress bar at the top during scrolling."
                    checked={showScrollProgress}
                    onChange={setShowScrollProgress}
                    icon={ScrollText}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* ========== DEBATES ========== */}
          {activeTab === 'debates' && (
            <div className="space-y-6 animate-fade-in">
              {/* Debate Defaults */}
              <Card>
                <SectionHeader icon={Swords} title="Debate Defaults" description="Configure default behavior for new debates." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <StyledSelect
                    label="Default Format"
                    description="Format used when creating a new debate."
                    value={defaultFormat}
                    onChange={setDefaultFormat}
                    options={DEBATE_FORMATS}
                    icon={Swords}
                  />
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Default Number of Turns</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">How many turns per side in a new debate.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={2}
                        max={20}
                        value={defaultTurns}
                        onChange={(e) => setDefaultTurns(parseInt(e.target.value, 10))}
                        className="w-24 accent-forge-600"
                      />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-6 text-right">{defaultTurns}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Streaming & AI Features */}
              <Card>
                <SectionHeader icon={Zap} title="AI Features" description="Toggle AI-powered features during debates." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <Toggle
                    label="Auto-Save Debates"
                    description="Automatically save debate progress after each turn."
                    checked={settings.autoSaveDebates}
                    onChange={(v) => updateSettings({ autoSaveDebates: v })}
                    icon={Database}
                  />
                  <Toggle
                    label="Streaming Responses"
                    description="Show AI responses as they are generated in real-time."
                    checked={settings.streamingEnabled}
                    onChange={(v) => updateSettings({ streamingEnabled: v })}
                    icon={Zap}
                  />
                  <Toggle
                    label="Extended Thinking"
                    description="Enable extended chain-of-thought reasoning (Claude only)."
                    checked={extendedThinking}
                    onChange={setExtendedThinking}
                    icon={Brain}
                    badge="Claude"
                  />
                  <Toggle
                    label="Fallacy Detection"
                    description="Automatically detect and flag logical fallacies in arguments."
                    checked={settings.fallacyDetectionEnabled}
                    onChange={(v) => updateSettings({ fallacyDetectionEnabled: v })}
                    icon={AlertTriangle}
                  />
                  <Toggle
                    label="Evidence Verification"
                    description="Verify cited evidence and sources during debates."
                    checked={evidenceVerification}
                    onChange={setEvidenceVerification}
                    icon={ShieldCheck}
                  />
                  <Toggle
                    label="Momentum Tracking"
                    description="Track and visualize debate momentum shifts between debaters."
                    checked={momentumTracking}
                    onChange={setMomentumTracking}
                    icon={Activity}
                  />
                </div>
              </Card>

              {/* Default Models */}
              <Card>
                <SectionHeader icon={Server} title="Default Models" description="Model providers for each debate position." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <StyledSelect
                    label="Proposition Model"
                    description="Default model for the proposition side."
                    value={defaultPropositionModel}
                    onChange={setDefaultPropositionModel}
                    options={MODEL_OPTIONS}
                    icon={Swords}
                  />
                  <StyledSelect
                    label="Opposition Model"
                    description="Default model for the opposition side."
                    value={defaultOppositionModel}
                    onChange={setDefaultOppositionModel}
                    options={MODEL_OPTIONS}
                    icon={Swords}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* ========== NOTIFICATIONS ========== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              {/* Master Toggle */}
              <Card>
                <SectionHeader icon={Bell} title="Notification Preferences" description="Control how and when you receive notifications." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <Toggle
                    label="Enable Notifications"
                    description="Master toggle for all in-app notifications."
                    checked={notificationsEnabled}
                    onChange={setNotificationsEnabled}
                    icon={notificationsEnabled ? Bell : BellOff}
                  />
                </div>
              </Card>

              {/* Sound Settings */}
              <Card>
                <SectionHeader icon={Volume2} title="Sound Effects" description="Audio feedback for debate events." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <Toggle
                    label="Sound Effects"
                    description="Play sounds for debate events."
                    checked={soundEnabled}
                    onChange={setSoundEnabled}
                    icon={soundEnabled ? Volume2 : VolumeX}
                  />
                  {soundEnabled && (
                    <RadioGroup
                      label="Sound Volume"
                      description="Volume level for sound effects."
                      value={soundVolume}
                      onChange={setSoundVolume}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                      ]}
                      icon={Volume2}
                    />
                  )}
                </div>
              </Card>

              {/* Per-Event Toggles */}
              <Card>
                <SectionHeader icon={Bell} title="Event Notifications" description="Choose which events trigger notifications." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                    <Toggle
                      label="Debate Completed"
                      description="When a debate finishes all turns."
                      checked={notifyDebateCompleted}
                      onChange={setNotifyDebateCompleted}
                      icon={CheckCircle}
                    />
                    <Toggle
                      label="Fallacy Detected"
                      description="When a logical fallacy is identified."
                      checked={notifyFallacyDetected}
                      onChange={setNotifyFallacyDetected}
                      icon={AlertTriangle}
                    />
                    <Toggle
                      label="Turn Completed"
                      description="After each debater finishes a turn."
                      checked={notifyTurnCompleted}
                      onChange={setNotifyTurnCompleted}
                      icon={ArrowRight}
                    />
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                    <Toggle
                      label="Tournament Update"
                      description="Progress updates during tournaments."
                      checked={notifyTournamentUpdate}
                      onChange={setNotifyTournamentUpdate}
                      icon={BarChart3}
                    />
                    <Toggle
                      label="Achievement Unlocked"
                      description="When you earn a new achievement."
                      checked={notifyAchievement}
                      onChange={setNotifyAchievement}
                      icon={Sparkles}
                    />
                  </div>
                </div>
              </Card>

              {/* Desktop Notifications */}
              <Card>
                <SectionHeader icon={Monitor} title="Desktop Notifications" description="System-level notification integration." />
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Desktop Notification Permission</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {desktopNotificationStatus === 'granted'
                          ? 'Desktop notifications are enabled.'
                          : desktopNotificationStatus === 'denied'
                            ? 'Desktop notifications were denied. Update in browser settings.'
                            : desktopNotificationStatus === 'unsupported'
                              ? 'Desktop notifications are not supported in this environment.'
                              : 'Allow DebateForge to show desktop notifications.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={desktopNotificationStatus === 'granted' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={handleRequestNotificationPermission}
                    disabled={desktopNotificationStatus === 'granted' || desktopNotificationStatus === 'unsupported'}
                    icon={desktopNotificationStatus === 'granted' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Bell className="h-4 w-4" />}
                  >
                    {desktopNotificationStatus === 'granted' ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
              </Card>

              {/* Quiet Hours */}
              <Card>
                <SectionHeader icon={Clock} title="Quiet Hours" description="Suppress notifications during specific hours." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <Toggle
                    label="Enable Quiet Hours"
                    description="Mute all notifications during the specified time window."
                    checked={quietHoursEnabled}
                    onChange={setQuietHoursEnabled}
                    icon={Moon}
                  />
                  {quietHoursEnabled && (
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Schedule</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Notifications are muted during this window.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-400 dark:text-gray-500 mb-1">Start</span>
                          <input
                            type="time"
                            value={quietHoursStart}
                            onChange={(e) => setQuietHoursStart(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100"
                          />
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 mt-3">-</span>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-400 dark:text-gray-500 mb-1">End</span>
                          <input
                            type="time"
                            value={quietHoursEnd}
                            onChange={(e) => setQuietHoursEnd(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ========== PRIVACY ========== */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in">
              {/* Trust Banner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Your data never leaves your device</p>
                    <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                      All debates, settings, and personal data are stored locally on your machine. DebateForge does not collect, transmit, or store any of your data on external servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics & Reporting */}
              <Card>
                <SectionHeader icon={BarChart3} title="Analytics & Reporting" description="Control what usage data is collected." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <Toggle
                    label="Anonymous Usage Analytics"
                    description="Help improve DebateForge by sharing anonymous usage data."
                    checked={analyticsEnabled}
                    onChange={setAnalyticsEnabled}
                    icon={BarChart3}
                  />
                  <Toggle
                    label="Crash Reporting"
                    description="Automatically send anonymous crash reports to help fix bugs."
                    checked={crashReportingEnabled}
                    onChange={setCrashReportingEnabled}
                    icon={Bug}
                  />
                </div>
              </Card>

              {/* Data Retention */}
              <Card>
                <SectionHeader icon={Database} title="Data Retention" description="Control how long your data is kept." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <StyledSelect
                    label="Data Retention Period"
                    description="Automatically delete debates older than this period."
                    value={dataRetention}
                    onChange={setDataRetention}
                    options={[
                      { value: 'forever', label: 'Keep forever' },
                      { value: '30', label: '30 days' },
                      { value: '90', label: '90 days' },
                      { value: '365', label: '1 year' },
                    ]}
                    icon={Calendar}
                  />
                </div>
              </Card>

              {/* Clear Data */}
              <Card>
                <SectionHeader icon={Trash2} title="Clear Data" description="Remove stored data from your device." />
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3 hover:border-gray-300 dark:hover:border-surface-dark-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                        <MessageSquare className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Clear Debate History</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Remove all saved debates from local storage.</p>
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={handleClearDebateHistory} icon={<Trash2 className="h-4 w-4" />}>
                      Clear
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3 hover:border-gray-300 dark:hover:border-surface-dark-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                        <Search className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Clear Search History</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Remove all cached search queries and suggestions.</p>
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={handleClearSearchHistory} icon={<Trash2 className="h-4 w-4" />}>
                      Clear
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Export Personal Data */}
              <Card>
                <SectionHeader icon={Download} title="Export Personal Data" description="Download all your data stored in DebateForge." />
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3 hover:border-gray-300 dark:hover:border-surface-dark-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Export All Personal Data</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Download everything: debates, settings, preferences, and all localStorage data as a JSON file.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportPersonalData} icon={<Download className="h-4 w-4" />}>
                    Export JSON
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* ========== KEYBOARD SHORTCUTS ========== */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 animate-fade-in">
              {/* Search */}
              <Card>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={shortcutSearch}
                    onChange={(e) => setShortcutSearch(e.target.value)}
                    placeholder="Search shortcuts..."
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  {shortcutSearch && (
                    <button
                      onClick={() => setShortcutSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>

              {/* Shortcuts by category */}
              {SHORTCUT_CATEGORIES.map((category) => {
                const categoryShortcuts = filteredShortcuts.filter((s) => s.category === category);
                if (categoryShortcuts.length === 0) return null;

                const categoryIcon = {
                  Navigation: ChevronRight,
                  Debate: Swords,
                  General: Sliders,
                  Views: Monitor,
                }[category];

                return (
                  <Card key={category}>
                    <SectionHeader icon={categoryIcon} title={category} description={`${categoryShortcuts.length} shortcut${categoryShortcuts.length !== 1 ? 's' : ''}`} />
                    <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                      {categoryShortcuts.map((sc) => (
                        <div key={sc.action} className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{sc.action}</span>
                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            {sc.keys.map((k, i) => (
                              <React.Fragment key={`${sc.action}-${k}-${i}`}>
                                {i > 0 && <span className="text-xs text-gray-300 dark:text-gray-600 mx-0.5">+</span>}
                                <kbd className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-mono font-medium text-gray-600 shadow-sm dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-400 min-w-[28px]">
                                  {k}
                                </kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}

              {/* No results */}
              {filteredShortcuts.length === 0 && (
                <Card>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No shortcuts found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Try a different search term like &ldquo;debate&rdquo; or &ldquo;navigate&rdquo;.
                    </p>
                  </div>
                </Card>
              )}

              {/* Total count footer */}
              {!shortcutSearch && (
                <div className="text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {FULL_SHORTCUTS.length} keyboard shortcuts available
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========== DATA ========== */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              {/* Storage Usage */}
              <Card>
                <SectionHeader icon={Database} title="Storage Usage" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-surface-dark-3">
                    <MessageSquare className="h-5 w-5 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{debates.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Debates</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-surface-dark-3">
                    <Users className="h-5 w-5 mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{personas.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Personas</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-surface-dark-3">
                    <HardDrive className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{estimatedDataSize}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Data Size</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total debate turns</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{totalTurns}</span>
                  </div>
                </div>
              </Card>

              {/* Export & Import */}
              <Card>
                <SectionHeader icon={FileJson} title="Export & Import" description="Back up or restore your DebateForge data." />
                <div className="space-y-3">
                  {/* Export */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3 hover:border-gray-300 dark:hover:border-surface-dark-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Export All Data</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {debates.length} debates, {personas.length} personas (~{estimatedDataSize})
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportAll} icon={<Download className="h-4 w-4" />}>
                      Export JSON
                    </Button>
                  </div>

                  {/* Import */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3 hover:border-gray-300 dark:hover:border-surface-dark-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Import Data from JSON</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Select a previously exported JSON file.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleImportFile} icon={<Upload className="h-4 w-4" />}>
                      Choose File
                    </Button>
                  </div>

                  {/* Import preview */}
                  {importPreview && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">Import Preview</p>
                      <div className="space-y-1 text-xs text-emerald-700 dark:text-emerald-400 mb-3">
                        <p>Debates: {importPreview.debates}</p>
                        <p>Personas: {importPreview.personas}</p>
                        <p>File size: {importPreview.size}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleConfirmImport} icon={<CheckCircle className="h-3.5 w-3.5" />}>
                          Confirm Import
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setImportPreview(null); setImportData(null); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Database Info */}
              <Card>
                <SectionHeader icon={Database} title="Database Info" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Storage type</span>
                    <Badge variant="default">localStorage + SQLite</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Database path</span>
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate max-w-[240px]">%APPDATA%/debateforge/data.db</span>
                  </div>
                </div>
              </Card>

              {/* Danger Zone */}
              <Card className="!border-red-200 dark:!border-red-900/40">
                <SectionHeader icon={AlertTriangle} title="Danger Zone" description="These actions are irreversible. Proceed with caution." />
                <div className="divide-y divide-red-100 dark:divide-red-900/20">
                  <DangerRow
                    title="Clear All Debates"
                    description={`Permanently delete all ${debates.length} saved debates.`}
                    buttonLabel="Clear Debates"
                    onClick={() => setShowClearDebatesModal(true)}
                    icon={Trash2}
                  />
                  <DangerRow
                    title="Clear All Personas"
                    description={`Remove all ${personas.length} custom personas.`}
                    buttonLabel="Clear Personas"
                    onClick={() => setShowClearPersonasModal(true)}
                    icon={Users}
                  />
                  <DangerRow
                    title="Reset All Settings"
                    description="Restore all settings to their factory defaults."
                    buttonLabel="Reset Settings"
                    onClick={() => setShowResetSettingsModal(true)}
                    icon={RotateCcw}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* ========== ABOUT ========== */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              {/* App identity */}
              <Card>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg">
                    <Swords className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">DebateForge</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      The AI-Powered Debate Arena. Pit the world's most powerful language models against each other in structured, formal debates.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Tech Stack */}
              <Card>
                <SectionHeader icon={Code} title="Tech Stack" />
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Electron', version: '33.4', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
                    { name: 'React', version: '19.0', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
                    { name: 'TypeScript', version: '5.7', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                    { name: 'Tailwind CSS', version: '3.4', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
                    { name: 'Zustand', version: '5.0', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                    { name: 'SQLite', version: '3', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                    { name: 'Vite', version: '6.0', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
                  ].map((tech) => (
                    <span key={tech.name} className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold', tech.color)}>
                      <Package className="h-3 w-3" />
                      {tech.name}
                      <span className="opacity-60">v{tech.version}</span>
                    </span>
                  ))}
                </div>
              </Card>

              {/* Links */}
              <Card>
                <SectionHeader icon={ExternalLink} title="Links" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'GitHub Repository', icon: Github, desc: 'View source code', url: '#' },
                    { label: 'Report a Bug', icon: Bug, desc: 'File an issue', url: '#' },
                    { label: 'Request Feature', icon: Lightbulb, desc: 'Suggest improvements', url: '#' },
                  ].map((link) => (
                    <button
                      key={link.label}
                      onClick={() => {
                        try { window.electronAPI?.openExternalUrl(link.url); } catch { /* noop */ }
                      }}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-surface-dark-3 dark:hover:border-surface-dark-4 dark:hover:bg-surface-dark-2"
                    >
                      <link.icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{link.label}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{link.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Keyboard Shortcuts */}
              <Card>
                <SectionHeader icon={Keyboard} title="Keyboard Shortcuts" description="Top 10 shortcuts for power users." />
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  {SHORTCUTS.map((sc) => (
                    <div key={sc.action} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{sc.action}</span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map((k, i) => (
                          <React.Fragment key={k}>
                            {i > 0 && <span className="text-xs text-gray-300 dark:text-gray-600 mx-0.5">+</span>}
                            <kbd className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-mono font-medium text-gray-600 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-400 min-w-[24px]">
                              {k}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Credits & License */}
              <Card>
                <SectionHeader icon={Heart} title="Credits & Acknowledgments" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  DebateForge is built with love using open-source technologies. Special thanks to the teams behind Electron, React, Tailwind CSS,
                  and the AI providers who make advanced language models accessible to developers.
                </p>
                <div className="rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">License</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    DebateForge is open-source software released under the <span className="font-semibold text-gray-700 dark:text-gray-300">MIT License</span>.
                    You are free to use, modify, and distribute this software in accordance with the license terms.
                  </p>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* ============================================================
         MODALS
         ============================================================ */}

      {/* Clear Debates Modal - with DELETE confirmation */}
      <Modal isOpen={showClearDebatesModal} onClose={() => { setShowClearDebatesModal(false); setDeleteConfirmText(''); }} title="Clear All Debates">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            This will permanently delete all {debates.length} saved debates.
          </p>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            This action cannot be undone. Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> below to confirm.
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100 mb-4"
          />
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => { setShowClearDebatesModal(false); setDeleteConfirmText(''); }}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleClearDebates}
              disabled={deleteConfirmText !== 'DELETE'}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Delete All Debates
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Personas Modal */}
      <Modal isOpen={showClearPersonasModal} onClose={() => setShowClearPersonasModal(false)} title="Clear All Personas">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Remove all {personas.length} custom personas?
          </p>
          <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
            Built-in personas will be restored on next reload. Custom personas will be lost.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setShowClearPersonasModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClearPersonas} icon={<Trash2 className="h-4 w-4" />}>Clear Personas</Button>
          </div>
        </div>
      </Modal>

      {/* Reset Settings Modal */}
      <Modal isOpen={showResetSettingsModal} onClose={() => setShowResetSettingsModal(false)} title="Reset All Settings">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <RotateCcw className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Reset all settings to factory defaults?
          </p>
          <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
            This will reset theme, accent color, debate preferences, and all other settings. Your debates and personas will not be affected.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setShowResetSettingsModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleResetSettings} icon={<RotateCcw className="h-4 w-4" />}>Reset Settings</Button>
          </div>
        </div>
      </Modal>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SettingsView;
