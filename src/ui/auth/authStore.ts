import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginEntry {
  date: string;
  ip: string;
  device: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarColor: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  createdAt: string;
  lastLoginAt: string;
  role: 'user' | 'admin';
  sessions: Session[];
  loginHistory: LoginEntry[];
}

interface StoredUser extends User {
  passwordHash: string;
  verificationCode?: string;
  verificationExpiry?: string;
  resetToken?: string;
  resetExpiry?: string;
  failedAttempts: number;
  lockedUntil?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  verifyEmail: (code: string) => boolean;
  resendVerification: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => boolean;
  updateProfile: (updates: Partial<User>) => void;
  changePassword: (current: string, newPass: string) => boolean;
  enable2FA: () => string;
  verify2FA: (code: string) => boolean;
  disable2FA: (password: string, code: string) => boolean;
  deleteAccount: (password: string, confirmation: string) => boolean;
  revokeSession: (sessionId: string) => void;
  revokeAllSessions: () => void;
  clearError: () => void;
  loadPersistedAuth: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USERS_KEY = 'debateforge-users';
const AUTH_KEY = 'debateforge-auth';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#2563eb', '#7c3aed',
];

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to base64-like string
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return btoa(hex + str.length.toString(16).padStart(4, '0'));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generate2FASecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
    codes.push(code.toUpperCase());
  }
  return codes;
}

function generateMockSession(isCurrent: boolean): Session {
  const devices = ['Windows Desktop', 'MacBook Pro', 'Linux Workstation', 'iPad Pro', 'iPhone 15'];
  const browsers = ['Chrome 121', 'Firefox 122', 'Safari 17', 'Edge 121', 'Electron App'];
  const locations = ['New York, US', 'San Francisco, US', 'London, UK', 'Berlin, DE', 'Tokyo, JP'];
  const ips = ['192.168.1.x', '10.0.0.x', '172.16.0.x', '203.0.113.x', '198.51.100.x'];

  return {
    id: generateId(),
    device: isCurrent ? 'Desktop (Current)' : devices[Math.floor(Math.random() * devices.length)],
    browser: isCurrent ? 'Electron App' : browsers[Math.floor(Math.random() * browsers.length)],
    ip: ips[Math.floor(Math.random() * ips.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    lastActive: isCurrent ? new Date().toISOString() : new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    isCurrent,
  };
}

function getStoredUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function persistAuth(user: User | null): void {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id, timestamp: Date.now() }));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

function stripSensitive(stored: StoredUser): User {
  const { passwordHash, verificationCode, verificationExpiry, resetToken, resetExpiry, failedAttempts, lockedUntil, ...user } = stored;
  return user;
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters required');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required');
  if (!/[0-9]/.test(password)) errors.push('At least one number required');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) errors.push('At least one special character required');
  return { valid: errors.length === 0, errors };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  signUp: async (email: string, password: string, displayName: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    await delay(800 + Math.random() * 700);

    const emailLower = email.toLowerCase().trim();
    if (!validateEmail(emailLower)) {
      set({ isLoading: false, error: 'Please enter a valid email address.' });
      return false;
    }

    const { valid, errors } = validatePassword(password);
    if (!valid) {
      set({ isLoading: false, error: errors[0] });
      return false;
    }

    const users = getStoredUsers();
    if (users.find((u) => u.email === emailLower)) {
      set({ isLoading: false, error: 'An account with this email already exists.' });
      return false;
    }

    const now = new Date().toISOString();
    const currentSession = generateMockSession(true);
    const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);

    const storedUser: StoredUser = {
      id: generateId(),
      email: emailLower,
      displayName: displayName.trim(),
      username,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      emailVerified: false,
      twoFactorEnabled: false,
      createdAt: now,
      lastLoginAt: now,
      role: 'user',
      sessions: [currentSession],
      loginHistory: [{ date: now, ip: currentSession.ip, device: currentSession.device, success: true }],
      passwordHash: simpleHash(password),
      verificationCode: generateVerificationCode(),
      verificationExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      failedAttempts: 0,
    };

    users.push(storedUser);
    saveStoredUsers(users);

    const user = stripSensitive(storedUser);
    persistAuth(user);
    set({ user, isAuthenticated: true, isLoading: false, error: null });

    // Log verification code for dev convenience
    console.info(`[DebateForge Auth] Verification code for ${emailLower}: ${storedUser.verificationCode}`);

    return true;
  },

  signIn: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    await delay(600 + Math.random() * 600);

    const emailLower = email.toLowerCase().trim();
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.email === emailLower);

    if (idx === -1) {
      set({ isLoading: false, error: 'Invalid email or password.' });
      return false;
    }

    const storedUser = users[idx];

    // Check lock
    if (storedUser.lockedUntil) {
      const lockTime = new Date(storedUser.lockedUntil).getTime();
      if (Date.now() < lockTime) {
        const remaining = Math.ceil((lockTime - Date.now()) / 1000);
        set({ isLoading: false, error: `Account locked. Try again in ${remaining} seconds.` });
        return false;
      }
      // Lock expired
      storedUser.failedAttempts = 0;
      storedUser.lockedUntil = undefined;
    }

    if (storedUser.passwordHash !== simpleHash(password)) {
      storedUser.failedAttempts += 1;
      const now = new Date().toISOString();
      storedUser.loginHistory = [
        { date: now, ip: '192.168.1.x', device: 'Desktop', success: false },
        ...storedUser.loginHistory,
      ].slice(0, 20);

      if (storedUser.failedAttempts >= 5) {
        storedUser.lockedUntil = new Date(Date.now() + 30 * 1000).toISOString();
        saveStoredUsers(users);
        set({ isLoading: false, error: 'Too many failed attempts. Account locked for 30 seconds.' });
        return false;
      }

      saveStoredUsers(users);
      set({ isLoading: false, error: `Invalid email or password. ${5 - storedUser.failedAttempts} attempts remaining.` });
      return false;
    }

    // Success
    storedUser.failedAttempts = 0;
    storedUser.lockedUntil = undefined;
    const now = new Date().toISOString();
    storedUser.lastLoginAt = now;

    const currentSession = generateMockSession(true);
    storedUser.sessions = [currentSession, ...storedUser.sessions.filter((s) => !s.isCurrent).slice(0, 4)];
    storedUser.loginHistory = [
      { date: now, ip: currentSession.ip, device: currentSession.device, success: true },
      ...storedUser.loginHistory,
    ].slice(0, 20);

    saveStoredUsers(users);

    const user = stripSensitive(storedUser);
    persistAuth(user);
    set({ user, isAuthenticated: true, isLoading: false, error: null });
    return true;
  },

  signOut: () => {
    persistAuth(null);
    set({ user: null, isAuthenticated: false, error: null });
  },

  verifyEmail: (code: string): boolean => {
    const { user } = get();
    if (!user) return false;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return false;

    const storedUser = users[idx];
    if (storedUser.verificationCode !== code) {
      set({ error: 'Invalid verification code.' });
      return false;
    }

    if (storedUser.verificationExpiry && new Date(storedUser.verificationExpiry).getTime() < Date.now()) {
      set({ error: 'Verification code has expired. Please request a new one.' });
      return false;
    }

    storedUser.emailVerified = true;
    storedUser.verificationCode = undefined;
    storedUser.verificationExpiry = undefined;
    saveStoredUsers(users);

    const updated = stripSensitive(storedUser);
    set({ user: updated, error: null });
    return true;
  },

  resendVerification: () => {
    const { user } = get();
    if (!user) return;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return;

    const code = generateVerificationCode();
    users[idx].verificationCode = code;
    users[idx].verificationExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    saveStoredUsers(users);

    console.info(`[DebateForge Auth] New verification code for ${user.email}: ${code}`);
  },

  forgotPassword: async (email: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    await delay(1000);

    const emailLower = email.toLowerCase().trim();
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.email === emailLower);

    // Always return true for security (don't reveal if email exists)
    if (idx === -1) {
      set({ isLoading: false });
      return true;
    }

    const token = generateId() + generateId();
    users[idx].resetToken = token;
    users[idx].resetExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    saveStoredUsers(users);

    console.info(`[DebateForge Auth] Reset token for ${emailLower}: ${token}`);
    set({ isLoading: false });
    return true;
  },

  resetPassword: (token: string, newPassword: string): boolean => {
    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      set({ error: errors[0] });
      return false;
    }

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.resetToken === token);
    if (idx === -1) {
      set({ error: 'Invalid or expired reset link.' });
      return false;
    }

    if (users[idx].resetExpiry && new Date(users[idx].resetExpiry!).getTime() < Date.now()) {
      set({ error: 'Reset link has expired. Please request a new one.' });
      return false;
    }

    users[idx].passwordHash = simpleHash(newPassword);
    users[idx].resetToken = undefined;
    users[idx].resetExpiry = undefined;
    users[idx].failedAttempts = 0;
    users[idx].lockedUntil = undefined;
    saveStoredUsers(users);

    set({ error: null });
    return true;
  },

  updateProfile: (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return;

    const safeUpdates = { ...updates };
    delete (safeUpdates as any).id;
    delete (safeUpdates as any).email;
    delete (safeUpdates as any).role;

    Object.assign(users[idx], safeUpdates);
    saveStoredUsers(users);

    const updated = stripSensitive(users[idx]);
    set({ user: updated });
  },

  changePassword: (current: string, newPass: string): boolean => {
    const { user } = get();
    if (!user) return false;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return false;

    if (users[idx].passwordHash !== simpleHash(current)) {
      set({ error: 'Current password is incorrect.' });
      return false;
    }

    const { valid, errors } = validatePassword(newPass);
    if (!valid) {
      set({ error: errors[0] });
      return false;
    }

    users[idx].passwordHash = simpleHash(newPass);
    saveStoredUsers(users);
    set({ error: null });
    return true;
  },

  enable2FA: (): string => {
    const { user } = get();
    if (!user) return '';

    const secret = generate2FASecret();
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return '';

    users[idx].twoFactorSecret = secret;
    saveStoredUsers(users);

    return secret;
  },

  verify2FA: (code: string): boolean => {
    const { user } = get();
    if (!user) return false;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return false;

    // Simulate TOTP verification: accept any 6-digit code for local auth
    if (!/^\d{6}$/.test(code)) {
      set({ error: 'Please enter a valid 6-digit code.' });
      return false;
    }

    // For local simulation, accept the code
    const backupCodes = generateBackupCodes();
    users[idx].twoFactorEnabled = true;
    users[idx].backupCodes = backupCodes;
    saveStoredUsers(users);

    const updated = stripSensitive(users[idx]);
    set({ user: updated, error: null });
    return true;
  },

  disable2FA: (password: string, code: string): boolean => {
    const { user } = get();
    if (!user) return false;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return false;

    if (users[idx].passwordHash !== simpleHash(password)) {
      set({ error: 'Incorrect password.' });
      return false;
    }

    if (!/^\d{6}$/.test(code)) {
      set({ error: 'Please enter a valid 6-digit code.' });
      return false;
    }

    users[idx].twoFactorEnabled = false;
    users[idx].twoFactorSecret = undefined;
    users[idx].backupCodes = undefined;
    saveStoredUsers(users);

    const updated = stripSensitive(users[idx]);
    set({ user: updated, error: null });
    return true;
  },

  deleteAccount: (password: string, confirmation: string): boolean => {
    const { user } = get();
    if (!user) return false;

    if (confirmation !== 'DELETE') {
      set({ error: 'Please type DELETE to confirm.' });
      return false;
    }

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return false;

    if (users[idx].passwordHash !== simpleHash(password)) {
      set({ error: 'Incorrect password.' });
      return false;
    }

    users.splice(idx, 1);
    saveStoredUsers(users);
    persistAuth(null);
    set({ user: null, isAuthenticated: false, error: null });
    return true;
  },

  revokeSession: (sessionId: string) => {
    const { user } = get();
    if (!user) return;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return;

    users[idx].sessions = users[idx].sessions.filter((s) => s.id !== sessionId);
    saveStoredUsers(users);

    const updated = stripSensitive(users[idx]);
    set({ user: updated });
  },

  revokeAllSessions: () => {
    const { user } = get();
    if (!user) return;

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return;

    const currentSession = users[idx].sessions.find((s) => s.isCurrent);
    users[idx].sessions = currentSession ? [currentSession] : [];
    saveStoredUsers(users);

    const updated = stripSensitive(users[idx]);
    set({ user: updated });
  },

  clearError: () => {
    set({ error: null });
  },

  loadPersistedAuth: () => {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      if (!data) return;
      const { userId } = JSON.parse(data);
      const users = getStoredUsers();
      const stored = users.find((u) => u.id === userId);
      if (stored) {
        const user = stripSensitive(stored);
        set({ user, isAuthenticated: true });
      }
    } catch {
      // ignore
    }
  },
}));

export default useAuthStore;
