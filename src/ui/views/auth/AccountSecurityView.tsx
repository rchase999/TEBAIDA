import React, { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import {
  Shield, ShieldCheck, ShieldOff, Lock, Eye, EyeOff,
  Loader2, AlertCircle, Check, X, Monitor, Smartphone,
  Tablet, Globe, Clock, Trash2, LogOut, AlertTriangle,
  ChevronRight, CheckCircle, XCircle, Key,
} from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';
import type { Session, LoginEntry } from '../../auth/authStore';

// ---------------------------------------------------------------------------
// Password strength (shared)
// ---------------------------------------------------------------------------

interface PasswordCheck {
  label: string;
  test: (p: string) => boolean;
}

const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'At least one number', test: (p) => /[0-9]/.test(p) },
  { label: 'At least one special character', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
];

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '', bgColor: '' };
  const passed = PASSWORD_CHECKS.filter((c) => c.test(password)).length;
  if (passed <= 1) return { score: 20, label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500' };
  if (passed <= 2) return { score: 40, label: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-500' };
  if (passed <= 3) return { score: 60, label: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-500' };
  if (passed <= 4) return { score: 80, label: 'Strong', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
  return { score: 100, label: 'Very Strong', color: 'text-emerald-500', bgColor: 'bg-emerald-500' };
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Device icon helper
// ---------------------------------------------------------------------------

function getDeviceIcon(device: string) {
  const d = device.toLowerCase();
  if (d.includes('phone') || d.includes('iphone') || d.includes('android')) return Smartphone;
  if (d.includes('tablet') || d.includes('ipad')) return Tablet;
  return Monitor;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-5',
        danger
          ? 'border-red-200 dark:border-red-800/40'
          : 'border-gray-200 dark:border-surface-dark-3',
      )}
    >
      <h3 className={clsx(
        'text-base font-semibold',
        danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white',
      )}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AccountSecurityView() {
  const {
    user,
    changePassword,
    enable2FA,
    disable2FA,
    revokeSession,
    revokeAllSessions,
    deleteAccount,
    signOut,
    error,
    clearError,
  } = useAuthStore();

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA disable
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [disable2FACode, setDisable2FACode] = useState('');

  // Delete account
  const [deleteStep, setDeleteStep] = useState(0); // 0=hidden, 1=confirm, 2=password
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const allChecksPassed = useMemo(() => PASSWORD_CHECKS.every((c) => c.test(newPassword)), [newPassword]);

  // Change password handler
  const handleChangePassword = useCallback(async () => {
    if (!allChecksPassed || newPassword !== confirmPassword) return;
    clearError();
    setPasswordLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const success = changePassword(currentPassword, newPassword);
    if (success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
    setPasswordLoading(false);
  }, [currentPassword, newPassword, confirmPassword, allChecksPassed, changePassword, clearError]);

  // Disable 2FA handler
  const handleDisable2FA = useCallback(async () => {
    clearError();
    const success = disable2FA(disable2FAPassword, disable2FACode);
    if (success) {
      setDisabling2FA(false);
      setDisable2FAPassword('');
      setDisable2FACode('');
    }
  }, [disable2FAPassword, disable2FACode, disable2FA, clearError]);

  // Navigate to 2FA setup
  const navigateTo = useCallback((view: string) => {
    clearError();
    window.dispatchEvent(new CustomEvent('auth-navigate', { detail: view }));
  }, [clearError]);

  // Delete account
  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE') return;
    clearError();
    setDeleteLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const success = deleteAccount(deletePassword, deleteConfirmText);
    if (success) {
      // Account deleted, user signed out
    }
    setDeleteLoading(false);
  }, [deleteConfirmText, deletePassword, deleteAccount, clearError]);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Please sign in to access security settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Security</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your password, two-factor authentication, and active sessions
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===== Change Password ===== */}
      <Section title="Change Password" description="Update your password to keep your account secure">
        <div className="space-y-3">
          {/* Current password */}
          <div>
            <label htmlFor="sec-current-pw" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="sec-current-pw"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={clsx(
                  'block w-full rounded-lg border bg-white py-2 pl-10 pr-10 text-sm text-gray-900 shadow-sm transition-colors',
                  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                  'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label htmlFor="sec-new-pw" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="sec-new-pw"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={clsx(
                  'block w-full rounded-lg border bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors',
                  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                  'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                )}
              />
            </div>

            {/* Strength meter */}
            {newPassword && (
              <div className="mt-2 space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-surface-dark-3 overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all duration-500', strength.bgColor)}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <span className={clsx('text-xs font-medium', strength.color)}>{strength.label}</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {PASSWORD_CHECKS.map((check) => {
                    const passed = check.test(newPassword);
                    return (
                      <li key={check.label} className="flex items-center gap-1.5 text-xs">
                        {passed ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                        )}
                        <span className={passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}>
                          {check.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="sec-confirm-pw" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="sec-confirm-pw"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={clsx(
                  'block w-full rounded-lg border bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors',
                  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500'
                    : 'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                )}
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">Passwords do not match</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={!allChecksPassed || newPassword !== confirmPassword || !currentPassword || passwordLoading}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all',
                allChecksPassed && newPassword === confirmPassword && currentPassword && !passwordLoading
                  ? 'bg-forge-600 hover:bg-forge-700'
                  : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
              )}
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </button>
            {passwordSuccess && (
              <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                Password updated!
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* ===== Two-Factor Authentication ===== */}
      <Section
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-surface-dark-2">
          <div className="flex items-center gap-3">
            {user.twoFactorEnabled ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-surface-dark-3">
                <ShieldOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Authenticator App
                </span>
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                    user.twoFactorEnabled
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-200 text-gray-600 dark:bg-surface-dark-3 dark:text-gray-400',
                  )}
                >
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {user.twoFactorEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Protect your account with a second verification step'}
              </p>
            </div>
          </div>

          {user.twoFactorEnabled ? (
            <button
              type="button"
              onClick={() => { setDisabling2FA(true); clearError(); }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Disable
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateTo('2fa-setup')}
              className="flex items-center gap-1 rounded-lg bg-forge-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-forge-700"
            >
              Set Up
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Disable 2FA form */}
        {disabling2FA && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800/40 dark:bg-red-900/10 animate-fade-in">
            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-3">
              Enter your password and a 2FA code to disable two-factor authentication
            </p>
            <div className="space-y-2">
              <input
                type="password"
                value={disable2FAPassword}
                onChange={(e) => setDisable2FAPassword(e.target.value)}
                placeholder="Password"
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-surface-dark-2 dark:text-gray-100 dark:border-surface-dark-4"
              />
              <input
                type="text"
                value={disable2FACode}
                onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-surface-dark-2 dark:text-gray-100 dark:border-surface-dark-4"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  disabled={!disable2FAPassword || disable2FACode.length !== 6}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disable 2FA
                </button>
                <button
                  type="button"
                  onClick={() => { setDisabling2FA(false); setDisable2FAPassword(''); setDisable2FACode(''); clearError(); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ===== Active Sessions ===== */}
      <Section title="Active Sessions" description="Devices that are currently signed in to your account">
        <div className="space-y-2">
          {user.sessions.map((session: Session) => {
            const DeviceIcon = getDeviceIcon(session.device);
            return (
              <div
                key={session.id}
                className={clsx(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  session.isCurrent
                    ? 'border-forge-200 bg-forge-50/50 dark:border-forge-800/40 dark:bg-forge-900/10'
                    : 'border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-2',
                )}
              >
                <div
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    session.isCurrent
                      ? 'bg-forge-100 dark:bg-forge-900/30'
                      : 'bg-gray-100 dark:bg-surface-dark-3',
                  )}
                >
                  <DeviceIcon
                    className={clsx(
                      'h-4.5 w-4.5',
                      session.isCurrent
                        ? 'text-forge-600 dark:text-forge-400'
                        : 'text-gray-500 dark:text-gray-400',
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.browser} - {session.device}
                    </span>
                    {session.isCurrent && (
                      <span className="inline-flex items-center rounded-full bg-forge-100 px-2 py-0.5 text-[10px] font-semibold text-forge-700 dark:bg-forge-900/30 dark:text-forge-400">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {session.ip}
                    </span>
                    <span>{session.location}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {relativeTime(session.lastActive)}
                    </span>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => revokeSession(session.id)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-surface-dark-4 dark:text-gray-400 dark:hover:border-red-800/50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}

          {user.sessions.filter((s) => !s.isCurrent).length > 0 && (
            <button
              type="button"
              onClick={revokeAllSessions}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-surface-dark-4 dark:text-gray-400 dark:hover:border-red-800/50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Log out all other devices
            </button>
          )}
        </div>
      </Section>

      {/* ===== Login History ===== */}
      <Section title="Login History" description="Recent sign-in activity on your account">
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-surface-dark-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-dark-2">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">IP</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Device</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-3">
              {user.loginHistory.slice(0, 20).map((entry: LoginEntry, i: number) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 dark:hover:bg-surface-dark-2 transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {entry.ip}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {entry.device}
                  </td>
                  <td className="px-3 py-2">
                    {entry.success ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="h-3 w-3" />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {user.loginHistory.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No login history yet
            </div>
          )}
        </div>
      </Section>

      {/* ===== Danger Zone ===== */}
      <Section title="Danger Zone" description="Irreversible actions" danger>
        {deleteStep === 0 && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setDeleteStep(1); clearError(); }}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        )}

        {/* Delete confirmation steps */}
        {deleteStep >= 1 && (
          <div className="animate-fade-in space-y-4">
            {/* Step 1: Consequences */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/10">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    This action cannot be undone
                  </p>
                  <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                    Deleting your account will:
                  </p>
                </div>
              </div>
              <ul className="ml-7 space-y-1 text-xs text-red-700 dark:text-red-400">
                <li className="flex items-center gap-1.5">
                  <X className="h-3 w-3 shrink-0" />
                  Remove all your debate history and data
                </li>
                <li className="flex items-center gap-1.5">
                  <X className="h-3 w-3 shrink-0" />
                  Delete your profile and settings
                </li>
                <li className="flex items-center gap-1.5">
                  <X className="h-3 w-3 shrink-0" />
                  Sign you out of all devices
                </li>
                <li className="flex items-center gap-1.5">
                  <X className="h-3 w-3 shrink-0" />
                  This action has a 30-day grace period before permanent deletion
                </li>
              </ul>
            </div>

            {/* Type DELETE */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="block w-full rounded-lg border border-red-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-surface-dark-2 dark:text-gray-100 dark:border-red-800/50"
              />
            </div>

            {/* Password */}
            {deleteConfirmText === 'DELETE' && (
              <div className="animate-fade-in">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter your password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="block w-full rounded-lg border border-red-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-surface-dark-2 dark:text-gray-100 dark:border-red-800/50"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || !deletePassword || deleteLoading}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all',
                  deleteConfirmText === 'DELETE' && deletePassword && !deleteLoading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
                )}
              >
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete My Account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); setDeletePassword(''); clearError(); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
