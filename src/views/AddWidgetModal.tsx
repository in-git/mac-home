import {
  AlarmClock,
  Clock,
  CloudSun,
  Compass,
  Globe,
  Search,
  Settings,
  SlidersHorizontal,
  StickyNote,
  X,
  type LucideIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAddableWidgetsByCategory, getWidgetConfig } from '../data/widgetConfig';
import type { WidgetCategory } from '../data/widgetConfig';
import { WidgetItem, WidgetType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
  widgets: WidgetItem[];
}

/** 每个小组件类型对应的细线性图标（遵循 Apple HIG 细线性图标风格） */
const WIDGET_ICONS: Record<WidgetType, LucideIcon> = {
  search: Search,
  weather: CloudSun,
  'sticky-notes': StickyNote,
  clock: Clock,
  'clock-mini': AlarmClock,
  shortcuts: Compass,
  'control-center': SlidersHorizontal,
  settings: Settings,
  'icon-grid': Search,
  application: Globe,
};

/** 图标气泡哑光底色（主色以主题色点缀） */
const WIDGET_ICON_BUBBLE: Record<WidgetType, string> = {
  search: 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]',
  weather: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'sticky-notes': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  clock: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'clock-mini': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  shortcuts: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'control-center': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  settings: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  'icon-grid': 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  application: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

/** 侧边栏分类配置 */
const CATEGORIES: { id: WidgetCategory; label: string; icon: React.ReactNode }[] = [
  {
    id: 'system',
    label: '系统组件',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-sky-400 to-indigo-500 text-white">
        <Settings size={15} />
      </span>
    ),
  },
  {
    id: 'web',
    label: '网页',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
        <Globe size={15} />
      </span>
    ),
  },
];

const MODAL_TRANSITION_MS = 150;

export const AddWidgetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddWidget,
  widgets,
}) => {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [activeCategory, setActiveCategory] = useState<WidgetCategory>('system');

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setActiveCategory('system');
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), MODAL_TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentWidgets = getAddableWidgetsByCategory(activeCategory);

  return createPortal(
    mounted && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          style={{
            transform: visible ? 'scale(1)' : 'scale(0.92)',
            opacity: visible ? 1 : 0,
            transition: `transform ${MODAL_TRANSITION_MS}ms ease-out, opacity ${MODAL_TRANSITION_MS}ms ease-out`,
          }}
          className="flex flex-col sm:flex-row w-full h-full sm:w-[75%] sm:h-[80vh] rounded-none sm:rounded-[var(--card-radius)] shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1C1C1E]"
        >
          {/* 左侧栏 */}
          <div className="flex sm:flex-col gap-1 p-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] sm:w-52 shrink-0 overflow-x-auto sm:overflow-y-auto border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10">
            <div className="hidden sm:block px-2.5 pt-2 pb-3">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                添加组件
              </h1>
            </div>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-[var(--card-radius)] transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-[#3A3A3C] shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {cat.icon}
                  <span
                    className={`font-medium ${
                      active
                        ? 'text-[color:var(--accent)] dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 顶部：关闭按钮 */}
            <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-black/5 dark:border-white/10">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </h2>
              <button
                onClick={onClose}
                aria-label="关闭"
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 组件网格 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                {currentWidgets.map((t) => {
                  const count = widgets.filter((w) => w.type === t.type).length;
                  const max = getWidgetConfig(t.type).maxInstances;
                  const disabled = max !== Infinity && count >= max;
                  const Icon = WIDGET_ICONS[t.type];
                  return (
                    <button
                      key={t.type}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onAddWidget(t.type);
                        onClose();
                      }}
                      className={`flex flex-col items-center gap-2 rounded-[var(--card-radius)] bg-black/5 px-3 py-3.5 transition-colors dark:bg-white/10 ${
                        disabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-black/10 active:scale-95 dark:hover:bg-white/15'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-[var(--card-radius)] ${WIDGET_ICON_BUBBLE[t.type]}`}
                      >
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      <span className="text-center text-xs font-medium text-slate-700 dark:text-slate-200">
                        {t.label}
                      </span>
                      {disabled && (
                        <span className="text-xs text-slate-400">已添加</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body,
  );
};