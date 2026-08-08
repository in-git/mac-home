import { Settings as SettingsIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect } from 'react';
import { playSound } from '../utils/sound';
import { SettingsWidget } from '../widgets/SettingsWidget';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/20 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl rounded-2xl shadow-2xl border border-black/5 dark:border-white/15 overflow-hidden text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1C1C1E]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <SettingsIcon size={16} className="text-[#007AFF]" />
              <span className="font-bold text-sm tracking-tight">系统设置</span>
            </div>
            <button
              onClick={() => {
                playSound.playClick();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          {/* Settings body */}
          <div className="p-3 max-h-[80vh] overflow-y-auto">
            <SettingsWidget />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
