import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import clsx from 'clsx';
import {
  Swords, Mail, Lock, Eye, EyeOff, Loader2,
  AlertCircle, ArrowLeft, ArrowRight, Check, X,
  Send, MailOpen, KeyRound, PartyPopper,
} from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

// ---------------------------------------------------------------------------
// Password strength (shared logic)
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
// Component
// ---------------------------------------------------------------------------

type Step = 'email' | 'sent' | 'reset' | 'success';

export default function ForgotPasswordView() {
  const { forgotPassword, resetPassword, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mock token for local flow
  const [resetToken, setResetToken] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const allChecksPassed = useMemo(() => PASSWORD_CHECKS.every((c) => c.test(password)), [password]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await forgotPassword(email);
    if (success) {
      // Generate a mock token for local flow
      const mockToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
      setResetToken(mockToken);
      setStep('sent');
      startResendCooldown();
    }
  }, [email, forgotPassword, clearError, startResendCooldown]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    await forgotPassword(email);
    startResendCooldown();
  }, [email, forgotPassword, resendCooldown, startResendCooldown]);

  const handleReset = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (password !== confirmPassword) {
      return;
    }
    // In local mode, we use the resetToken from localStorage store directly
    const success = resetPassword(resetToken, password);
    if (success) {
      setStep('success');
    }
  }, [password, confirmPassword, resetToken, resetPassword, clearError]);

  const navigateTo = useCallback((view: string) => {
    clearError();
    window.dispatchEvent(new CustomEvent('auth-navigate', { detail: view }));
  }, [clearError]);

  // Confetti particles for success step
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      size: 4 + Math.random() * 6,
      color: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#22c55e', '#eab308', '#3b82f6'][Math.floor(Math.random() * 7)],
    }));
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg shadow-forge-500/25">
            <Swords className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-surface-dark-3 dark:bg-surface-dark-1 relative overflow-hidden">

          {/* Step 1: Email input */}
          {step === 'email' && (
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forge-100 dark:bg-forge-900/30">
                  <KeyRound className="h-6 w-6 text-forge-600 dark:text-forge-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Forgot your password?</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendReset} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="forgot-email"
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

                <button
                  type="submit"
                  disabled={!email.trim() || isLoading}
                  className={clsx(
                    'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
                    email.trim() && !isLoading
                      ? 'bg-forge-600 hover:bg-forge-700 active:bg-forge-800'
                      : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
                  )}
                  aria-label="Send reset link"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigateTo('signin')}
                className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            </div>
          )}

          {/* Step 2: Email sent */}
          {step === 'sent' && (
            <div className="animate-fade-in text-center">
              {/* CSS Envelope art */}
              <div className="mx-auto mb-6 relative w-24 h-20">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-forge-400 to-forge-600 shadow-lg">
                  {/* Envelope body */}
                  <div className="absolute bottom-0 left-0 right-0 h-14 rounded-b-lg bg-gradient-to-b from-forge-500 to-forge-700" />
                  {/* Flap */}
                  <div
                    className="absolute top-0 left-0 right-0 h-10"
                    style={{
                      background: 'linear-gradient(135deg, transparent 46%, #6366f1 46%, #6366f1 54%, transparent 54%), linear-gradient(225deg, transparent 46%, #6366f1 46%, #6366f1 54%, transparent 54%)',
                      backgroundSize: '50% 100%',
                      backgroundPosition: 'left, right',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  {/* Mail icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pt-2">
                    <MailOpen className="h-8 w-8 text-white/90 animate-bounce" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check your email</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We sent a password reset link to
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{email}</p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => setStep('reset')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-forge-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forge-700"
                >
                  I have the code
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={clsx(
                    'flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                    resendCooldown > 0
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed dark:border-surface-dark-3 dark:text-gray-500'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2',
                  )}
                >
                  {resendCooldown > 0 ? (
                    <>Resend in {resendCooldown}s</>
                  ) : (
                    <>Resend email</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setEmail(''); }}
                  className="flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Try a different email
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New password */}
          {step === 'reset' && (
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forge-100 dark:bg-forge-900/30">
                  <Lock className="h-6 w-6 text-forge-600 dark:text-forge-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set new password</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your new password must be different from your previous one
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                {/* New password */}
                <div>
                  <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="reset-password"
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
                      aria-label="New password"
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

                {/* Confirm password */}
                <div>
                  <label htmlFor="reset-confirm" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="reset-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      className={clsx(
                        'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors',
                        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                        'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500'
                          : 'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                      )}
                      aria-label="Confirm password"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!allChecksPassed || password !== confirmPassword || !confirmPassword}
                  className={clsx(
                    'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
                    allChecksPassed && password === confirmPassword && confirmPassword
                      ? 'bg-forge-600 hover:bg-forge-700 active:bg-forge-800'
                      : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
                  )}
                  aria-label="Reset password"
                >
                  Reset Password
                </button>
              </form>

              <button
                type="button"
                onClick={() => setStep('sent')}
                className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="animate-fade-in text-center relative">
              {/* Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confettiParticles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute rounded-full opacity-0"
                    style={{
                      left: `${p.x}%`,
                      top: '-10px',
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
                    }}
                  />
                ))}
              </div>

              <style>{`
                @keyframes confetti-fall {
                  0% { opacity: 1; transform: translateY(0) rotate(0deg); }
                  100% { opacity: 0; transform: translateY(300px) rotate(720deg); }
                }
                @keyframes checkmark-draw {
                  0% { stroke-dashoffset: 50; }
                  100% { stroke-dashoffset: 0; }
                }
              `}</style>

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline
                    points="20 6 9 17 4 12"
                    style={{
                      strokeDasharray: 50,
                      strokeDashoffset: 50,
                      animation: 'checkmark-draw 0.5s ease-out 0.3s forwards',
                    }}
                  />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Password reset successfully!</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your password has been changed. You can now sign in with your new password.
              </p>

              <button
                type="button"
                onClick={() => navigateTo('signin')}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-forge-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forge-700"
              >
                Back to Sign In
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
