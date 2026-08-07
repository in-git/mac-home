import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { playSound } from '../utils/sound';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Header title. When omitted, no header (and no close button) is rendered. */
  title?: React.ReactNode;
  /** Optional icon rendered before the title. */
  icon?: React.ReactNode;
  /** Tailwind max-width utility for the card, e.g. 'max-w-2xl'. */
  maxWidth?: string;
  /** Close when clicking the backdrop. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** Show the X close button. Defaults to true (only meaningful with a title). */
  showCloseButton?: boolean;
  children: React.ReactNode;
}

/**
 * Generic centered modal: backdrop blur + glass card with a spring scale-in
 * animation, optional header (title + close button), Esc-to-close and
 * click-backdrop-to-close. Reused by every local modal in the app.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  maxWidth = 'max-w-2xl',
  closeOnBackdrop = true,
  showCloseButton = true,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playSound.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
          onMouseDown={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) {
              playSound.playClick();
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full ${maxWidth} glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/50 dark:border-white/15 text-slate-800 dark:text-slate-100 max-h-[85vh] flex flex-col`}
          >
            {title && (
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {icon}
                  <h2 className="text-base font-semibold">{title}</h2>
                </div>
                {showCloseButton && (
                  <button
                    onClick={() => {
                      playSound.playClick();
                      onClose();
                    }}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
