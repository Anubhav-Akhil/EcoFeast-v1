import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export const surfaceCardClassName =
  'rounded-[28px] border border-gray-200/70 bg-slate-50/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-dark-900/95 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]';

export const fieldLabelClassName =
  'mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400';

export const inputClassName =
  'w-full rounded-2xl border border-slate-200/80 bg-slate-50/95 px-4 py-3.5 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-dark-700 dark:bg-dark-800/90 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/15';

export const inputCompactClassName =
  'w-full rounded-xl border border-slate-200/80 bg-slate-50/95 px-3.5 py-2.5 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-dark-700 dark:bg-dark-800/90 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/15';

export const selectClassName = `${inputClassName} appearance-none`;
export const selectCompactClassName = `${inputCompactClassName} appearance-none`;
export const textareaClassName = `${inputClassName} min-h-[120px] resize-y`;

export const helperTextClassName = 'mt-2 text-xs text-slate-500 dark:text-gray-400';
export const errorTextClassName = 'mt-2 text-xs font-medium text-rose-500 dark:text-rose-400';

export const primaryButtonClassName =
  'inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(22,163,74,0.22)] transition-all hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-[0_16px_32px_rgba(22,163,74,0.18)]';

export const secondaryButtonClassName =
  'inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100/90 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-slate-300/40 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-200 dark:hover:bg-dark-700';

export const destructiveButtonClassName =
  'inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(225,29,72,0.2)] transition-all hover:-translate-y-0.5 hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60';

export const subtleButtonClassName =
  'inline-flex items-center justify-center rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300/30 dark:text-gray-400 dark:hover:text-gray-200';

const toneClasses = {
  success: 'bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/15 dark:bg-emerald-500/18 dark:text-emerald-300',
  warning: 'bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/15 dark:bg-amber-500/18 dark:text-amber-300',
  danger: 'bg-rose-500/12 text-rose-600 ring-1 ring-rose-500/15 dark:bg-rose-500/18 dark:text-rose-300',
  info: 'bg-sky-500/12 text-sky-600 ring-1 ring-sky-500/15 dark:bg-sky-500/18 dark:text-sky-300',
  neutral: 'bg-slate-500/12 text-slate-700 ring-1 ring-slate-500/10 dark:bg-slate-500/18 dark:text-slate-200',
};

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  children,
  maxWidthClassName = 'max-w-md',
  panelClassName = '',
  contentClassName = 'p-6 sm:p-7',
  showCloseButton = true,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.section
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className={`relative w-full ${maxWidthClassName} overflow-hidden ${surfaceCardClassName} ${panelClassName}`}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/90 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300/40 dark:bg-dark-800 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-white"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            )}
            <div className={contentClassName}>{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ModalHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tone?: keyof typeof toneClasses;
  eyebrow?: string;
  align?: 'left' | 'center';
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  description,
  icon,
  tone = 'neutral',
  eyebrow,
  align = 'left',
}) => {
  const centered = align === 'center';

  return (
    <div className={centered ? 'text-center' : ''}>
      {eyebrow && (
        <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-gray-500 ${centered ? 'text-center' : ''}`}>
          {eyebrow}
        </p>
      )}
      {icon && (
        <div
          className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${toneClasses[tone]} ${centered ? '' : ''}`}
        >
          {icon}
        </div>
      )}
      <h3 className={`text-2xl font-bold tracking-tight text-slate-900 dark:text-white ${centered ? 'text-center' : ''}`}>
        {title}
      </h3>
      {description && (
        <p className={`mt-3 text-sm leading-6 text-slate-500 dark:text-gray-400 ${centered ? 'mx-auto max-w-sm text-center' : ''}`}>
          {description}
        </p>
      )}
    </div>
  );
};
