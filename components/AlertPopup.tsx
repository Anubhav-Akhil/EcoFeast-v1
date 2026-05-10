import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ModalShell } from './ui';

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
    Icon: CheckCircle,
    topBar: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    label: 'Success',
  },
  error: {
    Icon: XCircle,
    topBar: 'from-rose-500 to-red-500',
    iconBg: 'bg-rose-50 dark:bg-rose-950/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeText: 'text-rose-600 dark:text-rose-400',
    btn: 'bg-rose-600 hover:bg-rose-500 text-white',
    label: 'Error',
  },
  warning: {
    Icon: AlertTriangle,
    topBar: 'from-amber-500 to-orange-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeText: 'text-amber-600 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-400 text-white',
    label: 'Warning',
  },
  info: {
    Icon: Info,
    topBar: 'from-sky-500 to-blue-500',
    iconBg: 'bg-sky-50 dark:bg-sky-950/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badgeText: 'text-sky-600 dark:text-sky-400',
    btn: 'bg-sky-600 hover:bg-sky-500 text-white',
    label: 'Info',
  },
};

export const AlertPopup: React.FC<AlertPopupProps> = ({ open, type, title, message, onClose }) => {
  const c = typeConfig[type];
  const Icon = c.Icon;

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClassName="max-w-sm" contentClassName="p-0">
      <div className="overflow-hidden rounded-3xl">
        {/* colour bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${c.topBar}`} />

        <div className="px-6 pt-6 pb-7">
          {/* close */}
          <div className="flex justify-end mb-4">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* icon + label */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
              <Icon size={22} className={c.iconColor} />
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${c.badgeText}`}>{c.label}</span>
          </div>

          {/* text */}
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>

          {/* action */}
          <button
            onClick={onClose}
            className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${c.btn}`}
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
