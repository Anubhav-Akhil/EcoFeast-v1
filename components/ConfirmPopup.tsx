import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { ModalShell } from './ui';

interface ConfirmPopupProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}) => {
  const Icon = isDestructive ? Trash2 : AlertTriangle;
  const topBar = isDestructive ? 'from-rose-500 to-red-500' : 'from-amber-500 to-orange-400';
  const iconBg = isDestructive ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-amber-50 dark:bg-amber-950/40';
  const iconColor = isDestructive ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';
  const badgeText = isDestructive ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';
  const confirmBtn = isDestructive
    ? 'bg-rose-600 hover:bg-rose-500 text-white'
    : 'bg-amber-500 hover:bg-amber-400 text-white';

  return (
    <ModalShell open={open} onClose={onCancel} maxWidthClassName="max-w-sm" contentClassName="p-0" showCloseButton={false}>
      <div className="overflow-hidden rounded-3xl">
        {/* colour bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${topBar}`} />

        <div className="px-6 pt-6 pb-7">
          {/* close */}
          <div className="flex justify-end mb-4">
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* icon + label */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon size={22} className={iconColor} />
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${badgeText}`}>
              {isDestructive ? 'Confirm Deletion' : 'Please Confirm'}
            </span>
          </div>

          {/* text */}
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>

          {/* actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${confirmBtn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
