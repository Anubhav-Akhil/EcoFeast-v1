import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ModalHeader, ModalShell, primaryButtonClassName } from './ui';

interface SuccessPopupProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({ open, title, message, onClose }) => {
  return (
    <ModalShell open={open} onClose={onClose} maxWidthClassName="max-w-md">
      <div className="space-y-7">
        <ModalHeader
          title={title}
          description={message}
          icon={<CheckCircle2 size={24} />}
          tone="success"
          eyebrow="Success"
          align="center"
        />
        <button onClick={onClose} className={`w-full ${primaryButtonClassName}`}>
          Continue
        </button>
      </div>
    </ModalShell>
  );
};
