import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  destructiveButtonClassName,
  ModalHeader,
  ModalShell,
  primaryButtonClassName,
  secondaryButtonClassName,
} from './ui';

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
  return (
    <ModalShell open={open} onClose={onCancel} maxWidthClassName="max-w-md">
      <div className="space-y-7">
        <ModalHeader
          title={title}
          description={message}
          icon={<AlertCircle size={24} />}
          tone={isDestructive ? 'danger' : 'warning'}
          eyebrow="Please Confirm"
          align="center"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={onCancel} className={secondaryButtonClassName}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={isDestructive ? destructiveButtonClassName : primaryButtonClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
