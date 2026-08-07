import {
  Apple,
  Compass,
  ExternalLink,
  Github,
  Palette,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Modal } from '../components/Modal';
import { INITIAL_SHORTCUTS } from '../data/presetData';
import { QuickShortcut } from '../types';
import { playSound } from '../utils/sound';

interface ShortcutsWidgetProps {
  /** 是否处于无头模态（放大）状态：网格区域填满模态高度，图标从左上开始流式排列 */
  expanded?: boolean;
}

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({
  expanded = false,
}) => {
  const [shortcuts, setShortcuts] =
    useState<QuickShortcut[]>(INITIAL_SHORTCUTS);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('Compass');
  const [newColor, setNewColor] = useState(
    'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
  );

  const ICON_OPTIONS = [
    'Compass',
    'Apple',
    'Github',
    'Palette',
    'Sparkles',
    'StickyNote',
  ] as const;
  const COLOR_OPTIONS = [
    'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
    'bg-gradient-to-tr from-pink-500 to-rose-500 text-white',
    'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white',
    'bg-gradient-to-tr from-amber-500 to-orange-500 text-white',
    'bg-gradient-to-tr from-violet-500 to-purple-600 text-white',
    'bg-slate-800 text-white',
  ];

  // className 传百分比尺寸（如 w-[30%] h-[30%]）时，图标会随 group/icon 容器大小等比缩放
  const getIcon = (iconName: string, className?: string) => {
    switch (iconName) {
      case 'Apple':
        return <Apple size={18} className={className} />;
      case 'Github':
        return <Github size={18} className={className} />;
      case 'Palette':
        return <Palette size={18} className={className} />;
      case 'Sparkles':
        return <Sparkles size={18} className={className} />;
      case 'Compass':
        return <Compass size={18} className={className} />;
      default:
        return <StickyNote size={18} className={className} />;
    }
  };

  const resetAddForm = () => {
    setNewTitle('');
    setNewUrl('');
    setNewIcon('Compass');
    setNewColor('bg-gradient-to-tr from-blue-600 to-indigo-600 text-white');
  };

  const handleAddShortcut = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;

    playSound.playClick();
    const item: QuickShortcut = {
      id: `sc-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.startsWith('http')
        ? newUrl.trim()
        : `https://${newUrl.trim()}`,
      iconName: newIcon,
      category: '自定义',
      bgColor: newColor,
    };

    setShortcuts([...shortcuts, item]);
    resetAddForm();
    setShowAdd(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound.playClick();
    setShortcuts(shortcuts.filter((s) => s.id !== id));
  };

  return (
    <div className="h-full flex flex-col text-xs p-1 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <Compass size={16} className="text-[#007AFF]" />
          <span className="font-bold text-sm tracking-tight">
            快捷导航 (Launchpad)
          </span>
        </div>

        <button
          onClick={() => {
            playSound.playClick();
            setShowAdd(true);
          }}
          className="p-1 rounded-lg bg-[#007AFF] text-white hover:bg-blue-600 shadow-xs transition-transform active:scale-95"
          title="添加网址"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Add Shortcut Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false);
          resetAddForm();
        }}
        title="添加快捷网址"
        icon={<Plus size={16} className="text-[#007AFF]" />}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">
              网站名称
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddShortcut()}
              placeholder="如 Google"
              className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 outline-none text-sm focus:ring-2 ring-[color:var(--accent)]/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">
              网址 URL
            </label>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddShortcut()}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 outline-none text-sm focus:ring-2 ring-[color:var(--accent)]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">图标</label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((name) => (
                <button
                  key={name}
                  onClick={() => setNewIcon(name)}
                  className={`p-2 rounded-lg flex items-center justify-center border transition-colors ${
                    newIcon === name
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {getIcon(name)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">颜色</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-8 rounded-lg ${c} border-2 transition-transform ${
                    newColor === c
                      ? 'border-[color:var(--accent)] scale-105'
                      : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                resetAddForm();
              }}
              className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleAddShortcut}
              className="px-4 py-1.5 rounded-lg bg-[#007AFF] text-white font-medium hover:bg-blue-600 transition-colors"
            >
              确定添加
            </button>
          </div>
        </div>
      </Modal>

      {/* Grid of Shortcuts */}
      {/* 容器查询实现响应式列数：一排最多 12 个，随容器宽度依次减少
          （2 → 3 → 4 → 6 → 8 → 10 → 12），普通卡片窄、放大模态宽，自动适配。 */}
      <div
        className={`${expanded ? 'flex-1 min-h-0' : 'max-h-52'} my-2 overflow-y-auto pr-1 @container`}
      >
        <div className="grid grid-cols-2 @xs:grid-cols-3 @sm:grid-cols-4 @md:grid-cols-6 @lg:grid-cols-8 @xl:grid-cols-10 @2xl:grid-cols-12 gap-3">
          {shortcuts.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => playSound.playClick()}
              className="group relative flex flex-col p-2  rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors shadow-xs text-center border border-white/40 dark:border-white/10 aspect-square"
            >
              <div
                className={`group/icon relative w-full flex-1 aspect-square rounded-xl flex items-center justify-center shadow-sm ${
                  item.bgColor || 'bg-slate-800 text-white'
                } transition-transform group-hover/icon:scale-105`}
              >
                {getIcon(item.iconName, 'w-[30%] h-[30%]')}
              </div>
              <span className="font-semibold text-font-sm truncate w-full mt-1 text-slate-800 dark:text-slate-100">
                {item.title}
              </span>

              {/* Hover Delete — only when the ICON itself is hovered */}
              <button
                onClick={(e) => handleDelete(item.id, e)}
                className="absolute top-1 right-1 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover/icon:opacity-100 transition-opacity"
              >
                <Trash2 size={11} />
              </button>
            </a>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex justify-between items-center text-font-sm text-slate-400">
        <span>已关联 {shortcuts.length} 个书签</span>
        <span className="flex items-center space-x-1">
          <ExternalLink size={10} />
          <span>新标签页打开</span>
        </span>
      </div>
    </div>
  );
};
