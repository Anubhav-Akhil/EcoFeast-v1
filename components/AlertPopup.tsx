import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { ModalHeader, ModalShell, primaryButtonClassName } from './ui';

export type PopupType = 'success' | 'error' | 'warning' | 'info';

interface AlertPopupProps {
  open: boolean;
  type: PopupType;
  title: string;
  message: string;
  onClose: () => void;
}

const config = {
  success: {
    icon: <CheckCircle2 size={24} />,
    tone: 'success' as const,
    btn: primaryButtonClassName,
  },
  error: {
    icon: <XCircle size={24} />,
    tone: 'danger' as const,
    btn: 'inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(225,29,72,0.2)] transition-all hover:-translate-y-0.5 hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-500/20',
  },
  warning: {
    icon: <AlertCircle size={24} />,
    tone: 'warning' as const,
    btn: 'inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(245,158,11,0.22)] transition-all hover:-translate-y-0.5 hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/20',
  },
  info: {
    icon: <Info size={24} />,
    tone: 'info' as const,
    btn: 'inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition-all hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/20',
  },
};

export const AlertPopup: React.FC<AlertPopupProps> = ({ open, type, title, message, onClose }) => {
  const c = config[type];

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClassName="max-w-md">
      <div className="space-y-7">
        <ModalHeader
          title={title}
          description={message}
          icon={c.icon}
          tone={c.tone}
          eyebrow="Notification"
          align="center"
        />
        <button onClick={onClose} className={`w-full ${c.btn}`}>
          Okay
        </button>
      </div>
    </ModalShell>
  );
};
