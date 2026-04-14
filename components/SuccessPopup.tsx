import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessPopupProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({ open, title, message, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-2xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center"
            >
              <CheckCircle2 size={36} />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
            <button
              onClick={onClose}
              className="w-full bg-eco-600 text-white py-3 rounded-xl font-semibold hover:bg-eco-700 transition"
            >
              Continue
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

