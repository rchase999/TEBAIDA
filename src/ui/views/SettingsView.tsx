import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  Key, Eye, EyeOff, CheckCircle, XCircle, Loader2,
  Server, Monitor, Sun, Moon, Palette, Database,
  Download, Trash2, RefreshCw, Info, Zap, Shield,
} from 'lucide-react';
import { useStore } from '../store';
import { useTheme } from '../themes';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import type { ModelProvider } from '../../types';

/* ------- Provider config ------- */

interface ProviderInfo {
  id: ModelProvider;
  label: string;
  placeholder: string;
}

const PROVIDERS: ProviderInfo[] = [
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { id: 'google', label: 'Google (Gemini)', placeholder: 'AI...' },
  { id: 'mistral', label: 'Mistral', placeholder: 'Bearer ...' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_...' },
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
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Input
          label={provider.label}
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
  );
};

/* ------- Toggle Switch ------- */

const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        checked ? 'bg-forge-600' : 'bg-gray-300 dark:bg-surface-dark-4',
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
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

  const [testStatuses, setTestStatuses] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

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
          // 200 = success, 400 = bad request (still means key is valid)
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
    a.download = 'debateforge-debates.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearDebates = () => {
    try { localStorage.removeItem('debateforge-debates'); } catch {}
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure API keys, models, and app preferences.</p>
      </div>

      {/* API Keys */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">API Keys</h2>
        </div>
        <Card className="space-y-4">
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
              Save Keys
            </Button>
          </div>
        </Card>
      </section>

      {/* Local Models */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Local Models</h2>
        </div>
        <Card className="space-y-4">
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
        </Card>
      </section>

      {/* Appearance */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
        </div>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred color scheme.</p>
            </div>
            <div className="flex rounded-lg border border-gray-200 dark:border-surface-dark-4 overflow-hidden">
              {([
                { value: 'light' as const, icon: Sun, label: 'Light' },
                { value: 'dark' as const, icon: Moon, label: 'Dark' },
                { value: 'system' as const, icon: Monitor, label: 'System' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                    theme === opt.value
                      ? 'bg-forge-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-surface-dark-2',
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Debate Defaults */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Debate Defaults</h2>
        </div>
        <Card className="space-y-1 divide-y divide-gray-100 dark:divide-surface-dark-3">
          <Toggle
            label="Streaming Responses"
            description="Show AI responses as they are generated."
            checked={settings.streamingEnabled}
            onChange={(v) => updateSettings({ streamingEnabled: v })}
          />
          <Toggle
            label="Evidence Panel"
            description="Show the evidence browser alongside debates."
            checked={settings.evidencePanelEnabled}
            onChange={(v) => updateSettings({ evidencePanelEnabled: v })}
          />
          <Toggle
            label="Fallacy Detection"
            description="Automatically detect and flag logical fallacies."
            checked={settings.fallacyDetectionEnabled}
            onChange={(v) => updateSettings({ fallacyDetectionEnabled: v })}
          />
          <Toggle
            label="Auto-Save Debates"
            description="Automatically save debate progress."
            checked={settings.autoSaveDebates}
            onChange={(v) => updateSettings({ autoSaveDebates: v })}
          />
        </Card>
      </section>

      {/* Data */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data</h2>
        </div>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Export Debates</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Download all {debates.length} debates as JSON.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportDebates} icon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </div>
          <div className="h-px bg-gray-200 dark:bg-surface-dark-3" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Clear Debate History</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete all saved debates.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowClearModal(true)} icon={<Trash2 className="h-4 w-4" />}>
              Clear
            </Button>
          </div>
        </Card>
      </section>

      {/* About */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">About</h2>
        </div>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forge-100 dark:bg-forge-900/30">
              <Shield className="h-6 w-6 text-forge-600 dark:text-forge-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">DebateForge</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">AI-Powered Debate Arena</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Clear modal */}
      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Clear Debate History">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          This will permanently delete all {debates.length} saved debates. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowClearModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleClearDebates}>Clear All</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;
