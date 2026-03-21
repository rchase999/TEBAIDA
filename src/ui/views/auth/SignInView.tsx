import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  Swords, Mail, Lock, Eye, EyeOff, Loader2,
  AlertCircle, ArrowRight, Chrome, Github, Apple, Clock,
} from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

export default function SignInView() {
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Rate limiting UI
  const [lockCountdown, setLockCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse lock from error
  useEffect(() => {
    if (error && error.includes('locked for')) {
      const match = error.match(/(\d+)\s*seconds/);
      if (match) {
        const seconds = parseInt(match[1], 10);
        setLockCountdown(seconds);

        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setLockCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [error]);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading && lockCountdown === 0;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    clearError();
    await signIn(email, password);
  }, [canSubmit, email, password, signIn, clearError]);

  const handleOAuthClick = useCallback((provider: string) => {
    setToast(`${provider} sign-in coming soon!`);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [canSubmit, handleSubmit]);

  const navigateTo = useCallback((view: string) => {
    clearError();
    window.dispatchEvent(new CustomEvent('auth-navigate', { detail: view }));
  }, [clearError]);

  return (
    <div className="flex min-h-full items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg shadow-forge-500/25">
            <Swords className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your DebateForge account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-surface-dark-3 dark:bg-surface-dark-1">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Lock countdown */}
            {lockCountdown > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20 animate-fade-in">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Account temporarily locked</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    0:{lockCountdown.toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="signin-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className={clsx(
                    'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                    'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                  )}
                  aria-label="Email address"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signin-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={clsx(
                    'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-sm transition-colors',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                    'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                  )}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-forge-600 focus:ring-forge-500 dark:border-surface-dark-4 dark:bg-surface-dark-2"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => navigateTo('forgot-password')}
                className="text-sm font-medium text-forge-600 hover:text-forge-500 dark:text-forge-400"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={clsx(
                'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
                canSubmit
                  ? 'bg-forge-600 hover:bg-forge-700 active:bg-forge-800'
                  : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
              )}
              aria-label="Sign in"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-surface-dark-3" />
            <span className="text-xs text-gray-400 dark:text-gray-500">or continue with</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-surface-dark-3" />
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Chrome, label: 'Google', color: 'hover:border-red-400 hover:text-red-500' },
              { icon: Github, label: 'GitHub', color: 'hover:border-gray-600 hover:text-gray-700 dark:hover:text-white' },
              { icon: Apple, label: 'Apple', color: 'hover:border-gray-800 hover:text-gray-900 dark:hover:text-white' },
            ].map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleOAuthClick(label)}
                className={clsx(
                  'flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200',
                  'dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:text-gray-300',
                  color,
                )}
                aria-label={`Sign in with ${label}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign up link */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigateTo('signup')}
            className="font-semibold text-forge-600 hover:text-forge-500 dark:text-forge-400"
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-lg dark:border-surface-dark-3 dark:bg-surface-dark-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
