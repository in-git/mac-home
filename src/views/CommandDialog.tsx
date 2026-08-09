import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CornerDownLeft, Search } from 'lucide-react';
import { StickyNote, CloudSun, Clock, Compass, Sliders } from 'lucide-react';
import { StickyNoteType, WidgetType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notes: StickyNoteType[];
  onAddWidget: (type: WidgetType) => void;
}

interface CommandItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  run: () => void;
}

/**
 * Command palette dialog anchored to the bottom-center of the screen.
 * Opened by pressing Enter anywhere on the desktop (when no input is focused).
 */
export const CommandDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  notes,
  onAddWidget,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Esc to close + auto-focus the input on open.
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const widgetCommands: CommandItem[] = [
    { id: 'weather', name: '添加 天气预报小组件', icon: CloudSun, run: () => onAddWidget('weather') },
    { id: 'sticky', name: '添加 便签小组件', icon: StickyNote, run: () => onAddWidget('sticky-notes') },
    { id: 'clock', name: '添加 时钟与日历', icon: Clock, run: () => onAddWidget('clock') },
    { id: 'control', name: '添加 控制中心', icon: Sliders, run: () => onAddWidget('control-center') },
    { id: 'shortcuts', name: '添加 快捷导航 Launchpad', icon: Compass, run: () => onAddWidget('shortcuts') },
  ].map((c) => ({
    ...c,
    run: () => {
      c.run();
      onClose();
    },
  }));

  const noteCommands: CommandItem[] = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.content.toLowerCase().includes(query.toLowerCase()),
    )
    .map((n) => ({
      id: `note-${n.id}`,
      name: n.title || '未命名便签',
      icon: StickyNote,
      run: () => onClose(),
    }));

  const filteredWidget = widgetCommands.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const groups: { title: string; items: CommandItem[] }[] = [
    ...(filteredWidget.length ? [{ title: '功能 & 小组件', items: filteredWidget }] : []),
    ...(noteCommands.length ? [{ title: '便签卡片', items: noteCommands }] : []),
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-end justify-center pb-24 px-4 bg-black/20 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-white/50 dark:border-white/15 overflow-hidden text-slate-800 dark:text-slate-100"
        >
          {/* Search Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-black/5 dark:border-white/10">
            <Search size={20} className="text-[#007AFF] shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入命令或搜索…"
              className="w-full bg-transparent border-none text-base outline-none placeholder-slate-400 font-normal"
            />
            <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
              ESC 退出
            </span>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
            {groups.length === 0 && (
              <div className="px-3 py-6 text-center text-slate-400 dark:text-slate-500">
                没有匹配的结果
              </div>
            )}
            {groups.map((g) => (
              <div key={g.title}>
                <div className="px-3 py-1 text-font-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {g.title}
                </div>
                {g.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.run}
                      className="w-full px-3 py-2 rounded-xl hover:bg-[#007AFF] hover:text-white flex items-center space-x-3 transition-colors text-left"
                    >
                      <Icon size={16} />
                      <span className="font-medium flex-1">{item.name}</span>
                      <CornerDownLeft
                        size={13}
                        className="opacity-50 shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
