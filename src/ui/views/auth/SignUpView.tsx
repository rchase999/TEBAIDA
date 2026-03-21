import React, { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import {
  Swords, Mail, Lock, Eye, EyeOff, User, Loader2,
  Check, X, AlertCircle, ArrowRight, Chrome, Github, Apple,
} from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

// ---------------------------------------------------------------------------
// Password strength helpers
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

function getPasswordStrength(password: string): { score: number; label: string; color: string; bgColor: string } {
  if (!password) return { score: 0, label: '', color: '', bgColor: '' };
  const passed = PASSWORD_CHECKS.filter((c) => c.test(password)).length;
  if (passed <= 1) return { score: 20, label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500' };
  if (passed <= 2) return { score: 40, label: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-500' };
  if (passed <= 3) return { score: 60, label: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-500' };
  if (passed <= 4) return { score: 80, label: 'Strong', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
  return { score: 100, label: 'Very Strong', color: 'text-emerald-500', bgColor: 'bg-emerald-500' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignUpView() {
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const allChecksPassed = useMemo(() => PASSWORD_CHECKS.every((c) => c.test(password)), [password]);

  const canSubmit = emailValid && allChecksPassed && displayName.trim().length > 0 && agreed && !isLoading;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    clearError();
    await signUp(email, password, displayName);
  }, [canSubmit, email, password, displayName, signUp, clearError]);

  const handleOAuthClick = useCallback((provider: string) => {
    setToast(`${provider} sign-in coming soon!`);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [canSubmit, handleSubmit]);

  return (
    <div className="flex min-h-full items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg shadow-forge-500/25">
            <Swords className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Join DebateForge and start debating</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-surface-dark-3 dark:bg-surface-dark-1">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Display Name */}
            <div>
              <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className={clsx(
                    'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                    'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                  )}
                  aria-label="Display name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (!emailTouched) setEmailTouched(true); }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={clsx(
                    'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                    emailTouched && email && !emailValid
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500'
                      : 'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                  )}
                  aria-label="Email address"
                  aria-invalid={emailTouched && !emailValid ? true : undefined}
                />
              </div>
              {emailTouched && email && !emailValid && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">Please enter a valid email address</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

              {/* Strength meter */}
              {password && (
                <div className="mt-2 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-surface-dark-3 overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all duration-500', strength.bgColor)}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <span className={clsx('text-xs font-medium', strength.color)}>{strength.label}</span>
                  </div>

                  {/* Requirements checklist */}
                  <ul className="space-y-1">
                    {PASSWORD_CHECKS.map((check) => {
                      const passed = check.test(password);
                      return (
                        <li key={check.label} className="flex items-center gap-2 text-xs">
                          {passed ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
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

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                id="signup-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-forge-600 focus:ring-forge-500 dark:border-surface-dark-4 dark:bg-surface-dark-2"
              />
              <label htmlFor="signup-terms" className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => handleOAuthClick('Terms of Service')}
                  className="font-medium text-forge-600 hover:text-forge-500 dark:text-forge-400"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => handleOAuthClick('Privacy Policy')}
                  className="font-medium text-forge-600 hover:text-forge-500 dark:text-forge-400"
                >
                  Privacy Policy
                </button>
              </label>
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
              aria-label="Create account"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Account
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
                aria-label={`Sign up with ${label}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              // Navigate to sign in — this view switch is handled by the parent
              clearError();
              window.dispatchEvent(new CustomEvent('auth-navigate', { detail: 'signin' }));
            }}
            className="font-semibold text-forge-600 hover:text-forge-500 dark:text-forge-400"
          >
            Sign in
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
