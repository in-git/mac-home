import {
  Apple,
  Compass,
  ExternalLink,
  Github,
  MoreHorizontal,
  Palette,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Modal } from '../components/Modal';
import { PRESET_DATA } from '../data/presetData';
import { QuickShortcut } from '../types';
import { playSound } from '../utils/sound';

interface ShortcutsWidgetProps {
  /** 是否处于无头模态（放大）状态：网格区域填满模态高度，图标从左上开始流式排列 */
  expanded?: boolean;
  /** grid 模式下点击 header「更多」时触发的放大（全屏）回调，由仪表盘传入 */
  onExpand?: () => void;
}

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({
  expanded = false,
  onExpand,
}) => {
  const [shortcuts, setShortcuts] = useState<QuickShortcut[]>(
    PRESET_DATA.INITIAL_SHORTCUTS,
  );
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('Compass');
  const [newColor, setNewColor] = useState(
    'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
  );

  // ---- Header 操作按钮 ----
  const actions = [
    {
      key: 'add',
      label: '添加网址',
      icon: <Plus size={13} />,
      className: 'bg-[#007AFF] text-white hover:bg-blue-600 shadow-xs',
      onClick: () => {
        setShowAdd(true);
      },
    },
  ];

  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(actions.length);

  // JS 动态计算：测量按钮区可用宽度，超出则折叠多余按钮，仅保留「更多」
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const avail = container.clientWidth;
      const els = actionsRef.current;
      // 先临时全部显示以测得真实宽度（隐藏元素 offsetWidth 为 0）
      els.forEach((el) => {
        if (el) el.style.display = '';
      });
      const widths = els.map((el) => el?.offsetWidth ?? 0);
      const moreW = moreRef.current?.offsetWidth ?? 36;
      const gap = 8; // 对应 gap-2
      const total = widths.reduce((s, w) => s + w + gap, 0) - gap;
      if (total <= avail) {
        setVisibleCount(actions.length);
        return;
      }
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const next = used + widths[i] + gap;
        // 必须预留「更多」按钮的位置
        if (next + moreW > avail) break;
        used = next;
        count++;
      }
      setVisibleCount(Math.max(count, 1)); // 始终保留「添加网址」
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [actions.length, expanded]);

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

    setShortcuts(shortcuts.filter((s) => s.id !== id));
  };

  return (
    <div className="h-full flex flex-col text-xs p-1 text-slate-800 dark:text-slate-100">
      {/* Header：右侧操作按钮由 JS 测量溢出，放不下的收进「更多」 */}
      <div
        ref={headerRef}
        className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10"
      >
        <div className="flex items-center space-x-2">
          <Compass size={16} className="text-[#007AFF]" />
          <span className="font-bold text-sm tracking-tight">快捷导航</span>
        </div>

        <div ref={containerRef} className="flex items-center gap-2">
          {actions.map((a, i) => (
            <button
              key={a.key}
              ref={(el) => {
                actionsRef.current[i] = el;
              }}
              onClick={a.onClick}
              title={a.label}
              className={`p-1 rounded-lg transition-transform active:scale-95 ${a.className} ${
                i >= visibleCount ? 'hidden' : ''
              }`}
            >
              {a.icon}
            </button>
          ))}
          {!expanded && (
            <button
              ref={moreRef}
              onClick={() => onExpand?.()}
              title="更多"
              className={`p-1 rounded-lg bg-black/5 dark:bg-white/10 text-slate-500 hover:bg-black/10 dark:hover:bg-white/15 transition-transform active:scale-95 ${
                visibleCount >= actions.length ? 'hidden' : ''
              }`}
            >
              <MoreHorizontal size={13} />
            </button>
          )}
        </div>
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
          （3 → 4 → 6 → 8 → 10 → 12），普通卡片窄、放大模态宽，自动适配。 */}
      <div
        className={`${expanded ? 'flex-1 min-h-0' : 'max-h-52'} my-2 overflow-y-auto pr-1 @container`}
      >
        <div className="grid grid-cols-3 @sm:grid-cols-4 @md:grid-cols-6 @lg:grid-cols-6 @xl:grid-cols-10 @2xl:grid-cols-12 gap-3">
          {shortcuts.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => playSound.playClick()}
              className="group relative flex flex-col rounded-2xl transition-colors shadow-xs text-center aspect-square"
            >
              <div className="relative group/icon w-full flex-1">
                <div
                  className={`relative w-full aspect-square rounded-xl flex items-center justify-center shadow-sm ${
                    item.bgColor || 'bg-slate-800 text-white'
                  } transition-transform `}
                >
                  {getIcon(item.iconName, 'w-[30%] h-[30%]')}
                </div>

                {/* Hover Delete — only when the ICON itself is hovered */}
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="absolute top-1 right-1 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover/icon:opacity-100 transition-opacity"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <span className="font-semibold text-font-sm truncate w-full mt-1 text-slate-800 dark:text-slate-100">
                {item.title}
              </span>
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
