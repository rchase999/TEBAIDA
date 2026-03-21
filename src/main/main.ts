import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { initDatabase, getDbHealth } from './database';

// Simple JSON file store (electron-store v10 has ESM issues in CJS context)
import * as fs from 'fs';

class SimpleStore {
  private data: Record<string, unknown>;
  private filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'config.json');
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      this.data = { apiKeys: {} };
    }
  }

  get(key: string, defaultValue: unknown = undefined): unknown {
    return this.data[key] ?? defaultValue;
  }

  set(key: string, value: unknown): void {
    this.data[key] = value;
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }
}

let store: SimpleStore;

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e1e2e',
      symbolColor: '#cdd6f4',
      height: 36,
    },
    backgroundColor: '#1e1e2e',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !isDev,
      sandbox: false,
    },
  });

  if (isDev) {
    // Retry loading until Vite dev server is ready
    const loadDevURL = async () => {
      const maxRetries = 30;
      for (let i = 0; i < maxRetries; i++) {
        try {
          await mainWindow!.loadURL('http://localhost:5173');
          return;
        } catch {
          if (i < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
      console.error('Failed to connect to Vite dev server at http://localhost:5173');
    };
    loadDevURL();
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ──────────────────────────────────────────────
// IPC Handlers
// ──────────────────────────────────────────────

function registerIpcHandlers(): void {
  ipcMain.handle('get-api-keys', (): Record<string, string> => {
    return store.get('apiKeys', {}) as Record<string, string>;
  });

  ipcMain.handle(
    'save-api-keys',
    (_event: Electron.IpcMainInvokeEvent, keys: Record<string, string>): void => {
      store.set('apiKeys', keys);
    },
  );

  ipcMain.handle(
    'open-external-url',
    async (_event: Electron.IpcMainInvokeEvent, url: string): Promise<void> => {
      // Only allow http(s) URLs to prevent shell injection
      if (/^https?:\/\//i.test(url)) {
        await shell.openExternal(url);
      }
    },
  );

  ipcMain.handle('get-app-path', (): string => {
    return app.getPath('userData');
  });

  ipcMain.handle('get-db-health', () => {
    try {
      return getDbHealth();
    } catch {
      return { status: 'error', debates: 0, turns: 0, size: '0 KB' };
    }
  });
}

// ──────────────────────────────────────────────
// App lifecycle
// ──────────────────────────────────────────────

app.whenReady().then(() => {
  store = new SimpleStore();
  initDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows exist
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Export mainWindow getter for other modules that may need to send events
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
