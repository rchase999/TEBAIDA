import React, { useState, useCallback, useRef, useMemo } from 'react';
import clsx from 'clsx';
import {
  Shield, Lock, Loader2, AlertCircle, ArrowLeft, HelpCircle, Key,
} from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

export default function TwoFactorVerifyView() {
  const { verify2FA, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<'code' | 'backup'>('code');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) newDigits[i] = pasted[i] || '';
        setDigits(newDigits);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
        return;
      }
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const code = useMemo(() => digits.join(''), [digits]);

  const handleVerify = useCallback(async () => {
    clearError();
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 800));

    if (mode === 'code') {
      if (code.length !== 6) {
        setIsVerifying(false);
        return;
      }
      verify2FA(code);
    } else {
      // For backup code, simulate verification
      if (backupCode.trim().length < 6) {
        setIsVerifying(false);
        return;
      }
      // In local mode, accept backup codes
      verify2FA('000000'); // Simulate with valid-format code
    }
    setIsVerifying(false);
  }, [mode, code, backupCode, verify2FA, clearError]);

  const navigateTo = useCallback((view: string) => {
    clearError();
    window.dispatchEvent(new CustomEvent('auth-navigate', { detail: view }));
  }, [clearError]);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-surface-dark-3 dark:bg-surface-dark-1">
          {mode === 'code' ? (
            <div className="animate-fade-in">
              {/* Icon */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 relative inline-flex">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forge-100 dark:bg-forge-900/30">
                    <Shield className="h-8 w-8 text-forge-600 dark:text-forge-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md dark:bg-surface-dark-1">
                    <Lock className="h-3.5 w-3.5 text-forge-600 dark:text-forge-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 6-digit code input */}
              <div className="flex justify-center gap-2 mb-6" role="group" aria-label="Authentication code">
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
                    autoFocus={i === 0}
                    className={clsx(
                      'h-14 w-11 rounded-xl border-2 bg-white text-center text-xl font-bold text-gray-900 shadow-sm transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'dark:bg-surface-dark-2 dark:text-white',
                      digit
                        ? 'border-forge-500 focus:border-forge-500 focus:ring-forge-500/30 dark:border-forge-500'
                        : 'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4',
                    )}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={code.length !== 6 || isVerifying}
                className={clsx(
                  'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2',
                  code.length === 6 && !isVerifying
                    ? 'bg-forge-600 hover:bg-forge-700 active:bg-forge-800'
                    : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
                )}
                aria-label="Verify"
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </button>

              {/* Backup code link */}
              <div className="mt-4 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('backup'); clearError(); }}
                  className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-forge-600 hover:text-forge-500 dark:text-forge-400"
                >
                  <Key className="h-3.5 w-3.5" />
                  Use a backup code
                </button>

                <button
                  type="button"
                  onClick={() => {/* help link */}}
                  className="flex w-full items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Lost your authenticator?
                </button>
              </div>

              {/* Back */}
              <button
                type="button"
                onClick={() => navigateTo('signin')}
                className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            </div>
          ) : (
            /* Backup code mode */
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Key className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Use a backup code
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter one of the backup codes you saved when setting up 2FA
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="backup-code" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Backup Code
                </label>
                <input
                  id="backup-code"
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  autoFocus
                  className={clsx(
                    'block w-full rounded-lg border bg-white py-2.5 px-3 text-sm text-center font-mono font-bold tracking-widest text-gray-900 shadow-sm transition-colors',
                    'placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500',
                    'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
                  )}
                  aria-label="Backup code"
                />
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={backupCode.trim().length < 6 || isVerifying}
                className={clsx(
                  'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
                  backupCode.trim().length >= 6 && !isVerifying
                    ? 'bg-forge-600 hover:bg-forge-700'
                    : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
                )}
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Backup Code'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('code'); setBackupCode(''); clearError(); }}
                className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-forge-600 hover:text-forge-500 dark:text-forge-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Use authenticator code instead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
