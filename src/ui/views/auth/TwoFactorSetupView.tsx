import React, { useState, useCallback, useRef, useMemo } from 'react';
import clsx from 'clsx';
import {
  Shield, ShieldCheck, Loader2, AlertCircle, ArrowRight, ArrowLeft,
  Check, Copy, Download, AlertTriangle, Key,
} from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

const STEPS = ['Introduction', 'Scan Code', 'Verify', 'Backup Codes'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  i < currentStep
                    ? 'bg-emerald-500 text-white'
                    : i === currentStep
                    ? 'bg-forge-600 text-white ring-4 ring-forge-500/20'
                    : 'bg-gray-200 text-gray-500 dark:bg-surface-dark-3 dark:text-gray-400',
                )}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={clsx(
                  'text-[10px] font-medium whitespace-nowrap',
                  i <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1 mt-[-18px] h-0.5 flex-1">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    i < currentStep ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-surface-dark-3',
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fake QR Code
// ---------------------------------------------------------------------------

function FakeQRCode() {
  const grid = useMemo(() => {
    const size = 21;
    const data: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      data[r] = [];
      for (let c = 0; c < size; c++) {
        // Finder patterns (three corners)
        const isFinderTL = r < 7 && c < 7;
        const isFinderTR = r < 7 && c >= size - 7;
        const isFinderBL = r >= size - 7 && c < 7;

        if (isFinderTL || isFinderTR || isFinderBL) {
          const lr = isFinderBL ? r - (size - 7) : r;
          const lc = isFinderTR ? c - (size - 7) : c;
          // Outer border
          if (lr === 0 || lr === 6 || lc === 0 || lc === 6) {
            data[r][c] = true;
          } else if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) {
            data[r][c] = true;
          } else {
            data[r][c] = false;
          }
        } else {
          data[r][c] = Math.random() > 0.5;
        }
      }
    }
    return data;
  }, []);

  return (
    <div className="inline-flex flex-col items-center rounded-xl border-2 border-gray-200 bg-white p-3 dark:border-surface-dark-3 dark:bg-white">
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(21, 6px)` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={clsx('h-1.5 w-1.5', cell ? 'bg-gray-900' : 'bg-white')}
            />
          )),
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TwoFactorSetupView() {
  const { enable2FA, verify2FA, user, error, clearError } = useAuthStore();

  const [step, setStep] = useState(0);
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleStartSetup = useCallback(() => {
    const s = enable2FA();
    setSecret(s);
    setStep(1);
  }, [enable2FA]);

  const handleScanned = useCallback(() => {
    setStep(2);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

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

  const code = digits.join('');

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return;
    clearError();
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 800));

    const success = verify2FA(code);
    if (success) {
      // Get backup codes from the stored user
      try {
        const data = localStorage.getItem('debateforge-users');
        if (data && user) {
          const users = JSON.parse(data);
          const stored = users.find((u: any) => u.id === user.id);
          if (stored?.backupCodes) {
            setBackupCodes(stored.backupCodes);
          }
        }
      } catch { /* ignore */ }
      setStep(3);
    }
    setIsVerifying(false);
  }, [code, verify2FA, clearError, user]);

  const handleCopySecret = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [secret]);

  const handleCopyBackupCodes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch { /* ignore */ }
  }, [backupCodes]);

  const handleDownloadBackupCodes = useCallback(() => {
    const content = `DebateForge Backup Codes\n${'='.repeat(30)}\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes in a safe place.\nEach code can only be used once.\n\n${backupCodes.map((c, i) => `${(i + 1).toString().padStart(2, ' ')}. ${c}`).join('\n')}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debateforge-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [backupCodes]);

  const navigateTo = useCallback((view: string) => {
    clearError();
    window.dispatchEvent(new CustomEvent('auth-navigate', { detail: view }));
  }, [clearError]);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-surface-dark-3 dark:bg-surface-dark-1">
          <StepIndicator currentStep={step} />

          {/* Step 0: Introduction */}
          {step === 0 && (
            <div className="animate-fade-in text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forge-100 dark:bg-forge-900/30">
                <Shield className="h-8 w-8 text-forge-600 dark:text-forge-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add an extra layer of security
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Two-factor authentication adds a second step to your sign-in process.
                In addition to your password, you'll need to enter a code from your authenticator app.
              </p>

              <div className="mt-6 space-y-3 text-left">
                {[
                  { icon: ShieldCheck, text: 'Protects against password breaches' },
                  { icon: Key, text: 'Uses industry-standard TOTP codes' },
                  { icon: Download, text: 'Backup codes for emergency access' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-surface-dark-2">
                    <Icon className="h-5 w-5 text-forge-500 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleStartSetup}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-forge-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forge-700"
              >
                Set Up 2FA
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo('security')}
                className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to security
              </button>
            </div>
          )}

          {/* Step 1: QR Code */}
          {step === 1 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Scan the QR code
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Open your authenticator app and scan this QR code
              </p>

              <div className="flex justify-center mb-4">
                <FakeQRCode />
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Or enter this key manually:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-mono font-bold text-gray-900 dark:bg-surface-dark-2 dark:text-white tracking-wider">
                    {secret.match(/.{1,4}/g)?.join(' ')}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className={clsx(
                      'rounded-lg p-1.5 transition-colors',
                      copied
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-surface-dark-2 dark:text-gray-400 dark:hover:text-gray-300',
                    )}
                    aria-label="Copy secret key"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScanned}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-forge-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forge-700"
              >
                I've scanned the code
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep(0)}
                className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          )}

          {/* Step 2: Verify */}
          {step === 2 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Enter verification code
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Enter the 6-digit code from your authenticator app
              </p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
                        ? 'border-forge-500 focus:border-forge-500 focus:ring-forge-500/30'
                        : 'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4',
                    )}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={code.length !== 6 || isVerifying}
                className={clsx(
                  'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200',
                  code.length === 6 && !isVerifying
                    ? 'bg-forge-600 hover:bg-forge-700'
                    : 'bg-gray-400 cursor-not-allowed dark:bg-surface-dark-3',
                )}
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enable'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setDigits(['', '', '', '', '', '']); clearError(); }}
                className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Save your backup codes
                </h2>
              </div>

              {/* Warning */}
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Save these codes now.</strong> They will only be shown once.
                  Use them to access your account if you lose your authenticator device.
                </p>
              </div>

              {/* Codes grid */}
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-surface-dark-3 dark:bg-surface-dark-2">
                {backupCodes.map((bcode, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-surface-dark-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 w-4">{i + 1}.</span>
                    <code className="text-sm font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                      {bcode}
                    </code>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className={clsx(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    copiedCodes
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-surface-dark-4 dark:text-gray-300 dark:hover:bg-surface-dark-2',
                  )}
                >
                  {copiedCodes ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedCodes ? 'Copied!' : 'Copy All'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('security')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-forge-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-forge-700"
              >
                <Check className="h-4 w-4" />
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
