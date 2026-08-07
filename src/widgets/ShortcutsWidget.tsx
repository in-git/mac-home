import React, { useState } from 'react';
import {
  Compass,
  Plus,
  ExternalLink,
  Trash2,
  Apple,
  Github,
  Palette,
  Sparkles,
  StickyNote
} from 'lucide-react';
import { QuickShortcut } from '../types';
import { INITIAL_SHORTCUTS } from '../data/presetData';
import { playSound } from '../utils/sound';

export const ShortcutsWidget: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<QuickShortcut[]>(INITIAL_SHORTCUTS);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Apple':
        return <Apple size={18} />;
      case 'Github':
        return <Github size={18} />;
      case 'Palette':
        return <Palette size={18} />;
      case 'Sparkles':
        return <Sparkles size={18} />;
      case 'Compass':
        return <Compass size={18} />;
      default:
        return <StickyNote size={18} />;
    }
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    playSound.playClick();
    const item: QuickShortcut = {
      id: `sc-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
      iconName: 'Compass',
      category: '自定义',
      bgColor: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
    };

    setShortcuts([...shortcuts, item]);
    setNewTitle('');
    setNewUrl('');
    setShowAdd(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound.playClick();
    setShortcuts(shortcuts.filter((s) => s.id !== id));
  };

  return (
    <div className="h-full flex flex-col justify-between text-xs p-1 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <Compass size={16} className="text-[#007AFF]" />
          <span className="font-bold text-sm tracking-tight">快捷导航 (Launchpad)</span>
        </div>

        <button
          onClick={() => {
            playSound.playClick();
            setShowAdd(!showAdd);
          }}
          className="p-1 rounded-lg bg-[#007AFF] text-white hover:bg-blue-600 shadow-xs transition-transform active:scale-95"
          title="添加网址"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Add Shortcut Form */}
      {showAdd && (
        <form onSubmit={handleAddShortcut} className="my-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="网站名称 (如 Google)"
            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 outline-none text-xs"
          />
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="网址 URL (https://...)"
            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 outline-none text-xs"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-2.5 py-1 rounded-lg text-slate-500 hover:bg-black/5"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-[#007AFF] text-white font-medium"
            >
              确定添加
            </button>
          </div>
        </form>
      )}

      {/* Grid of Shortcuts */}
      <div className="grid grid-cols-3 gap-3 my-2 overflow-y-auto max-h-52 pr-1">
        {shortcuts.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => playSound.playClick()}
            className="group relative flex flex-col items-center justify-center p-3 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all shadow-xs text-center border border-white/40 dark:border-white/10"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 shadow-sm ${
                item.bgColor || 'bg-slate-800 text-white'
              } transition-transform group-hover:scale-105`}
            >
              {getIcon(item.iconName)}
            </div>
            <span className="font-semibold text-[11px] truncate w-full text-slate-800 dark:text-slate-100">
              {item.title}
            </span>

            {/* Hover Delete */}
            <button
              onClick={(e) => handleDelete(item.id, e)}
              className="absolute top-1 right-1 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={11} />
            </button>
          </a>
        ))}
      </div>

      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex justify-between items-center text-[10px] text-slate-400">
        <span>已关联 {shortcuts.length} 个书签</span>
        <span className="flex items-center space-x-1">
          <ExternalLink size={10} />
          <span>新标签页打开</span>
        </span>
      </div>
    </div>
  );
};
