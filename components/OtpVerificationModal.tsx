import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalShell, ModalHeader, primaryButtonClassName } from './ui';
import { ShieldCheck, RotateCcw, CheckCircle2, Mail } from 'lucide-react';
import { api } from '../services/api';

interface OtpVerificationModalProps {
  open: boolean;
  email: string;
  onVerified: (user: any) => void;
  onClose?: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  open, email, onVerified, onClose,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [verified, setVerified] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 min
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on open
  useEffect(() => {
    if (open && !verified) {
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
      setOtp(Array(6).fill(''));
      setError(null);
      setVerified(false);
      setExpirySeconds(600);
      setResendCooldown(30);
    }
  }, [open]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Expiry countdown
  useEffect(() => {
    if (!open || verified || expirySeconds <= 0) return;
    const timer = setInterval(() => setExpirySeconds((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [open, verified, expirySeconds]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) handleVerify(pasted);
  };

  const handleVerify = useCallback(async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.verifyOtp(email, code);
      setVerified(true);
      setTimeout(() => onVerified(result.user), 1500);
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
      setOtp(Array(6).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [email, loading, onVerified]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setResendCooldown(60); // Lock immediately to prevent double-clicks
    setResendSuccess(false);
    setError(null);
    try {
      await api.resendOtp(email);
      setExpirySeconds(600);
      setOtp(Array(6).fill(''));
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP');
      setResendCooldown(10); // Short cooldown on error
    } finally {
      setResending(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <ModalShell
      open={open}
      onClose={onClose || (() => {})}
      showCloseButton={false}
      closeOnBackdropClick={false}
      maxWidthClassName="max-w-md"
    >
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {verified ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
              >
                <CheckCircle2 size={40} className="text-emerald-500" />
              </motion.div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Email Verified!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your email has been verified successfully. Setting up your account...
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ModalHeader
                title="Verify Your Email"
                description={`We've sent a 6-digit code to`}
                icon={<ShieldCheck size={22} />}
                tone="info"
                eyebrow="Email Verification"
                align="center"
              />

              <div className="text-center mt-1 mb-6">
                <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
                  <Mail size={14} className="text-emerald-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{email}</span>
                </div>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <motion.input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    whileFocus={{ scale: 1.08 }}
                    className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all duration-200 outline-none
                      ${digit
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                      }
                      focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30`}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300 text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Timer */}
              <div className="text-center mb-5">
                {expirySeconds > 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Code expires in <span className="font-bold text-slate-600 dark:text-slate-300">{formatTime(expirySeconds)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-rose-500 font-bold">Code expired. Please resend.</p>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={() => handleVerify(otp.join(''))}
                disabled={loading || otp.join('').length !== 6}
                className={`w-full ${primaryButtonClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Verifying...
                  </span>
                ) : (
                  'Verify Email'
                )}
              </button>

              {/* Resend success confirmation */}
              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 text-center"
                >
                  ✓ New OTP sent to your email! Check your inbox (and spam folder).
                </motion.div>
              )}

              {/* Resend */}
              <div className="text-center mt-4">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                >
                  {resending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-3 h-3 border-2 border-emerald-300/30 border-t-emerald-500 rounded-full"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={12} />
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Didn't receive it? Resend OTP"}
                    </>
                  )}
                </button>
              </div>

              {/* Cancel / Sign Out */}
              {onClose && (
                <div className="text-center mt-5 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  <button
                    onClick={onClose}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors"
                  >
                    Cancel and Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalShell>
  );
};
