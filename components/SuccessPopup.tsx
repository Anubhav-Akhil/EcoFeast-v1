import React from 'react';
import { AlertPopup } from './AlertPopup';

interface SuccessPopupProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({ open, title, message, onClose }) => (
  <AlertPopup open={open} type="success" title={title} message={message} onClose={onClose} />
);
