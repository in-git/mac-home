import { Bot, Palette, Settings as SettingsIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';

import { SettingsWidget } from '../widgets/SettingsWidget';
import type { SettingsTab } from '../widgets/SettingsWidget/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'appearance',
    label: '外观',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-sky-400 to-indigo-500 text-white">
        <Palette size={15} />
      </span>
    ),
  },
  {
    id: 'system',
    label: '系统',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-slate-400 to-slate-600 text-white">
        <SettingsIcon size={15} />
      </span>
    ),
  },
  {
    id: 'ai',
    label: 'AI 与宠物',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white">
        <Bot size={15} />
      </span>
    ),
  },
];

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

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
          className="flex flex-col sm:flex-row w-full h-full rounded-none sm:w-[80%] sm:h-[85vh] sm:rounded-[var(--card-radius)] lg:w-[70%] lg:h-[80vh] shadow-2xl border border-black/5 dark:border-white/15 overflow-hidden text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1C1C1E]"
        >
          {/* 左侧栏：苹果系统设置风格，大图标 + 文字 */}
          <div className="flex sm:flex-col gap-1 p-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] sm:w-56 shrink-0 overflow-x-auto sm:overflow-y-auto border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10">
            {/* 顶部标题：系统设置 */}
            <div className="hidden sm:block px-2.5 pt-2 pb-3">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                系统设置
              </h1>
            </div>
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-[var(--card-radius)] transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-[#3A3A3C] shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {t.icon}
                  <span
                    className={`font-medium ${
                      active
                        ? 'text-[color:var(--accent)] dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 右侧顶部：关闭按钮 */}
            <div className="flex items-center justify-end px-3 h-11 shrink-0 border-b border-black/5 dark:border-white/10">
              <button
                onClick={onClose}
                aria-label="关闭"
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SettingsWidget activeTab={activeTab} />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
