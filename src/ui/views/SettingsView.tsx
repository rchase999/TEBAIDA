import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  Key, Eye, EyeOff, CheckCircle, XCircle, Loader2,
  Server, Monitor, Sun, Moon, Palette, Database,
  Download, Trash2, RefreshCw, Info, Zap, Shield,
  Upload, Globe, Bell, Lock, Keyboard, Code,
  ChevronRight, ExternalLink, Sliders, HardDrive,
  FileJson, Paintbrush, Volume2, VolumeX,
  ShieldCheck, AlertTriangle, Swords,
} from 'lucide-react';
import { useStore } from '../store';
import { useTheme } from '../themes';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import type { ModelProvider } from '../../types';

/* ------- Tab definitions ------- */

type SettingsTab = 'general' | 'api-keys' | 'appearance' | 'debate' | 'data' | 'about';

interface TabDef {
  id: SettingsTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const TABS: TabDef[] = [
  { id: 'general', label: 'General', icon: Sliders },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'appearance', label: 'Appearance', icon: Paintbrush },
  { id: 'debate', label: 'Debate', icon: Zap },
  { id: 'data', label: 'Data', icon: HardDrive },
  { id: 'about', label: 'About', icon: Info },
];

/* ------- Provider config ------- */

interface ProviderInfo {
  id: ModelProvider;
  label: string;
  placeholder: string;
  description: string;
}

const PROVIDERS: ProviderInfo[] = [
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...', description: 'Claude 3.5/4 models with extended thinking' },
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...', description: 'GPT-4o, o1, o3 reasoning models' },
  { id: 'google', label: 'Google (Gemini)', placeholder: 'AI...', description: 'Gemini 2.5 Pro/Flash models' },
  { id: 'mistral', label: 'Mistral', placeholder: 'Bearer ...', description: 'Mistral Large, Codestral models' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_...', description: 'Ultra-fast inference with Groq' },
];

/* ------- Accent colors ------- */

const ACCENT_COLORS = [
  { name: 'Indigo', value: '#4c6ef5' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
];

/* ------- API Key Row ------- */

const ApiKeyRow: React.FC<{
  provider: ProviderInfo;
  value: string;
  onChange: (key: string) => void;
  onTest: () => void;
  testStatus: 'idle' | 'testing' | 'success' | 'error';
}> = ({ provider, value, onChange, onTest, testStatus }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-colors dark:border-surface-dark-3 dark:bg-surface-dark-1 hover:border-gray-300 dark:hover:border-surface-dark-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{provider.label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{provider.description}</p>
        </div>
        {value && (
          <Badge variant={testStatus === 'success' ? 'success' : testStatus === 'error' ? 'error' : 'default'} size="sm">
            {testStatus === 'success' ? 'Connected' : testStatus === 'error' ? 'Failed' : value.length > 5 ? 'Configured' : 'Not Set'}
          </Badge>
        )}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
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
          disabled={!value || testStatus === 'testing'}
          loading={testStatus === 'testing'}
          className="mb-0.5 shrink-0"
        >
          {testStatus === 'success' ? (
            <><CheckCircle className="h-4 w-4 text-emerald-500" /> OK</>
          ) : testStatus === 'error' ? (
            <><XCircle className="h-4 w-4 text-red-500" /> Fail</>
          ) : (
            'Test'
          )}
        </Button>
      </div>
    </div>
  );
};

/* ------- Toggle Switch ------- */

const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.FC<{ className?: string }>;
}> = ({ label, description, checked, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
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

/* ------- Main ------- */

const SettingsView: React.FC = () => {
  const apiKeys = useStore((s) => s.apiKeys);
  const setApiKey = useStore((s) => s.setApiKey);
  const saveApiKeys = useStore((s) => s.saveApiKeys);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const debates = useStore((s) => s.debates);
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [testStatuses, setTestStatuses] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

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
    setTimeout(() => setTestStatuses((s) => ({ ...s, [providerId]: 'idle' })), 3000);
  }, [apiKeys]);

  const handleSaveKeys = async () => {
    await saveApiKeys();
  };

  const handleTestLocalEndpoint = useCallback(async (endpoint: string, type: 'ollama' | 'lmstudio') => {
    setTestStatuses((s) => ({ ...s, [type]: 'testing' }));
    try {
      const url = type === 'ollama' ? `${endpoint}/api/tags` : `${endpoint}/models`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        setTestStatuses((s) => ({ ...s, [type]: 'success' }));
      } else {
        setTestStatuses((s) => ({ ...s, [type]: 'error' }));
      }
    } catch {
      setTestStatuses((s) => ({ ...s, [type]: 'error' }));
    }
    setTimeout(() => setTestStatuses((s) => ({ ...s, [type]: 'idle' })), 3000);
  }, []);

  const handleRefreshModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const resp = await fetch(`${settings.localModelEndpoint}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json();
        const models = (data.models ?? []).map((m: any) => m.name ?? m.model ?? 'unknown');
        setLocalModels(models);
      }
    } catch {
      // silently fail
    }
    setLoadingModels(false);
  }, [settings.localModelEndpoint]);

  const handleExportDebates = () => {
    const blob = new Blob([JSON.stringify(debates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debateforge-debates-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDebates = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          setImportStatus(`Successfully parsed ${imported.length} debates. Refresh to see them.`);
          const existing = JSON.parse(localStorage.getItem('debateforge-debates') || '[]');
          const merged = [...imported, ...existing];
          localStorage.setItem('debateforge-debates', JSON.stringify(merged));
        } else {
          setImportStatus('Invalid format: expected an array of debates.');
        }
      } catch {
        setImportStatus('Failed to parse the file.');
      }
      setTimeout(() => setImportStatus(''), 5000);
    };
    input.click();
  };

  const handleClearDebates = () => {
    try { localStorage.removeItem('debateforge-debates'); } catch {}
    window.location.reload();
  };

  const configuredKeyCount = PROVIDERS.filter((p) => {
    const k = (apiKeys as any)[p.id];
    return k && k.length > 5;
  }).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure API keys, appearance, and app preferences.</p>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <nav className="hidden sm:block w-48 shrink-0">
          <div className="sticky top-6 space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-forge-600/10 text-forge-600 dark:bg-forge-500/15 dark:text-forge-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-surface-dark-2 dark:hover:text-gray-200',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                  {tab.id === 'api-keys' && configuredKeyCount > 0 && (
                    <Badge variant="success" size="sm">{configuredKeyCount}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile tab bar */}
        <div className="sm:hidden mb-4 flex overflow-x-auto gap-1 border-b border-gray-200 dark:border-surface-dark-3 -mx-6 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-forge-500 text-forge-600 dark:text-forge-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Language & Region</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Debate Language</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">AI models will respond in this language.</p>
                    </div>
                    <select
                      value={(settings as any).language ?? 'en'}
                      onChange={(e) => updateSettings({ language: e.target.value } as any)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100"
                    >
                      <option value="en">English</option>
                      <option value="es">Espanol</option>
                      <option value="fr">Francais</option>
                      <option value="de">Deutsch</option>
                      <option value="pt">Portugues</option>
                      <option value="it">Italiano</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh">Chinese (Mandarin)</option>
                      <option value="ar">Arabic</option>
                      <option value="hi">Hindi</option>
                      <option value="ru">Russian</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Local Models */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Server className="h-5 w-5 text-forge-600 dark:text-forge-400" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Local Models</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label="Ollama Endpoint"
                        value={settings.localModelEndpoint}
                        onChange={(e) => updateSettings({ localModelEndpoint: e.target.value })}
                        placeholder="http://localhost:11434"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestLocalEndpoint(settings.localModelEndpoint, 'ollama')}
                      loading={testStatuses['ollama'] === 'testing'}
                      className="mb-0.5"
                    >
                      {testStatuses['ollama'] === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : 'Test'}
                    </Button>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label="LM Studio Endpoint"
                        value={settings.lmStudioEndpoint}
                        onChange={(e) => updateSettings({ lmStudioEndpoint: e.target.value })}
                        placeholder="http://localhost:1234/v1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestLocalEndpoint(settings.lmStudioEndpoint, 'lmstudio')}
                      loading={testStatuses['lmstudio'] === 'testing'}
                      className="mb-0.5"
                    >
                      {testStatuses['lmstudio'] === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : 'Test'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-surface-dark-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Models</p>
                      {localModels.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {localModels.map((m) => <Badge key={m} variant="default">{m}</Badge>)}
                        </div>
                      )}
                      {localModels.length === 0 && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">No models loaded. Click Refresh to check.</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefreshModels} loading={loadingModels} icon={<RefreshCw className="h-4 w-4" />}>
                      Refresh
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api-keys' && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Your API keys are stored locally</p>
                    <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Keys are encrypted and stored on your device. They are never sent to any server other than the respective API provider.</p>
                  </div>
                </div>
              </div>

              {PROVIDERS.map((p) => (
                <ApiKeyRow
                  key={p.id}
                  provider={p}
                  value={(apiKeys as any)[p.id] ?? ''}
                  onChange={(key) => setApiKey(p.id, key)}
                  onTest={() => handleTestConnection(p.id)}
                  testStatus={testStatuses[p.id] ?? 'idle'}
                />
              ))}
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSaveKeys} icon={<CheckCircle className="h-4 w-4" />}>
                  Save All Keys
                </Button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Theme</h2>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'light' as const, icon: Sun, label: 'Light', desc: 'Clean & bright' },
                    { value: 'dark' as const, icon: Moon, label: 'Dark', desc: 'Easy on the eyes' },
                    { value: 'system' as const, icon: Monitor, label: 'System', desc: 'Matches your OS' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={clsx(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                        theme === opt.value
                          ? 'border-forge-500 bg-forge-50 shadow-sm dark:bg-forge-900/10'
                          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4',
                      )}
                    >
                      <div className={clsx(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        theme === opt.value ? 'bg-forge-100 dark:bg-forge-900/30' : 'bg-gray-100 dark:bg-surface-dark-2',
                      )}>
                        <opt.icon className={clsx('h-5 w-5', theme === opt.value ? 'text-forge-600 dark:text-forge-400' : 'text-gray-500 dark:text-gray-400')} />
                      </div>
                      <div className="text-center">
                        <p className={clsx('text-sm font-semibold', theme === opt.value ? 'text-forge-600 dark:text-forge-400' : 'text-gray-700 dark:text-gray-300')}>{opt.label}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Accent Color</h2>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={clsx(
                        'group flex flex-col items-center gap-1.5',
                      )}
                      title={color.name}
                    >
                      <div
                        className={clsx(
                          'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                          color.value === '#4c6ef5' ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-forge-500 dark:ring-offset-surface-dark-1' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
                        )}
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{color.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Accent color customization coming in a future update.</p>
              </Card>
            </div>
          )}

          {/* Debate */}
          {activeTab === 'debate' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Debate Defaults</h2>
                <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Configure default behavior for new debates.</p>
                <div className="divide-y divide-gray-100 dark:divide-surface-dark-3">
                  <Toggle
                    label="Streaming Responses"
                    description="Show AI responses as they are generated in real-time."
                    checked={settings.streamingEnabled}
                    onChange={(v) => updateSettings({ streamingEnabled: v })}
                    icon={Zap}
                  />
                  <Toggle
                    label="Evidence Panel"
                    description="Show the evidence verification browser alongside debates."
                    checked={settings.evidencePanelEnabled}
                    onChange={(v) => updateSettings({ evidencePanelEnabled: v })}
                    icon={ShieldCheck}
                  />
                  <Toggle
                    label="Fallacy Detection"
                    description="Automatically detect and flag logical fallacies in arguments."
                    checked={settings.fallacyDetectionEnabled}
                    onChange={(v) => updateSettings({ fallacyDetectionEnabled: v })}
                    icon={AlertTriangle}
                  />
                  <Toggle
                    label="Auto-Save Debates"
                    description="Automatically save debate progress after each turn."
                    checked={settings.autoSaveDebates}
                    onChange={(v) => updateSettings({ autoSaveDebates: v })}
                    icon={Database}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Data */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Export & Import</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3">
                    <div className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Export Debates</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Download all {debates.length} debates as JSON.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportDebates} icon={<Download className="h-4 w-4" />}>
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-surface-dark-3">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Import Debates</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Import debates from a JSON file.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleImportDebates} icon={<Upload className="h-4 w-4" />}>
                      Import
                    </Button>
                  </div>
                  {importStatus && (
                    <p className="text-xs text-forge-600 dark:text-forge-400 px-1">{importStatus}</p>
                  )}
                </div>
              </Card>

              {/* Storage info */}
              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Storage</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Debates stored</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{debates.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total turns</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {debates.reduce((sum, d) => sum + (d.turns?.length ?? 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Estimated size</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {(() => {
                        try {
                          const size = new Blob([localStorage.getItem('debateforge-debates') ?? '']).size;
                          if (size < 1024) return `${size} B`;
                          if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
                          return `${(size / 1024 / 1024).toFixed(1)} MB`;
                        } catch { return 'Unknown'; }
                      })()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Danger zone */}
              <Card className="!border-red-200 dark:!border-red-900/40">
                <h2 className="mb-2 text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Irreversible actions. Proceed with caution.</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Clear All Debate History</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete all {debates.length} saved debates.</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setShowClearModal(true)} icon={<Trash2 className="h-4 w-4" />}>
                    Clear All
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* About */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg">
                    <Swords className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">DebateForge</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">AI-Powered Debate Arena</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Tech Stack</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Electron', version: '33.4' },
                    { name: 'React', version: '19.0' },
                    { name: 'TypeScript', version: '5.7' },
                    { name: 'Tailwind CSS', version: '3.4' },
                    { name: 'Zustand', version: '5.0' },
                    { name: 'Vite', version: '6.0' },
                  ].map((tech) => (
                    <div key={tech.name} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-surface-dark-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tech.name}</span>
                      <Badge variant="default" size="sm">v{tech.version}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Supported AI Providers</h2>
                <div className="space-y-2">
                  {[
                    { name: 'Anthropic', models: 'Claude 3.5 Sonnet, Claude 4, Opus' },
                    { name: 'OpenAI', models: 'GPT-4o, o1, o3 reasoning models' },
                    { name: 'Google', models: 'Gemini 2.5 Pro, Flash' },
                    { name: 'Ollama', models: 'Any local model (Llama, DeepSeek, Mistral)' },
                    { name: 'LM Studio', models: 'OpenAI-compatible local inference' },
                  ].map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-surface-dark-2 transition-colors">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{provider.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{provider.models}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">License</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  DebateForge is open-source software released under the MIT License.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Clear modal */}
      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Clear Debate History">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Are you sure?</p>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            This will permanently delete all {debates.length} saved debates. This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setShowClearModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClearDebates} icon={<Trash2 className="h-4 w-4" />}>Delete All</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;
