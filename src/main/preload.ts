import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface ElectronAPI {
  getApiKeys(): Promise<Record<string, string>>;
  saveApiKeys(keys: Record<string, string>): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  getAppPath(): Promise<string>;
  onDebateEvent(callback: (event: IpcRendererEvent, ...args: unknown[]) => void): void;
  removeDebateEvent(): void;
}

const DEBATE_EVENT_CHANNEL = 'debate-event';

contextBridge.exposeInMainWorld('electronAPI', {
  // ── API key management via electron-store ──
  getApiKeys: (): Promise<Record<string, string>> => {
    return ipcRenderer.invoke('get-api-keys');
  },

  saveApiKeys: (keys: Record<string, string>): Promise<void> => {
    return ipcRenderer.invoke('save-api-keys', keys);
  },

  // ── Shell integration ──
  openExternalUrl: (url: string): Promise<void> => {
    return ipcRenderer.invoke('open-external-url', url);
  },

  // ── App paths ──
  getAppPath: (): Promise<string> => {
    return ipcRenderer.invoke('get-app-path');
  },

  // ── Debate event streaming ──
  onDebateEvent: (callback: (event: IpcRendererEvent, ...args: unknown[]) => void): void => {
    ipcRenderer.on(DEBATE_EVENT_CHANNEL, callback);
  },

  removeDebateEvent: (): void => {
    ipcRenderer.removeAllListeners(DEBATE_EVENT_CHANNEL);
  },
} satisfies ElectronAPI);
