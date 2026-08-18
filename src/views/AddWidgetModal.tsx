import {
  Globe,
  Settings,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getAddableWidgetsByCategory,
  getWidgetConfig,
  isWebGrid,
  WIDGET_ICONS,
} from '../data/widgetConfig';
import type { WidgetCategory } from '../data/widgetConfig';
import type { SiteItem } from '../api/site';
import { WebListPicker } from './WebListPicker';
import { WidgetItem, WidgetType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
  /** 网页分类中点击「添加」时回调：把站点做成桌面网页组件（web-grid） */
  onAddSite: (item: SiteItem) => void;
  /** 网页分类中点击「删除」时回调：移除对应的桌面图标 */
  onRemoveSite: (item: SiteItem) => void;
  widgets: WidgetItem[];
}

/** 界面文案集中配置（遵循 UI 规范：文本抽成变量，便于统一管理与复用） */
const ADD_WIDGET_TEXT = {
  title: '添加组件',
  categorySystem: '系统组件',
  categoryWeb: '网页',
  close: '关闭',
  added: '已添加',
  addToDesktop: '添加到桌面',
  removeFromDesktop: '从桌面移除',
} as const;

/** 侧边栏分类配置 */
const CATEGORIES: { id: WidgetCategory; label: string; icon: React.ReactNode }[] = [
  {
    id: 'web',
    label: ADD_WIDGET_TEXT.categoryWeb,
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
        <Globe size={15} />
      </span>
    ),
  },
  {
    id: 'system',
    label: ADD_WIDGET_TEXT.categorySystem,
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-sky-400 to-indigo-500 text-white">
        <Settings size={15} />
      </span>
    ),
  },
];

const MODAL_TRANSITION_MS = 150;

export const AddWidgetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddWidget,
  onAddSite,
  onRemoveSite,
  widgets,
}) => {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [activeCategory, setActiveCategory] = useState<WidgetCategory>('web');

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setActiveCategory('web');
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

  // 已添加到桌面的站点（web-grid 类型携带 site 数据），用于网页列表中标记「已新增」
  const webSelectedSites = widgets
    .filter((w) => isWebGrid(w.type) && w.data?.site)
    .map((w) => w.data.site as SiteItem);

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
          className="flex flex-col sm:flex-row w-full h-full sm:w-[75%] sm:h-[80vh] lg:h-[90vh] wide:h-[70vh]  rounded-none sm:rounded-[var(--card-radius)] shadow-2xl overflow-hidden  bg-white dark:bg-[#1C1C1E]"
        >
          {/* 左侧栏 */}
          <div className="flex sm:flex-col gap-1 p-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] sm:w-52 shrink-0 overflow-x-auto sm:overflow-y-auto border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10">
            <div className="hidden sm:block px-2.5 pt-2 pb-3">
              <h1 className="text-lg  dark:text-white">
                {ADD_WIDGET_TEXT.title}
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
                    className={` ${
                      active
                        ? 'text-[color:var(--accent)] dark:text-white'
                        : ' '
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
              <h2 className="text-base  dark:text-white">
                {CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 网页分类：使用公共「网页列表」选择器，添加后生成桌面图标；系统分类沿用组件网格 */}
            {activeCategory === 'web' ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <WebListPicker
                  selected={webSelectedSites}
                  onAdd={onAddSite}
                  onRemove={onRemoveSite}
                />
              </div>
            ) : (
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
                          className="flex h-9 w-9 items-center justify-center rounded-[var(--card-radius)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                        >
                          <Icon size={18} strokeWidth={1.75} />
                        </span>
                        <span className="text-center text-xs  ">
                          {t.label}
                        </span>
                        {disabled && (
                          <span className="text-xs ">
                            {ADD_WIDGET_TEXT.added}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    document.body,
  );
};