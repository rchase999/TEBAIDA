import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import {
  MailOpen, Loader2, AlertCircle, ArrowLeft, Check, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

export default function EmailVerificationView() {
  const { user, verifyEmail, resendVerification, error, clearError } = useAuthStore();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
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

  const handleDigitChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setDigits(newDigits);
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
        return;
      }
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const code = useMemo(() => digits.join(''), [digits]);
  const isComplete = code.length === 6;

  const handleVerify = useCallback(async () => {
    if (!isComplete) return;
    clearError();
    setIsVerifying(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const success = verifyEmail(code);
    if (success) {
      setVerified(true);
    }
    setIsVerifying(false);
  }, [isComplete, code, verifyEmail, clearError]);

  const handleResend = useCallback(() => {
    if (resendCooldown > 0) return;
    clearError();
    resendVerification();
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    startResendCooldown();
  }, [resendCooldown, resendVerification, clearError, startResendCooldown]);

  // Auto-submit on complete
  useEffect(() => {
    if (isComplete && !isVerifying && !verified && !error) {
      handleVerify();
    }
  }, [isComplete, isVerifying, verified, error, handleVerify]);

  const navigateTo = useCallback((view: string) => {
    clearError();
    window.dispatchEvent(new CustomEvent('auth-navigate', { detail: view }));
  }, [clearError]);

  const maskedEmail = useMemo(() => {
    if (!user?.email) return '';
    const [local, domain] = user.email.split('@');
    if (local.length <= 2) return user.email;
    return local[0] + '*'.repeat(Math.max(local.length - 2, 1)) + local[local.length - 1] + '@' + domain;
  }, [user?.email]);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-surface-dark-3 dark:bg-surface-dark-1">
          {!verified ? (
            <div className="animate-fade-in">
              {/* Animated envelope */}
              <div className="mx-auto mb-6 relative w-24 h-20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Envelope base */}
                    <div className="w-20 h-14 rounded-lg bg-gradient-to-b from-forge-400 to-forge-600 shadow-lg shadow-forge-500/25 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 flex justify-center">
                        <div
                          className="w-0 h-0"
                          style={{
                            borderLeft: '40px solid transparent',
                            borderRight: '40px solid transparent',
                            borderTop: '28px solid rgb(99 102 241)',
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                        <div
                          className="w-0 h-0"
                          style={{
                            borderLeft: '40px solid transparent',
                            borderRight: '40px solid transparent',
                            borderBottom: '20px solid rgb(79 70 229)',
                          }}
                        />
                      </div>
                    </div>
                    {/* Floating mail icon */}
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                      style={{ animation: 'float-mail 2s ease-in-out infinite' }}
                    >
                      <MailOpen className="h-8 w-8 text-forge-400 dark:text-forge-300" />
                    </div>
                  </div>
                </div>
              </div>

              <style>{`
                @keyframes float-mail {
                  0%, 100% { transform: translateX(-50%) translateY(0px); }
                  50% { transform: translateX(-50%) translateY(-8px); }
                }
              `}</style>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verify your email</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  We sent a 6-digit code to
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{maskedEmail}</p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 6-digit code input */}
              <div className="flex justify-center gap-2 mb-6" role="group" aria-label="Verification code">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={clsx(
                      'h-14 w-11 rounded-xl border-2 bg-white text-center text-xl font-bold text-gray-900 shadow-sm transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'dark:bg-surface-dark-2 dark:text-white',
                      digit
                        ? 'border-forge-500 focus:border-forge-500 focus:ring-forge-500/30 dark:border-forge-500'
                        : 'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                    )}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={!isComplete || isVerifying}
                className={clsx(
                  'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
                  isComplete && !isVerifying
                    ? 'bg-forge-600 hover:bg-forge-700 active:bg-forge-800'
                    : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
                )}
                aria-label="Verify code"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </button>

              {/* Resend */}
              <div className="mt-4 flex items-center justify-center gap-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={clsx(
                    'flex items-center gap-1 text-sm font-medium transition-colors',
                    resendCooldown > 0
                      ? 'text-gray-400 cursor-not-allowed dark:text-gray-500'
                      : 'text-forge-600 hover:text-forge-500 dark:text-forge-400',
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </button>
              </div>

              {/* Wrong email */}
              <button
                type="button"
                onClick={() => navigateTo('signup')}
                className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Wrong email? Go back
              </button>
            </div>
          ) : (
            /* Success state */
            <div className="animate-fade-in text-center py-4">
              <style>{`
                @keyframes success-circle {
                  0% { transform: scale(0); opacity: 0; }
                  50% { transform: scale(1.2); }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes success-check {
                  0% { stroke-dashoffset: 50; }
                  100% { stroke-dashoffset: 0; }
                }
              `}</style>

              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
                style={{ animation: 'success-circle 0.5s ease-out forwards' }}
              >
                <svg
                  className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline
                    points="20 6 9 17 4 12"
                    style={{
                      strokeDasharray: 50,
                      strokeDashoffset: 50,
                      animation: 'success-check 0.4s ease-out 0.4s forwards',
                    }}
                  />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email verified!</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your email has been successfully verified. You're all set!
              </p>

              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-forge-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forge-700"
              >
                <Check className="h-4 w-4" />
                Continue to DebateForge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
