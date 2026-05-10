import React from 'react';
import { ModalShell } from './ui';
import { motion } from 'framer-motion';

export type PopupType = 'success' | 'error' | 'warning' | 'info';

interface AlertPopupProps {
  open: boolean;
  type: PopupType;
  title: string;
  message: string;
  onClose: () => void;
}

interface SuccessPopupProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const typeConfig = {
  success: {
    emoji: '✅',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.25)',
    badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50',
    btn: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]',
    label: 'Success',
  },
  error: {
    emoji: '❌',
    gradient: 'from-rose-500 to-red-600',
    glow: 'rgba(244,63,94,0.25)',
    badge: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',
    btn: 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-[0_4px_20px_rgba(244,63,94,0.35)]',
    label: 'Error',
  },
  warning: {
    emoji: '⚠️',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.25)',
    badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50',
    btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_4px_20px_rgba(245,158,11,0.35)]',
    label: 'Warning',
  },
  info: {
    emoji: 'ℹ️',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'rgba(14,165,233,0.25)',
    badge: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/50',
    btn: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-[0_4px_20px_rgba(14,165,233,0.35)]',
    label: 'Info',
  },
};

export const AlertPopup: React.FC<AlertPopupProps> = ({ open, type, title, message, onClose }) => {
  const c = typeConfig[type];
  return (
    <ModalShell open={open} onClose={onClose} maxWidthClassName="max-w-sm" contentClassName="p-0">
      <div className="relative overflow-hidden rounded-3xl">
        {/* gradient top bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${c.gradient}`} />
        <div className="px-7 py-8 text-center space-y-5">
          {/* emoji icon with glow */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex justify-center"
          >
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `linear-gradient(135deg, ${c.glow}, transparent)`, boxShadow: `0 8px 32px ${c.glow}` }}
            >
              {c.emoji}
            </div>
          </motion.div>

          {/* badge label */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${c.badge}`}>
              {c.label}
            </span>
          </div>

          {/* text */}
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>

          {/* action button */}
          <button
            onClick={onClose}
            className={`w-full rounded-xl px-4 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${c.btn}`}
          >
            Got it
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export const SuccessPopup: React.FC<SuccessPopupProps> = ({ open, title, message, onClose }) => (
  <AlertPopup open={open} type="success" title={title} message={message} onClose={onClose} />
);
